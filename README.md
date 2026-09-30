# ActionLayer

> **Source-Grounded Agentic Action Compiler**  
> *Shipaton 2026 Next Gen Award Submission*  
> *Built by Rashid Riyadh & Team*  
> Licensed under Apache-2.0 · Open Source · Locally Executable

---

## What Is ActionLayer?

**ActionLayer** is a source-grounded, mobile-first agentic workflow application that transforms complex opportunity documents—such as competition posters, hackathon briefs, grant calls, and assignment rubrics—into human-reviewed claims, dependency-aware tasks, and explainable readiness audits.

Instead of generic chat summaries or disjointed todo lists, ActionLayer answers two core questions:
1. **"What is the exact next requirement I can work on without being blocked?"**
2. **"What verifiable evidence will prove this requirement is genuinely complete?"**

---

## Who It Helps

- **Students & Early-Career Builders:** Navigating complex competition rules, hackathons, and fellowship applications with strict submission criteria, deadlines, and multi-step prerequisites.
- **Independent Developers & Researchers:** Applying for open grants and submitting technical projects where missing a single deliverable (such as an open-source license, demo video length, or declaration form) leads to disqualification.
- **Small Teams & Builders:** Managing overwhelming multi-page announcement posters and unstructured PDFs without missing fine-print requirements.

---

## Why It Matters

Most AI productivity tools generate text that looks plausible but hallucinate deadlines, fabricate requirements, and leave applicants uncertain of what has actually been verified. ActionLayer solves this with:

- **Source Grounding:** Every extracted claim remains linked to its exact excerpt and page reference in the preserved original source document.
- **Human-in-the-Loop Review Gates:** Uncertain dates, unstated timezones, or ambiguous terms are explicitly flagged for human confirmation before compiling into tasks.
- **Deterministic DAG Scheduling:** Task dependencies, prerequisite blockers, and next-action calculations run in deterministic application logic—not unpredictable generative prompts.
- **Multi-Level Evidence Verification:** Distinguishes self-declarations (Level 1) and attached artifacts (Level 2) from AI-assisted rubric assessments (Level 3), with transparent evaluation scope.
- **Four-Factor Readiness Auditing:** Separate, explainable visibility into requirements completion, evidence readiness, source confidence, and deadline risk.

---

