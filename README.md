# ActionLayer

ActionLayer is a mobile-first, source-grounded workflow agent for turning competitions, grants, assignments, and applications into an evidence-backed action plan.

It is designed around one question: **what is the next requirement I can complete, and what evidence will prove it?**

## What is included

- Capture from image, PDF, text, and URL through a single capture surface.
- Extraction review with source excerpts, confidence, missing fields, and explicit user confirmation.
- A persistent Competition Agent with requirements, dependencies, evidence policies, deadline risk, and a readiness audit.
- Task states that distinguish ready, in progress, blocked, submitted for review, partially verified, verified, completed by the user, and needs correction.
- Evidence attachments with a verification record and limitations.
- Activity history, offline-tolerant local state, demo mode, and accessible warm-neutral mobile UI.
- Clerk authentication when `CLERK_PUBLISHABLE_KEY` is configured; deterministic demo mode remains available for judging and offline walkthroughs.
- PostgreSQL/Drizzle schema and Express API routes for sources, extraction jobs, claims, workflows, tasks, evidence, verification, and audit results.

## Demo

The default demo uses fictional data for the **Northstar Build Challenge**. It is intentionally labeled as fictional and does not claim to retrieve or verify a real opportunity.

Suggested walkthrough:

1. Open Home and inspect the next action.
2. Open Agents and view the Competition Agent.
3. Open Review claims and confirm the inferred deadline.
4. Start the concept task; observe that the repository task remains blocked by a dependency.
5. Add evidence to a task and inspect its partial verification.
6. Run the readiness audit and inspect Activity.
7. Toggle offline mode and continue using locally persisted state.

See [docs/demo-script.md](docs/demo-script.md) for the full submission walkthrough.

## Local development

Requirements: Node.js 20+, pnpm, Expo tooling, and a provisioned PostgreSQL database.

```bash
pnpm install
pnpm --filter @workspace/db run push
pnpm run typecheck
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/actionlayer-mobile run dev
```

The mobile artifact is served through the configured Expo workflow. API routes are mounted under `/api`.

For Clerk-backed auth, configure the Replit-managed `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `SESSION_SECRET` secrets. If the publishable key is unavailable, the app explicitly falls back to fictional demo mode.

## Project structure

| Path | Purpose |
| --- | --- |
| `artifacts/actionlayer-mobile` | Expo Router mobile application |
| `artifacts/api-server` | Express API server |
| `lib/db` | Drizzle schema and PostgreSQL client |
| `lib/api-spec` | OpenAPI contract |
| `docs` | Architecture, privacy, threat model, and submission materials |

## API examples

```bash
curl http://localhost:$PORT/api/v1/demo/competition
curl http://localhost:$PORT/api/v1/agents
```

The demo endpoint is deterministic. Production integrations should replace the mock extraction adapter with a provider that preserves original source files, retrieval metadata, and user confirmation boundaries.

## Security and privacy

Uploaded sources are modeled as private, user-owned records. The application does not silently turn extraction guesses into facts. It keeps source excerpts, confidence, review status, evidence explanations, verification limitations, and audit events as separate records.

Read [docs/privacy.md](docs/privacy.md), [docs/threat-model.md](docs/threat-model.md), and [SECURITY.md](SECURITY.md) before deploying outside the demo environment.

## License

Apache-2.0. See [LICENSE](LICENSE).