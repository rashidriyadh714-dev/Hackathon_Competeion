# Security Policy

## 1. Scope & Responsibility

ActionLayer handles user-uploaded source material, extracted requirement claims, task evidence, deadlines, and verification results. All source documents and user data are treated as private.

---

## 2. Reporting a Vulnerability

We take the security of ActionLayer seriously. **Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report vulnerabilities through one of the following private channels:

1. **GitHub Private Vulnerability Reporting (Recommended):**
   - Navigate to the repository's **Security** tab.
   - Click **Advisories** → **Report a vulnerability**.
2. **Direct Maintainer Contact:**
   - Email: `rashidriyadh714@gmail.com`
   - Subject: `[ActionLayer Security] Vulnerability Report`

### What to Include in Your Report
- A concise description of the vulnerability and potential impact.
- Clear reproduction steps, proof-of-concept request, or code snippet.
- The affected component, file, or API route.
- A proposed fix or mitigation, if available.

*Please do not include sensitive credentials, active API tokens, private documents, or personal data in the initial report.*

We will acknowledge receipt of security reports within 48 hours and coordinate a fix prior to public disclosure.

---

## 3. Current Security Boundaries

- **Single-User Local Execution:** The competition build is designed for local evaluation and single-user operation. It does not claim production-grade multi-tenant authorization or tenant isolation.
- **Server-Side API Credentials:** The Google Gemini API key (`GEMINI_API_KEY`) is stored strictly on the backend Express server. It is never included in client-side bundles, public environment variables, or client network logs.
- **Isolated Storage:** Uploaded sources and evidence files are stored outside the web root in protected directories (`data/uploads/{userId}/`) with non-guessable, sanitized filenames.
- **Input Validation:** File sizes are strictly capped at 10 MB, and MIME types are validated against an allowlist before processing.
- **Data Minimization:** Raw LLM outputs are processed in volatile memory and discarded; full raw text responses are not stored indefinitely in the database.

---

## 4. Production Security Requirements

Deploying ActionLayer to a multi-tenant cloud environment requires:
1. **Session Middleware:** Mandatory verification of session tokens (e.g. Clerk JWTs) on all incoming API requests.
2. **Ownership Enforcement:** Strict SQL query predicates ensuring users can only read or mutate records where `userId === session.userId`.
3. **Storage Hardening:** Transition from local disk storage to encrypted cloud object storage (e.g., AWS S3 with pre-signed upload URLs).
4. **Rate Limiting:** IP and user-based token bucket rate limiting on AI intake and verification endpoints.