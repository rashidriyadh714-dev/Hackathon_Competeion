# Contributing to ActionLayer

Thank you for your interest in contributing to ActionLayer!

---

## 1. Code of Conduct

All contributors are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat fellow contributors with respect, professionalism, and empathy.

---

## 2. Development Setup & Verification Commands

Before submitting a pull request, ensure all validation checks pass locally:

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Strict TypeScript typechecking across all workspace packages
pnpm run typecheck

# 3. Code formatting and linting (Prettier)
pnpm run lint

# 4. Run the automated test suite (Vitest)
pnpm test

# 5. Verify the mobile web production build
pnpm run build
```

If you modify the database schema in `lib/db/src/schema/actionlayer.ts`, test the migration against your local PostgreSQL database:

```bash
pnpm --filter @workspace/db run push
```

---

## 3. Core Architectural Principles

When writing or reviewing code, uphold these core principles:
1. **Source Grounding:** AI-extracted information must always link to a verifiable document excerpt or page reference. Never generate ungrounded requirements without flagging them for human review.
2. **Deterministic Graph Transitions:** All DAG topological resolution, prerequisite blocking, cycle detection, and readiness audit scores must run in deterministic TypeScript logic—never delegated to LLM prompts.
3. **No Silent Fallbacks:** Real AI mode (`AI_PROVIDER=gemini`) must report honest API errors when keys or quotas fail. Never silently fall back to mock data in production workflows.
4. **Data Minimization:** Do not persist full raw LLM response text dumps. Parse responses in memory against Zod schemas and store only validated structured data.
5. **Secret Protection:** Never commit API keys, tokens, real personal documents, or private credentials in fixtures or examples.

---

## 4. Submitting Pull Requests

1. Create a descriptive feature branch: `git checkout -b feature/your-feature-name`.
2. Keep pull requests focused on a single concern.
3. Include tests for any new business logic, DAG calculations, or schema parsers.
4. Provide a clear PR description detailing:
   - The user workflow or bug addressed.
   - Whether changes affect privacy, storage, or evidence verification.
   - Confirmation that `pnpm run typecheck` and `pnpm test` pass with zero errors.