# ActionLayer Architecture Documentation

## 1. System Overview

ActionLayer is structured as a modular, decoupled monorepo containing:
- A mobile-first client built with **React Native 0.86**, **Expo 57**, **Expo Router 57**, and **React 19**, running on both native devices and modern mobile web browsers.
- An **Express 5** REST API backend server running on Node.js 20+ (port 5001).
- A local **PostgreSQL 16** database managed via **Drizzle ORM** and Docker.
- A server-side **Google Gemini Developer API (Free Tier)** integration for multimodal document understanding.
- A **RevenueCat (`react-native-purchases`)** integration for in-app paywall management and Pro entitlement gating.

```
┌─────────────────────────────────────────────────────────┐
│              Mobile Client (iOS / Android / Web)         │
│  React Native 0.86 · Expo 57 · React 19 · RevenueCat    │
│  Spatial Liquid Glass System (expo-blur / reanimated)   │
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

## 2. Technology Stack & Package Versions

### Client Architecture
- **Framework:** React Native `0.86.3` with Expo `~57.0.7` and Expo Router `~57.0.7`.
- **Core Library:** React `19.2.3` and React DOM `19.2.3`.
- **Web Runtime:** React Native Web `~0.21.0` with PWA meta-tag injection and touch optimization.
- **Monetization:** RevenueCat official SDK `react-native-purchases` `^10.10.1`.
- **Design System:** Custom "Spatial Liquid Glass" component system powered by `expo-blur` `~57.0.2`, `expo-glass-effect` `~57.0.1`, and `react-native-reanimated` `4.5.1`.
- **Client Cache & State:** React Context, `@tanstack/react-query`, and `@react-native-async-storage/async-storage` `2.2.0`.
- **Authentication Bridge:** `@clerk/expo` `^4.6.8` with `expo-secure-store` token cache (configured for future multi-user deployments; competition build operates in local single-user mode).

### Server Architecture
- **Web Framework:** Express `^5.2.1` with `pino-http` structured logging and CORS support.
- **File Upload Intake:** Multer `^1.4.5-lts.1` configured with memory storage and strict 10MB bounds.
- **Database & ORM:** Drizzle ORM with `pg` driver communicating with PostgreSQL 16.
- **Validation Engine:** Zod catalog with runtime schema parsing for all API inputs and AI outputs.
- **Unit Testing:** Vitest `^5.0.1` running 17 deterministic automated tests.

---

## 3. Persistence Model Boundary

ActionLayer strictly defines the boundary between client state and server persistence:

- **Authoritative Data Store (PostgreSQL):** PostgreSQL 16 is the single authoritative system of record for all sources, extraction jobs, claims, workflows, tasks, dependencies, evidence records, verifications, and audit events. All mutations are committed to PostgreSQL.
- **Client Cache (AsyncStorage):** `@react-native-async-storage/async-storage` is used exclusively on the client for local preferences (wallpaper selection, background dimming ratio, cached agent views, and transient offline presentation). AsyncStorage is **not** an authoritative store for workflow data.

---

## 4. Entity Relationship Model

```
actionlayer_users
  │ 1
  ├───< actionlayer_sources
  │       │ 1
  │       ├───< actionlayer_extraction_jobs
  │       ├───< actionlayer_claims
  │       │       │ 1
  │       │       └───< actionlayer_task_claims >───┐
  │       │                                         │
  │       └───< actionlayer_workflow_sources >──┐   │
  │                                             │   │
  └───< actionlayer_workflows                   │   │
          │ 1                                   │   │
          ├─────────────────────────────────────┘   │
          │ 1                                       │
          ├───< actionlayer_tasks <─────────────────┘
          │       │ 1
          │       ├───< actionlayer_task_dependencies (prereq -> dependent)
          │       │
          │       └───< actionlayer_evidence
          │               │ 1
          │               └───< actionlayer_verifications
          │
          ├───< actionlayer_reminders
          ├───< actionlayer_audit_events
          └───< actionlayer_notifications
