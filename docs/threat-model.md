# Threat model

## Assets

- Uploaded PDFs, images, text, and URLs.
- Claims extracted from sources.
- User identity and workflow ownership.
- Evidence and verification records.
- Deadlines and submission-related information.

## Threats and mitigations

| Threat | Impact | Mitigation |
| --- | --- | --- |
| Source upload contains sensitive material | Privacy breach | Private source model, checksums, deletion state, no raw source logging |
| Extraction invents a requirement | Missed or invalid submission | Source excerpts, confidence, missing status, human review gate |
| User accepts incorrect evidence | False readiness | Verification method, level, limitations, and next action are stored separately |
| Cross-user record access | Data disclosure | Clerk identity plus ownership predicates required on every production query |
| Stale deadline | Late submission | Retrieval timestamp, deadline confidence, audit history, readiness risk |
| Offline device loss | Progress loss | Server sync contract; local cache is treated as a convenience, not the source of truth |
| Malicious URL or file | Service compromise | Type/size limits, malware scanning, safe URL fetching, isolated extraction workers |
| Secret exposure in logs | Account compromise | Replit Secrets, structured redacted logging, no credentials in fixtures |

## Residual risks

The local demo API uses a deterministic demo user and mock extraction adapter. This is intentional for judging but is not sufficient for a production deployment. Before launch, add authenticated server middleware, object storage policy, file scanning, rate limits, request validation, and provider-specific model privacy controls.

## Security review status

Static typecheck and database schema synchronization are part of the repository validation. Dependency audit, SAST, and HoundDog scans should be run in the final release environment and attached to the submission record.