## How It Works

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│  Source Intake  │  ──>  │  Gemini Free    │  ──>  │ Extraction Review│
│ (Poster/PDF/Txt)│       │  Structured JSON│       │ (Human-in-the-Loop)│
└─────────────────┘       └─────────────────┘       └──────────────────┘
                                                              │
                                                              ▼
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│  Four-Factor    │  <──  │ Multi-Level     │  <──  │ Deterministic    │
│  Readiness Audit│       │ Evidence Attach │       │ DAG Solver & Plan│
└─────────────────┘       └─────────────────┘       └──────────────────┘
```

1. **Intake & Cryptographic Preservation:** Upload an image poster, PDF document, or pasted announcement. Files are saved in local application-managed storage (`data/uploads/{userId}/sources/`) with SHA-256 integrity verification.
2. **Schema-Constrained Extraction:** Processed via Google Gemini API Free Tier (or deterministic `MockAiProvider` for automated unit tests). The output is parsed and strictly validated against comprehensive Zod schemas.
3. **Extraction Review:** Grounded claims are reviewed by the user. Users can edit values, confirm trusted facts, mark details unknown, or remove ungrounded fields.
4. **Agent Activation & DAG Compilation:** Compiles confirmed requirements into a Directed Acyclic Graph. Downstream tasks remain blocked until upstream prerequisites are satisfied.
5. **Automatic Unblocking:** Completing a prerequisite immediately transitions dependent tasks from `blocked` to `ready`. Supports both **Strict Sequential (01 → 02 → 03)** and **Parallel DAG** execution modes.
6. **Evidence Attachment (Levels 0–3):** Attach proof of completion (text explanations, files, or repository URLs) evaluated against explicit criteria.
7. **Four-Factor Readiness Audit:** Evaluates requirements completion, evidence readiness, source confidence, and deadline risk, displaying exact missing items before submission.

---

## Technology Stack

- **Client Application:** React Native (0.86), Expo (57), Expo Router (57), React Native Web (0.21), React 19 (19.2), TypeScript.
- **Visual Design System:** Custom "Spatial Liquid Glass" design system utilizing `expo-blur`, `react-native-reanimated`, Feather icons, and dynamic ambient wallpapers.
- **Monetization & Entitlements:** RevenueCat `react-native-purchases` SDK (v10.10) for in-app paywall, subscription handling, and Pro entitlement gating.
- **Backend Server:** Node.js Express 5 REST API running on port 5001 with modular services for AI extraction, DAG dependency resolution, and secure file storage.
- **Database & ORM:** PostgreSQL 16 running locally via Docker container `actionlayer-postgres`, managed through Drizzle ORM with full relational schema.
- **AI Systems:** Google Gemini Developer API (Free Tier server-side) with Zod schema validation, explicit privacy disclosure gates, and deterministic `MockAiProvider` for unit testing.
- **Quality Assurance:** Vitest test suite (17 automated tests passing), TypeScript strict mode (zero typecheck errors across all workspace packages), Prettier linting.
- **Package Manager:** pnpm workspaces.

---

## RevenueCat Integration

ActionLayer includes a production-ready monetization architecture powered by the official RevenueCat (`react-native-purchases`) SDK:

- **Freemium Tier (Free):** Full access to manual checklist creation, source viewing, and basic task management.
- **ActionLayer PRO Tier:** Unlocks unlimited multimodal Gemini AI document extractions, automated 4-factor readiness audits, and custom Liquid Glass spatial themes.
- **Entitlement Enforcement:** Protected features verify the `pro` entitlement from `CustomerInfo` before initiating heavy computational or extraction requests.
- **Paywall Interface:** Implemented via a native frosted-glass Paywall component ([`components/Paywall.tsx`](artifacts/actionlayer-mobile/components/Paywall.tsx)) supporting offering retrieval, purchase execution, and purchase restoration.

---

## Persistence Model

- **Authoritative Backend Store (PostgreSQL):** PostgreSQL 16 is the authoritative system of record for all sources, extraction jobs, claims, workflows, tasks, dependencies, evidence, verifications, and audit events.
- **Client-Side Cache (AsyncStorage):** `@react-native-async-storage/async-storage` is used strictly on the mobile client for caching active agent state, user interface preferences (custom wallpapers, dim levels), and optimistic offline access.

---

## Gemini Model Configuration

The application reads the Gemini model identifier from `process.env.GEMINI_MODEL`:

```bash
AI_PROVIDER="gemini"
GEMINI_MODEL="gemini-2.5-flash"
GEMINI_API_KEY="your-gemini-api-key"
```

- **Server-Side Only:** `GEMINI_API_KEY` is strictly confined to the backend server. It is never exposed to browser bundles, client logs, or environment endpoints.
- **AI Safety & Fallback Rule:** When `AI_PROVIDER=gemini`, genuine API errors (such as quota exhaustion or network drop) trigger clear error messages with retry and manual-entry options—it **never** silently swaps to mock data without user knowledge. `MockAiProvider` operates strictly when `AI_PROVIDER=mock` or during deterministic automated test execution.

---

## Gemini Privacy Disclosure

Before sending any user source to Google Gemini for analysis, ActionLayer presents this mandatory disclosure:

> *"ActionLayer will send this source to Google Gemini for analysis. Do not upload identity documents, financial records, medical records, confidential research, private university materials, or company-confidential files."*

Users must explicitly accept the disclosure before transmission, or they may choose **"Enter Manually Instead"** to create their action plan without AI processing.

---

## Quickstart & Local Installation

### Prerequisites
- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local PostgreSQL)

### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rashidriyadh714-dev/Hackathon_Competeion.git
   cd Hackathon_Competeion
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env to add your free Google Gemini API key:
   # GEMINI_API_KEY="your-api-key-here"
   ```

3. **Start local PostgreSQL via Docker:**
   ```bash
   pnpm run db:up
   ```

4. **Install workspace dependencies:**
   ```bash
   pnpm install
   ```

5. **Push database schema & migrations:**
   ```bash
   pnpm --filter @workspace/db run push
   ```

6. **Seed demo data (Optional):**
   ```bash
   pnpm run seed
   ```

7. **Start the backend server (Port 5001):**
   ```bash
   pnpm run start:api
   ```

