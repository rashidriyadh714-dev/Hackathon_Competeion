# Data model

| Entity | Responsibility |
| --- | --- |
| User | Clerk-linked identity, email, timezone, and language |
| Source | Original input metadata, checksum, retrieval time, storage path, and deletion state |
| Extraction job | Processing status, detected agent type, confidence, model version, and error |
| Claim | Field value, source excerpt/page, confidence, review state, and uncertainty |
| Workflow | Agent title/type, deadline, readiness metrics, and overall status |
| Task | Requirement, state, priority, deadline, completion condition, and evidence policy |
| Dependency | Essential or optional prerequisite relationship between tasks |
| Evidence | User explanation plus text, URL, or stored-file reference attached to a task |
| Verification | Verification level, method, confidence, satisfied/missing requirements, and limitations |
| Audit event | User-visible record of captures, reviews, transitions, evidence, audits, and exports |

## State semantics

Task completion is not the same as verification. `completed_by_user` records a user assertion. `partially_verified` records that an evidence or rule check found some support. `verified` should only be used when the configured verification method satisfies the requirement. `needs_correction` returns the task to the user with a reason.

## Source semantics

The application preserves a source reference before extraction. A claim can point back to the original source excerpt and page, but an extraction result never replaces the source. Deleted sources retain an audit-safe tombstone rather than silently becoming an untraceable fact.