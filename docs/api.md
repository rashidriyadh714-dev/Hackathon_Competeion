# API contract

Base path: `/api`

## Demo

`GET /v1/demo/competition`

Returns the deterministic fictional Northstar Build Challenge workflow for judging.

## Source and extraction

- `POST /v1/sources` creates a source record and extraction job.
- `GET /v1/extractions/:jobId/claims` returns source-grounded claims.
- `POST /v1/extractions/:jobId/confirm` confirms the review boundary and returns a workflow representation.

## Agents and tasks

- `GET /v1/agents`
- `POST /v1/agents`
- `GET /v1/agents/:agentId/tasks`
- `GET /v1/agents/:agentId/audit`
- `POST /v1/tasks/:taskId/start`
- `POST /v1/tasks/:taskId/complete`

## Evidence

`POST /v1/tasks/:taskId/evidence` stores a user explanation and creates a level-two partial verification record.

## Production requirements

The current routes are intentionally compact for the competition demo. Before production:

1. Verify the Clerk session on every route.
2. Derive the user ID from the verified session, never from a request body.
3. Add ownership predicates to every source, workflow, task, and evidence query.
4. Validate payloads with shared Zod schemas.
5. Add idempotency keys for source creation and evidence submission.
6. Add pagination and redacted structured audit logs.