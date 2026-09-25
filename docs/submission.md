# ActionLayer: Shipaton 2026 Next Gen Award Submission

## Submission Overview

- **Project Name:** ActionLayer
- **Award Category:** Shipaton 2026 Next Gen Award
- **License:** Apache-2.0 Open-Source License
- **Target Form Factor:** Mobile-First Progressive Web App (PWA) + Local Docker PostgreSQL + Express 5 Backend
- **Core AI Integration:** Google Gemini Free Tier API (`gemini-2.5-flash`) with Deterministic `MockAiProvider` fallback for safe, repeatable judging

---

## 1. Executive Summary

### What ActionLayer Does
ActionLayer compiles messy, unstructured real-world opportunity documents (such as competition posters, syllabi, and grant calls) into verifiable Directed Acyclic Graph (DAG) task trees with strict prerequisite blocking, multi-level evidence verification, and four-factor readiness audits.

### Who It Helps
Students, early-career engineers, and small teams who struggle with complex multi-stage competition criteria, ambiguous deadlines, hidden prerequisites, and the anxiety of submitting incomplete applications.

### Why It Matters
Generic AI tools hallucinate dates and produce disjointed todo lists without grounding. ActionLayer enforces cryptographic source preservation, human review gates, deterministic scheduling, and transparent readiness auditing where missing deliverables are caught before the deadline.

### How It Works
1. **Intake & Cryptographic Preservation:** Sources (images, PDFs, text) are saved locally with SHA-256 integrity verification.
2. **Schema-Constrained Gemini Extraction:** Gemini Free Tier parses structured claims constrained by strict Zod schemas.
3. **Extraction Review:** Grounded claims link to exact document excerpts. Users edit uncertain items, confirm facts, or mark fields unknown.
4. **Agent Activation & DAG Solver:** Compiles requirements into a 7-task DAG with 6 dependencies. Tasks remain blocked until prerequisites finish.
5. **Automatic Unblocking:** Completing an upstream task automatically unblocks downstream requirements.
6. **Multi-Level Evidence Verification:** Artifacts are verified at Levels 0 to 4 (including AI-assisted rubric assessment).
7. **Four-Factor Readiness Audit:** Separate transparency into Requirements Completion, Evidence Readiness, Source Confidence, and Deadline Risk.

---

## 2. Competition Deliverables Checklist

| Deliverable | Status | Verification Reference |
| --- | --- | --- |
| Fully functional local application | Verified | Mobile PWA running on port 8081; Express API on port 5001 |
| Working demonstration walkthrough | Verified | 14-step critical journey documented in `docs/demo-script.md` |
| Public GitHub repository structure | Verified | Standard monorepo without proprietary dependencies |
| Apache-2.0 Open-Source License | Verified | `LICENSE` file containing full Apache-2.0 legal text |
| Complete local installation instructions | Verified | Step-by-step setup in `README.md` and Docker Compose |
| Clear explanation (What, Who, Why, How) | Verified | Section 1 above and `README.md` |
| Screenshots & architecture documentation | Verified | `docs/architecture.md`, `docs/data-model.md` |
| Honest limitations & privacy disclosures | Verified | `docs/privacy.md`, `SECURITY.md`, `README.md` |

---

## 3. Product Scope & Agent Status

- **Competition Agent (Fully Supported MVP):** Complete source-to-audit vertical slice with 7 tasks, 6 dependencies, automatic unblocking, evidence attachment, and 4-factor readiness audit.
- **Assignment Agent (Preview Only):** Included as a labeled preview with seeded data (`CS402 Machine Learning Assignment 3`).
- **Application Agent (Preview Only):** Included as a labeled preview with seeded data (`Summer 2026 Research Fellowship`).
- **Safety Policy:** Neither Assignment nor Application agent is described as fully supported until their complete pipelines are finalized.

---

## 4. Technical Quality & Verification Summary

- **Automated Tests:** 17 tests passed in Vitest (`pnpm test`):
  - Strict schema validation & rejection of malformed JSON
  - Mock provider safety (never silently swaps in real mode)
  - DAG cycle prevention & topological resolution
  - Automatic prerequisite unblocking
  - Multi-level evidence verification
  - Four-factor readiness scoring
  - Local file storage path traversal security
- **TypeScript Typecheck:** 0 errors across all 9 workspace packages (`pnpm run typecheck`).
- **Linting:** 100% Prettier code style compliance (`pnpm run lint`).
- **Production Build:** Clean production bundle exported via Expo web (`pnpm run build`).

---

## 5. Honest Limitations

1. **Local Single-User Execution:** Optimized for local judging in development mode.
2. **AI-Assisted Assessment:** Level 3 verification is explicitly labeled as an AI rubric assessment and does not claim institutional accreditation.
3. **Postponed Features:** URL scraping, external calendar integrations, voice-note transcription, and live payment processing are postponed to post-competition phases.