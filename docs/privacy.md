# Privacy Policy & Data Handling

ActionLayer is committed to transparent, source-grounded data handling and privacy minimization.

---

## 1. Data Collected & Processed

ActionLayer processes the following data categories:
- **Intake Source Material:** User-uploaded competition announcements, posters, syllabi, PDF guidelines, and pasted text briefs.
- **Cryptographic Checksums:** SHA-256 hashes generated from uploaded files for deduplication and tamper detection.
- **Structured Claims & Citations:** Extracted opportunity metadata (titles, deadlines, eligibility criteria, deliverable rules) linked to source page numbers and excerpts.
- **Task & Verification Records:** User progress, completion self-declarations, attached evidence files or repository URLs, and AI-assisted verification assessments.
- **Client Preferences:** Local theme settings, spatial glass wallpapers, and dim levels cached in client storage.

---

## 2. Data Minimization Principles

1. **In-Memory LLM Parsing & Discard:**
   - Raw model responses from Google Gemini are received and parsed in volatile memory, strictly validated against Zod schemas, and discarded.
   - ActionLayer does **not** permanently persist full raw LLM output text dumps in the database.
   - Only validated structured claims, tasks, and minimal provider telemetry (model identifier, processing duration) are persisted.

2. **No Secret or Sensitive Data Logging:**
   - Structured logging via Pino HTTP records only request method, sanitized endpoint URLs, and HTTP status codes.
   - File contents, raw Gemini prompt bodies, and API keys are explicitly omitted from logs.

---

## 3. User Consent & Mandatory AI Disclosure

Before transmitting any source document to Google Gemini for multimodal analysis, the mobile application presents a mandatory modal disclosure:

> *"ActionLayer will send this source to Google Gemini for analysis. Do not upload identity documents, financial records, medical records, confidential research, private university materials, or company-confidential files."*

- **Explicit Acceptance:** The user must tap *"Accept & Extract"* to proceed with AI analysis.
- **Manual Alternative:** Users may tap *"Enter Manually Instead"* to bypass AI extraction completely and define tasks manually without third-party network transmission.

---

## 4. Human-in-the-Loop Review Gates

Extracted information is never automatically finalized into an active workflow without review:
- Users inspect extracted claims, source excerpts, and page citations on the **Extraction Review** screen.
- Inferred or uncertain fields are highlighted with review badges.
- Users have full autonomy to edit extracted values, supply missing parameters, or discard inaccurate claims before activating an opportunity agent.

---

## 5. Retention & Deletion Semantics

- **Source Deletion:** Deleting a source marks the record with a `deleted_at` timestamp and cascades removal of associated extraction jobs and claims.
- **Local File Deletion:** Associated binary files in `./data/uploads/{userId}/` are removed from the filesystem upon permanent deletion.
- **Single-User Scope:** In local execution mode, data resides entirely within the developer's local PostgreSQL database and local storage directory.