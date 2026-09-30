# Threat Model & Security Posture

This document provides a realistic assessment of the threats, implemented security controls, and remaining production safeguards for ActionLayer.

---

## 1. Assets Under Protection

- **Uploaded Source Material:** Images, multi-page PDFs, and plaintext briefs containing competition criteria, guidelines, and assignment rubrics.
- **Extracted Claims & Citations:** Grounded statements parsed from source documents, including deadlines, eligibility rules, and required deliverables.
- **Evidence Artifacts:** User-provided files, written descriptions, and repository URLs submitted to prove task completion.
- **Verification Records:** Assessments, met/missing criteria, and limitations produced during evidence audits.
- **API Credentials:** The server-side Google Gemini Developer API key (`GEMINI_API_KEY`).

---

## 2. Threat Analysis & Control Matrix

Controls are classified honestly into **Implemented Controls** (active in the competition codebase) and **Remaining Production Work** (required for cloud multi-tenant deployment):

| Threat | Impact | Current Implemented Control | Remaining Production Work |
| :--- | :--- | :--- | :--- |
| **Malicious or Oversized File Upload** | Denial of service, disk exhaustion, remote execution | Strict 10MB file size ceiling (`StorageService`); MIME-type allowlist (JPEG, PNG, WebP, PDF, text); files saved in non-executable storage directories outside web root with sanitized timestamps. | Asynchronous antivirus/malware scanning; sandboxed containerized PDF parser workers. |
| **Malicious URL Intake (SSRF)** | Server-side request forgery, internal network probing | Direct public URL ingestion is disabled in the intake API (`POST /api/v1/sources` accepts only uploaded files and text). | SSRF protection proxy, DNS rebinding prevention, private IP blocklists, and redirect limits before enabling live URL scraping. |
| **AI Requirement Hallucination** | Missed deadlines or invalid project submissions | Pre-activation human review gate; every claim must cite exact source text and page numbers; confidence scores below 0.8 are flagged; Zod schema rejects invalid outputs. | Automated cross-source triangulation and semantic drift detection. |
| **Silent AI Failure or Data Corruption** | User falsely assumes AI extraction succeeded | Strict Zod validation; zero silent mock fallback—API key failures throw honest HTTP 502/503 errors. | Dead-letter queues and automated administrative alert webhooks. |
| **Cross-User Data Access** | Unauthorized inspection or tampering with workflows | Local-mode identity separation via `x-user-id` header; database schema includes relational `user_id` foreign keys. | Mandatory authenticated session middleware (e.g. Clerk / JWT verification) and strict ownership query predicates on all endpoints. |
| **Path Traversal Attacks** | Unauthorized reading or overwriting of server files | `StorageService.getAbsolutePath` enforces canonical path resolution and asserts `fullPath.startsWith(storageRoot)`. | Content-Addressable Storage (CAS) or S3-compatible pre-signed object store. |
| **API Credential Leakage** | Compromised AI account and quota depletion | `GEMINI_API_KEY` is loaded strictly on the backend server (`artifacts/api-server`); excluded from frontend bundles, logs, and error payloads. | Automated secret rotation via cloud secret managers (e.g. AWS Secrets Manager, GCP Secret Manager). |

---

## 3. Current Security Boundary

The competition build is designed and documented for **single-user local execution**:
- The API server operates locally on port 5001 and resolves queries to the local user (`00000000-0000-4000-8000-000000000001`) unless an explicit `x-user-id` is provided.
- The mobile client runs locally on port 8081 with a mock/test Clerk provider wrapper when no public Clerk key is configured.
- Uploaded files are isolated on the local disk under `./data/uploads/{userId}/`.
- **Multi-user tenant isolation is not claimed for this local evaluation build.** Multi-tenant cloud deployments require verified session tokens and database row-level ownership enforcement.

---

## 4. Residual Risks & Production Roadmap

1. **Local Disk Storage:** Production deployments should migrate from local `./data/uploads` storage to private cloud object storage (e.g. AWS S3, Google Cloud Storage) with encrypted pre-signed URLs.
2. **Rate Limiting:** Production deployments must add rate limiting middleware (`express-rate-limit`) on AI intake endpoints to protect upstream Gemini API quotas.
3. **Session Verification:** Full session verification must be added to Express route handlers to prevent user ID spoofing.