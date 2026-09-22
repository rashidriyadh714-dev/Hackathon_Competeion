# Security policy

## Scope

ActionLayer handles uploaded source material, extracted claims, user-provided evidence, deadlines, and authentication state. Treat all source content as private.

## Reporting

Do not open a public issue for a suspected vulnerability. Report it privately to the project maintainers with:

- a concise description and impact;
- reproduction steps or a minimal proof of concept;
- affected route, screen, or dependency;
- a suggested mitigation, if known.

Do not include credentials, access tokens, private source files, or personal data in a report.

## Current security boundaries

- Secrets are supplied through Replit Secrets and are not committed.
- Source checksums and retrieval timestamps are stored separately from extracted claims.
- Demo mode uses fictional data and must not be treated as a production authorization boundary.
- The current API scaffold uses a demo user identity for local judging. Production deployments must enforce Clerk session verification and ownership checks before exposing user records.

## Release checklist

- Run `pnpm run typecheck`.
- Run dependency and static security scans.
- Verify production database migrations.
- Confirm source and evidence access is scoped to the authenticated user.
- Confirm logs do not contain source content, credentials, or raw evidence.