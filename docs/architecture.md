# ActionLayer Architecture Documentation

## System Overview

ActionLayer is structured as a decoupled monorepo containing a mobile-first Progressive Web App (PWA) client, an Express 5 REST API server, a local Dockerized PostgreSQL database managed with Drizzle ORM, and server-side Google Gemini Free Tier integration.

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile-First PWA                     │
│         (Expo Router / React 18 / Tailwind CSS)        │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP REST v1
                             ▼
┌─────────────────────────────────────────────────────────┐
│               Express 5 Backend Server                  │
│                      (Port 5001)                        │
├───────────────────┬───────────────────┬─────────────────┤
│    AI Service     │   Graph Service   │ Storage Service │
│ (Gemini / Zod /   │ (DAG Solver /     │ (Local Disk /   │
│  MockAiProvider)  │  Readiness Audit) │  SHA-256 Hash)  │
└─────────┬─────────┴─────────┬─────────┴────────┬────────┘
          │                   │                  │
          ▼                   ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐
│  Google Gemini   │  │  PostgreSQL 16   │  │ Local Files │
│  Developer API   │  │ (Docker / Port   │  │data/uploads/│
│   (Free Tier)    │  │     5432)        │  │  {userId}/  │
└──────────────────┘  └──────────────────┘  └─────────────┘
```

---

## Backend Selection Decision

- **Selected Backend:** Express 5 (`artifacts/api-server`) running on port 5001.
- **Rationale:** The repository already possessed a functional, tested Express 5 backend with complete Drizzle ORM integration, logger, and routing scaffolding. Retaining and enhancing Express 5 avoided redundant API implementations or risky runtime rewriting, ensuring strict separation of client presentation and server data logic.
- **Port Assignment:** Port 5001 was chosen to prevent port collisions on macOS, where port 5000 is occupied by Apple AirPlay Receiver / ControlCenter.

---

## AI System Architecture & Safety Rules

1. **Model Selection:**
   - Default model: `gemini-2.5-flash` (configurable via `process.env.GEMINI_MODEL`).
   - Selected for high multimodal throughput (image posters, multi-page PDFs, and plaintext guidelines) alongside schema-constrained structured output capability.
2. **Strict Zod Schema Enforcement:**
   - Raw model responses are schema-constrained, parsed, and validated against comprehensive Zod schemas (`ExtractionOutputSchema`, `VerificationAssessmentSchema`).
   - Confidence metrics are validated between `0.0` and `1.0`.
   - Confirmed claims require non-empty `sourceExcerpt` citations.
   - Any malformed, non-JSON, or schema-invalid response is rejected completely—partial malformed data is never persisted.
3. **No Silent Mock Fallback:**
   - If `AI_PROVIDER=gemini` and the Gemini API key fails (or rate limits are exceeded), the application returns an honest HTTP 502 error with a clear message. It **never** silently swaps to mock data without user knowledge.
   - `MockAiProvider` operates only when `AI_PROVIDER=mock` or during deterministic automated test execution.
4. **Credential Security:**
   - The Gemini API key is strictly server-side (`process.env.GEMINI_API_KEY`).
   - It is never exposed to client-side bundles, `NEXT_PUBLIC` variables, browser logs, or error responses.

---

## Requirement Graph & DAG Solver

1. **Deterministic Logic:**
   - All task dependencies and blocking logic are computed in TypeScript application code, never delegated to generative models.
2. **Cycle Prevention:**
   - The Graph Service executes Depth-First Search (DFS) topological validation to detect and reject circular dependencies (`hasCycle`).
   - Self-referential dependencies (`taskId === depId`) are rejected during validation.
3. **State Transitions:**
   - `blocked`: One or more required prerequisites remain incomplete.
   - `ready`: All required prerequisites have achieved `completed_by_user` or `verified` status.
   - `in_progress`: Task is actively being worked on.
   - `completed_by_user`: Self-declaration of completion recorded.
   - `verified`: Satisfied with attached Level 1–4 evidence.
4. **Automatic Unblocking:**
   - When an upstream prerequisite transitions to `completed_by_user` or `verified`, downstream tasks automatically recalculate and transition from `blocked` to `ready`.

---

## Evidence Verification Levels

- **Level 0 (No Evidence Required):** Simple administrative or trivial checklist tasks.
- **Level 1 (User Declaration):** Explicit user self-confirmation with rationale recorded.
- **Level 2 (Evidence Attached):** Verifiable file or URL artifact attached and stored.
- **Level 3 (AI-Assisted Assessment):** Evaluated by Gemini against an explicit rubric. Must be labeled *"AI-assisted assessment"* and carries explicit limitation notices.
- **Level 5 (Postponed):** External institutional accreditation is strictly omitted until authoritative third-party APIs exist.

---

## Four-Factor Readiness Audit

Readiness is evaluated across four distinct dimensions (never averaged into a single opaque number):

1. **Requirements Completion (%):**
   $$\text{Completion} = \frac{\sum \text{Weight}(\text{Complete Tasks})}{\sum \text{Weight}(\text{All Tasks})} \times 100$$
   (High priority tasks weighted at 2x, medium/low at 1x).
2. **Evidence Readiness (%):**
   $$\text{Evidence Readiness} = \frac{\text{Required Tasks with Attached Verified Evidence}}{\text{Total Tasks Requiring Evidence}} \times 100$$
3. **Source Confidence:**
   Categorized as `High` (all claims reviewed and confirmed from source), `Medium` (1 claim uncertain), or `Review Required` (multiple unconfirmed, missing, or conflicting claims).
4. **Deadline Risk:**
   Qualitative assessment (`Low`, `Medium`, `High`, `Critical`) determined by remaining days, blocked high-priority tasks, missing evidence, and timezone ambiguities, accompanied by exact contributing reasons.

---

## Local Protected Storage

- **Path:** `data/uploads/{userId}/sources/{sourceId}/` and `data/uploads/{userId}/evidence/{taskId}/{evidenceId}/`.
- **Security Controls:**
  - Files are never placed in public or web-root directories.
  - MIME types, magic byte signatures, and file extensions are validated.
  - Maximum upload size is strictly capped at 10 MB.
  - Files receive cryptographically generated non-guessable storage filenames.
  - SHA-256 hash is computed and stored with source records.