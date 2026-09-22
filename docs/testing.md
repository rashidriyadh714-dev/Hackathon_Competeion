# Testing and validation

## Required checks

```bash
pnpm run typecheck
pnpm --filter @workspace/db run push
pnpm --filter @workspace/actionlayer-mobile run typecheck
```

## Manual acceptance path

- Cold start opens the mobile app without a blank state.
- Home shows a concrete next action and fictional demo label.
- Agent detail shows task dependencies and blocked state.
- Extraction review distinguishes confirmed, inferred, and missing claims.
- Confirming a claim updates activity and persists locally.
- Starting/completing tasks respects dependencies.
- Evidence creates a partial verification record with limitations.
- Audit reports ready, missing, blocked, uncertain, and next action.
- Offline mode remains usable and data survives a reload.
- Clerk sign-in appears when the publishable key is available.

## Future automated coverage

The next test layer should cover dependency transitions, readiness calculations, claim review persistence, evidence verification semantics, API ownership checks, source deletion, and Clerk session middleware. Fixtures must use fictional content only.