```

---

## 5. AI System Architecture & Safety Rules

1. **Configurable Model & Multimodal Pipeline:**
   - Active model identifier is configured via `GEMINI_MODEL` (default: `gemini-2.5-flash`).
   - Every extraction records the provider (`gemini` or `mock`), model identifier, processing duration, and request timestamp.
   - The multimodal pipeline transmits image buffers (JPEG, PNG, WebP), raw PDF documents, or pasted text directly to Gemini's `generateContent` endpoint.

2. **Strict Zod Parsing & Schema Enforcement:**
   - Gemini is instructed via system prompt to output valid JSON matching the target schema.
   - The raw response is parsed in memory and validated against comprehensive Zod schemas (`ExtractionResponseSchema`, `VerificationResultSchema`).
   - Malformed, non-JSON, or schema-invalid responses trigger retries against candidate models. If all retries fail, an explicit error is returned. Partial or corrupted AI data is **never** persisted.

3. **Data Minimization (No Raw JSON Dumping):**
   - In accordance with privacy and storage minimization, raw model text responses are parsed in volatile memory and discarded.
   - The database stores only validated, structured claims and tasks with specific source citations. Full raw LLM responses are not stored indefinitely in the database.

4. **Zero Silent Fallback Policy:**
   - If `AI_PROVIDER=gemini` and the Gemini API key fails or quota is exhausted, the application returns an honest HTTP 502/503 error with an actionable message and a manual-entry option.
   - The system **never** silently swaps to mock data when configured for real Gemini operation.
   - `MockAiProvider` operates strictly when `AI_PROVIDER=mock` or during automated test execution.

5. **Server-Side Secret Isolation:**
   - `GEMINI_API_KEY` is exclusively managed on the backend server (`artifacts/api-server`).
   - It is never exposed in client bundles, public environment variables, or client network logs.

---

## 6. Requirement Graph & DAG Engine

ActionLayer models requirements as a Directed Acyclic Graph (DAG) using deterministic TypeScript logic in [`GraphService`](../artifacts/api-server/src/services/graphService.ts):

1. **Topological Validation & Cycle Prevention:**
   - Task dependencies are validated to prevent cycles and self-dependencies (`taskId === prereqId`).
   - Missing prerequisite identifiers are caught and rejected prior to workflow persistence.

2. **Deterministic Task States:**
   - `blocked`: One or more required upstream prerequisites are incomplete.
   - `ready`: All upstream prerequisites have reached `completed_by_user` or `verified`.
   - `in_progress`: Task is actively being executed.
   - `completed_by_user`: User has recorded self-declaration of completion.
   - `partially_verified`: Evidence exists, but one or more criteria remain unmet.
   - `verified`: Applicable verification policy has been fully satisfied.
   - `needs_correction`: Evidence assessment identified deficiencies requiring correction.

3. **Automatic Unblocking:**
   - When an upstream prerequisite transitions to `completed_by_user` or `verified`, downstream tasks automatically recalculate and transition from `blocked` to `ready`.

4. **Execution Flow Modes:**
   - **Strict Sequential Mode (01 → 02 → 03...):** Linearizes the graph to guide users through requirements one at a time.
   - **Parallel DAG Mode:** Displays the full branching dependency graph, allowing parallel execution of decoupled tracks (e.g. Build vs Proposal drafting).

---

## 7. Evidence Verification Levels

ActionLayer organizes evidence verification into four transparent levels (Levels 0 to 3):

- **Level 0 (No Evidence Required):** Simple administrative checkboxes or informational checklist items.
- **Level 1 (User Declaration):** Explicit user self-confirmation with a recorded completion rationale.
- **Level 2 (Evidence Attached):** Verifiable file (image, PDF), plain text artifact, or repository URL attached and stored with SHA-256 checksum.
- **Level 3 (AI-Assisted Assessment):** Evaluated by Gemini against explicit rule completion conditions. Clearly labeled *"AI-assisted assessment"* with transparent evaluation limitations and recommended corrections.

*(Note: External third-party institutional accreditation via external registrar APIs is not claimed and is reserved for future enterprise integrations).*

---

## 8. Four-Factor Readiness Audit

Readiness is evaluated across four distinct dimensions (never collapsed into an opaque single score):

1. **Requirements Completion (%):**
   $$\text{Requirements Completion} = \frac{\sum \text{Weight}(\text{Completed Tasks})}{\sum \text{Weight}(\text{All Tasks})} \times 100$$
   - High-priority tasks are weighted at 2x; medium- and low-priority tasks are weighted at 1x.
   - Completed tasks include those with `completed_by_user` or `verified` status.

2. **Evidence Readiness (%):**
   $$\text{Evidence Readiness} = \frac{\text{Required Tasks with Attached Verified Evidence}}{\text{Total Tasks Requiring Evidence}} \times 100$$
   - Defaults to 100% if no tasks in the workflow require evidence.

3. **Source Confidence:**
   - **High:** 0 unreviewed uncertain claims and no conflicting information.
   - **Medium:** Exactly 1 inferred claim awaiting user review.
   - **Review Required:** Conflicting source statements or $\ge 2$ unreviewed/missing claims.

4. **Deadline Risk:**
   - Categorized as `Low`, `Medium`, `High`, or `Critical`.
   - Computed from remaining days until the target deadline, completion percentage, and the count of currently blocked tasks.

---

## 9. RevenueCat Monetization Architecture

ActionLayer integrates the official RevenueCat `react-native-purchases` SDK:
- **Free Tier:** Unlimited manual checklist creation, source viewing, and basic task management.
- **Pro Tier (`pro` entitlement):** Unlocks unlimited multimodal Gemini AI document extractions, automated 4-factor readiness audits, and custom spatial themes.
- **Cross-Platform Handling:** On native iOS and Android builds, RevenueCat manages offerings, customer info, and sandbox transactions. On web preview environments, RevenueCat calls gracefully bypass native billing APIs without runtime crashes.

---

## 10. Local Protected File Storage

- **Storage Location:** `data/uploads/{userId}/sources/{sourceId}/` and `data/uploads/{userId}/evidence/{taskId}/{evidenceId}/`.
- **Security Controls:**
  - Files are stored in non-public local directories outside the web server root.
  - File size is strictly capped at 10 MB.
  - MIME types and file extensions are validated upon intake.
  - Cryptographically generated safe filenames prevent directory traversal and collision.
  - SHA-256 cryptographic hashes are computed and stored with source records.