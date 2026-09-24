# Contributing to ActionLayer

## Before opening a change

1. Read the relevant documents in `docs/`.
2. Keep demo data clearly fictional.
3. Preserve the source-grounding boundary: inferred values need review and evidence needs an explanation.

## Development checks

```bash
pnpm install
pnpm run typecheck
pnpm --filter @workspace/actionlayer-mobile run build
```

Changes to the database schema must include a Drizzle schema update and be checked with:

```bash
pnpm --filter @workspace/db run push
```

## Pull requests

Describe:

- the user workflow changed;
- whether the change affects source privacy, authentication, or evidence semantics;
- the verification steps run;
- any known limitations that remain.

Small, focused pull requests are preferred. Do not include secrets, real private documents, or personal information in fixtures.