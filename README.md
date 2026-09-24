# ActionLayer

> **Autonomous Opportunity Execution Agent**  
> *Shipaton 2026 Next Gen Award Submission*  
> *Built by Rashid Riyadh*  
> Licensed under Apache-2.0 · 100% Open Source · Locally Executable

---

## What is ActionLayer?

**ActionLayer** is a source-grounded, mobile-first autonomous workflow agent that compiles unstructured real-world opportunity documents—such as competition posters, hackathon briefs, grant calls, and assignment rubrics—into deterministic, verifiable Directed Acyclic Graph (DAG) requirement trees.

Instead of generic chat summaries or disjointed todo lists, ActionLayer answers two questions:
1. **"What is the exact next requirement I can work on without being blocked?"**
2. **"What verifiable evidence will prove this requirement is genuinely complete?"**

---

## Who It Helps

- **Students & Early-Career Builders:** Navigating complex competition rules, hackathons, and fellowship applications with strict submission criteria, deadlines, and multi-step prerequisites.
- **Independent Developers & Researchers:** Applying for open grants and submitting technical projects where missing a single deliverable (such as an open-source license or demo video length) leads to disqualification.
- **Solo Applicants:** Managing overwhelming multi-page announcement posters and unstructured PDFs without missing fine-print requirements.

---

## Why It Matters

Most AI productivity tools generate text that looks plausible but hallucinate deadlines, fabricate requirements, and leave applicants uncertain of what has actually been verified. ActionLayer solves this with:
- **Source Grounding:** Every extracted claim remains linked to its exact excerpt and page in the preserved original document.
- **Human Review Gates:** Uncertain dates, unstated timezones, or ambiguous terms are explicitly flagged for human confirmation before compiling into tasks.
- **Deterministic DAG Scheduling:** Task dependencies, prerequisite blockers, and next-action calculations run in strict application logic—not unpredictable AI prompts.
- **Multi-Level Evidence Verification:** Distinguishes self-declarations (Level 1) and attached artifacts (Level 2) from AI-assisted rubric assessments (Level 3), never pretending to be official institutional certification.
- **Four-Factor Readiness Auditing:** Separate transparency into requirements completion, evidence readiness, source trust, and deadline risk.

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
2. **Schema-Constrained Extraction:** Processed via Google Gemini API Free Tier (or deterministic `MockAiProvider` for offline demo mode). The output is parsed and strictly validated against comprehensive Zod schemas.
3. **Extraction Review:** Grounded claims are reviewed by the user. Users can edit values, confirm trusted facts, mark details unknown, or remove ungrounded fields.
4. **Agent Activation & DAG Compilation:** Compiles confirmed requirements into a Directed Acyclic Graph. Downstream tasks (e.g., repository setup) remain blocked until upstream prerequisites (e.g., architecture concept) are satisfied.
5. **Automatic Unblocking:** Completing a prerequisite immediately transitions dependent tasks from `blocked` to `ready`.
6. **Evidence Attachment (Levels 0–4):** Attach proof of completion evaluated against explicit criteria.
7. **Four-Factor Readiness Audit:** Evaluates requirements completion, evidence readiness, source confidence, and deadline risk, displaying exact missing items before submission.

---

## Technology Stack

- **Frontend:** React 18, Expo Router mobile-first PWA, TypeScript, Tailwind CSS, Lucide / Feather icons, Radix UI accessibility primitives.
- **Backend:** Express 5 REST API running on port 5001 with modular services for AI extraction, DAG dependency resolution, and secure file storage.
- **Database:** PostgreSQL 16 running locally via Docker, managed through Drizzle ORM with full relational schema.
- **AI Systems:** Google Gemini Developer API (Free Tier) server-side integration with configurable model (`gemini-2.5-flash`), Zod schema constraints, and deterministic `MockAiProvider`.
- **Quality Assurance:** Vitest, React Testing Library, TypeScript strict mode (zero typecheck errors across 9 workspace packages), Prettier linting.
- **Package Manager:** pnpm workspaces.

---

## Gemini Model Configuration

The application reads the Gemini model identifier from `process.env.GEMINI_MODEL`:

```bash
# Recommended stable Flash model with multimodal (image/PDF/text) and structured JSON support:
GEMINI_MODEL="gemini-2.5-flash"
GEMINI_API_KEY="your-gemini-api-key"
AI_PROVIDER="gemini"
DEMO_MODE_ENABLED="true"
```

- **Server-Side Only:** `GEMINI_API_KEY` is strictly confined to the backend server. It is never exposed to browser bundles, client logs, or environment endpoints.
- **AI Safety & Fallback Rule:** When `AI_PROVIDER=gemini`, genuine API errors (such as quota exhaustion or network drop) trigger clear error messages with retry and manual-entry options—it **never** silently swaps to mock data without user knowledge. `MockAiProvider` runs only when explicitly requested (`AI_PROVIDER=mock`) or in deterministic automated test suites.

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
   git clone https://github.com/your-username/actionlayer.git
   cd actionlayer
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env to add your free Google Gemini API key if testing live extraction:
   # GEMINI_API_KEY="AIzaSy..."
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