8. **In a second terminal, start the mobile app (Port 8081):**
   ```bash
   pnpm run start:mobile
   ```

9. **Open the application:**
   Navigate to [http://localhost:8081](http://localhost:8081) in your browser. (Toggle browser devtools to mobile view for the optimal mobile-first experience).

---

## Database Management Commands

| Command | Purpose |
| :--- | :--- |
| `pnpm run db:up` | Starts `actionlayer-postgres` container in Docker |
| `pnpm run db:down` | Stops PostgreSQL container (preserves data volume) |
| `pnpm run seed` | Seeds demo competition data into database |
| `pnpm --filter @workspace/db run push` | Synchronizes Drizzle schema with PostgreSQL |
| `docker exec actionlayer-postgres pg_dump -U actionlayer actionlayer_db > backup.sql` | Backs up database to SQL file |
| `docker exec -i actionlayer-postgres psql -U actionlayer actionlayer_db < backup.sql` | Restores database from backup |

---

## Verification & Test Results

Run the full testing and quality pipeline:

```bash
# 1. Typecheck (all workspace packages)
pnpm run typecheck

# 2. Lint check
pnpm run lint

# 3. Automated test suite (Vitest)
pnpm test

# 4. Web production export
pnpm run build
```

### Test Suite Summary
- **Total Tests:** 17
- **Passed:** 17 (100%)
- **Failed:** 0
- **Skipped:** 0
- **Coverage Areas:**
  - Gemini extraction schema validation & rejection of malformed outputs
  - AI Safety: zero silent fallbacks when running in real Gemini mode
  - Deterministic DAG prerequisite resolution & cycle prevention
  - Automatic task unblocking transitions upon prerequisite completion
  - Multi-level evidence verification schema validation
  - Four-factor readiness audit scoring
  - Local file storage isolation, size capping (10MB), and SHA-256 checksums

---

## Critical Validation Journey

Reviewers can verify the complete source-to-audit pipeline:

1. **Intake Source:** Open **Capture** and upload an image poster, PDF, or paste text.
2. **AI Privacy Disclosure:** Review and accept the mandatory Gemini privacy notice.
3. **Multimodal Extraction:** Gemini processes the document into structured claims with page numbers and citations.
4. **Review Grounded Claims:** Inspect extracted dates, organizers, and requirements with direct source excerpts.
5. **Human-in-the-Loop Corrections:** Edit any ambiguous claims or mark unstated values as unknown.
6. **Activate Agent:** Preview the generated agent and compile it into an active opportunity agent.
7. **Requirement Graph:** Switch to the **Graph** tab to view the dependency DAG.
8. **Inspect Blocked Tasks:** Observe that downstream tasks remain strictly **Blocked** by upstream prerequisites.
9. **Execution Flow Modes:** Choose between **Strict Sequential (01 → 02 → 03...)** or **Parallel DAG** mode.
10. **Complete Prerequisite:** Click *"Start Task"* then *"Mark Complete"* on an active prerequisite.
11. **Observe Automatic Unblocking:** Watch downstream dependent tasks automatically transition from **Blocked** to **Ready**.
12. **Attach Evidence:** Attach supporting evidence (text, link, or document) to a task.
13. **Inspect Verification Assessment:** Review the evaluation scope and verification level.
14. **Four-Factor Readiness Audit:** Click *"Run Four-Factor Readiness Audit"* on the Overview tab.
15. **Inspect Missing Items:** Review exact requirements missing, unverified items, and deadline risk factors.

---

## Scope & Future Roadmap

ActionLayer's flagship supported workflow is the **Competition Agent**. The extraction and DAG architecture can classify and compile other document types (such as grants and assignments) as previews:

1. **Multi-User Cloud Deployment:** The current competition build operates in a documented single-user local mode. Production multi-tenant cloud deployment with verified session middleware is planned.
2. **Transparent Verification:** Level 3 verification is clearly labeled *"AI-assisted assessment"*. Future integrations may support stronger external verification from authoritative systems where permitted.
3. **Upcoming Capabilities:**
   - Server-side authenticated URL crawler ingestion with SSRF protection
   - Native calendar event synchronization
   - Audio note transcription for hands-free intake

---

## License

This project is open-source under the [Apache License, Version 2.0](LICENSE).  
Copyright © 2026 Rashid Riyadh and ActionLayer contributors.