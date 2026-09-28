# Privacy and data handling

## Data collected

ActionLayer may handle account identity, uploaded source metadata, source checksums, extracted claims, task progress, evidence explanations, verification results, deadlines, and activity events.

## User control

Users can review extracted claims before a workflow is created, edit or confirm uncertain values, attach explanations to evidence, inspect verification evaluation scope, and delete uploaded sources. The profile surface exposes export and source-management entry points.

## Processing rules

- Do not use demo content to represent a real opportunity.
- Do not present an inferred claim as confirmed.
- Do not expose original source content in logs.
- Keep evidence scoped to its task and owner.
- Preserve only the metadata needed to explain how a result was produced.

## Retention and deletion

Production deployments should define a retention period for original files, derived extraction data, and audit records. Deleting a source should revoke access to the source object and mark dependent claims as unavailable while retaining a minimal audit event.

The repository includes the schema and UI boundaries for this behavior; object storage retention and authenticated API ownership checks must be configured for a production deployment.