6. **Seed fictional demo competition data:**
   ```bash
   pnpm run seed
   ```

7. **Start the backend server (Port 5001):**
   ```bash
   pnpm run start:api
   ```

8. **In a second terminal, start the mobile PWA (Port 8081):**
   ```bash
   pnpm run start:mobile
   ```

9. **Open the application:**
   Navigate to `http://localhost:8081` in your browser. (Switch your browser devtools to mobile view for the optimal mobile-first experience).

---

## Database Management Commands

| Command | Purpose |
| --- | --- |
| `pnpm run db:up` | Starts `actionlayer-postgres` container in Docker |
| `pnpm run db:down` | Stops PostgreSQL container (preserves data volume) |
| `pnpm run seed` | Seeds Northstar Build Challenge demo data into database |
| `pnpm --filter @workspace/db run push` | Synchronizes Drizzle schema with PostgreSQL |
| `docker exec actionlayer-postgres pg_dump -U actionlayer actionlayer_db > backup.sql` | Backs up database to SQL file |
| `docker exec -i actionlayer-postgres psql -U actionlayer actionlayer_db < backup.sql` | Restores database from backup |

---

## Verification & Test Results

Run the full testing and quality pipeline:

```bash
# 1. Typecheck (all 9 workspace packages)
pnpm run typecheck

# 2. Lint check
pnpm run lint

# 3. Unit & integration test suite
pnpm test

# 4. Production build verification
pnpm run build
```

### Test Suite Summary
- **Total Tests:** 17
- **Passed:** 17 (100%)
- **Failed:** 0
- **Skipped:** 0
- **Coverage Areas:**
  - Gemini extraction schema validation & rejection of malformed outputs
  - Mock AI safety rules (no silent fallbacks in real mode)
  - Deterministic DAG prerequisite resolution & cycle prevention
  - Automatic task unblocking transitions
  - Multi-level evidence verification tracking
  - Four-factor readiness audit scoring
  - Local file storage isolation & path traversal prevention

---

## The 14-Step Critical Judging Journey

Judges can verify the complete competition vertical slice following these steps:

1. **Intake Source:** Open **Capture**, select *"Explore Fictional Competition Demo"* or upload a poster.
2. **AI Extraction:** Review the mandatory Gemini privacy notice and accept.
3. **Review Grounded Claims:** Notice 6 extracted claims with confidence percentages and source excerpts.
4. **Correct Uncertain Claim:** Click *"Edit"* on the deadline claim and save your correction.
5. **Confirm Claims:** Confirm remaining items to mark them as trusted.
6. **Activate Competition Agent:** Click *"Activate Competition Agent"*.
7. **Open Requirement Graph:** Switch to the **Graph (DAG)** tab showing all 7 tasks.
8. **Inspect Blocked Task:** Observe that *"Create public GitHub repo"* is marked **Blocked** by prerequisite *"Choose problem & write architecture concept"*.
9. **Complete Prerequisite:** Click *"Start Task"* then *"Mark Complete"* on the concept task.
10. **Observe Automatic Unblocking:** Watch the repository task immediately transition from **Blocked** to **Ready**.
11. **Attach Evidence:** Click *"Attach Evidence"*, enter repository URL, and select verification level.
12. **Inspect Verification Result:** Open the **Evidence** tab to see Level 2/4 verification status, rubric checks, and limitations.
13. **Run Four-Factor Readiness Audit:** On the **Overview** tab, click *"Run Four-Factor Readiness Audit"*.
14. **Inspect Missing Items:** Review the exact remaining missing items and deadline risk reasons.

---

## Honest Scope & Limitations

In accordance with competition rules, we state our current scope and limitations honestly:

1. **Competition Agent is the Only Fully Supported Workflow:**
   - The Competition Agent is the only agent with a tested source-to-audit pipeline.
   - Assignment Agent and Application Agent appear strictly as labeled previews with fictional seeded data.
2. **Single-User Local Mode:**
   - The application runs in safe single-user development mode for local judging. Multi-tenant isolation is not claimed.
3. **No External Verification Claims:**
   - Level 3 verification is strictly labeled *"AI-assisted assessment"*. It does not guarantee external institutional accreditation.
4. **Postponed Features:**
   - Live URL scraping, continuous background source monitoring, voice-note transcription, external calendar sync, and real payment billing are postponed until after the competition MVP.

---

## License

This project is open-source under the [Apache License, Version 2.0](LICENSE).  
Copyright © 2026 ActionLayer Contributors.