# Testing and Validation

This document describes the automated test coverage, validation procedures, and remaining testing scope for ActionLayer.

---

## 1. Test Execution Commands

Run the complete verification pipeline locally:

```bash
# 1. Run all automated tests (Vitest)
pnpm test

# Alternatively run directly inside the API server workspace:
pnpm --filter @workspace/api-server run test

# 2. Workspace-wide strict TypeScript typecheck
pnpm run typecheck

# 3. Code formatting and lint check
pnpm run lint

# 4. Web production bundle build verification
pnpm run build
```

---

## 2. Current Automated Coverage (17 Passing Tests)

ActionLayer maintains 17 automated unit and integration tests in [`artifacts/api-server/src/__tests__/actionlayer.test.ts`](../artifacts/api-server/src/__tests__/actionlayer.test.ts). All 17 tests pass with zero failures and zero skipped tests.

### Suite 1: Structured Extraction & Schema Validation
- **Valid Schema Acceptance:** Confirms that structured opportunity extractions adhering to `ExtractionResponseSchema` parse cleanly.
- **Malformed AI Output Rejection:** Validates that incomplete responses missing required fields (e.g., classification confidence) are strictly rejected.
- **Upper Confidence Bounds:** Rejects confidence scores greater than 1.0.
- **Lower Confidence Bounds:** Rejects negative confidence scores (< 0.0).
- **Invalid Claim Status Rejection:** Rejects hallucinated or unrecognized status enum values.

### Suite 2: AI Safety & Mock Provider Rules
- **Mock Determinism:** Verifies that `MockAiProvider` yields identical, reproducible extractions for testing environments.
- **Provider Detection:** Validates that the runtime correctly identifies active provider modes (`mock` vs `gemini`).
- **No Silent Mock Fallback:** Verifies that when `AI_PROVIDER=gemini`, API key failures or rate limits throw an honest error and **never** silently fall back to mock data.

### Suite 3: Requirement Graph & Dependency Unblocking
- **Prerequisite Blocking:** Verifies that tasks whose upstream prerequisites are incomplete are marked `blocked`.
- **Automatic Unblocking:** Verifies that when a prerequisite achieves `completed_by_user` or `verified`, downstream dependent tasks automatically transition to `ready`.
- **Next-Action Computation:** Validates that the DAG engine calculates the single highest-priority unblocked next action.

### Suite 4: Four-Factor Readiness Audit
- **Requirements Completion:** Validates priority-weighted completion percentage calculation (high-priority tasks weighted at 2x).
- **Evidence Readiness:** Validates percentage calculation of required tasks that have attached verified evidence.
- **Source Confidence:** Confirms categorization into `High`, `Medium`, or `Review required` based on uncertain or conflicting claims.
- **Deadline Risk & Explanations:** Evaluates deadline proximity, blocked tasks, and unverified deliverables into `Low`, `Medium`, `High`, or `Critical`.

### Suite 5: File Storage & Security Validation
- **Size Limit Enforcement:** Rejects uploads exceeding the strict 10MB file size ceiling.
- **MIME Type Validation:** Rejects executables (`.exe`) and unsupported MIME formats; accepts PNG, JPEG, WebP, PDF, and plain text.
- **Cryptographic Hashing:** Verifies that SHA-256 checksums are reproducible and correctly formatted (64 hexadecimal characters).

### Suite 6: Verification Results Schema
- **Multi-Level Assessment Validation:** Validates structured AI verification schemas (`VerificationResultSchema`), including transparent evaluation limitations, requirements met/missing, and recommended corrections.

---

## 3. Manual Acceptance Journey

Reviewers and developers can validate the end-to-end user workflow:

1. **Intake Source:** Open **Capture** and upload an image poster, PDF, or paste text.
2. **AI Privacy Disclosure:** Review and accept the mandatory Gemini privacy notice.
3. **Multimodal Extraction:** Gemini processes the document into structured claims with citations and page numbers.
4. **Review Grounded Claims:** Inspect extracted dates, organizers, and requirements with direct source excerpts.
5. **Human-in-the-Loop Corrections:** Edit any ambiguous claims or confirm unstated values.
6. **Activate Agent:** Preview the generated agent and compile it into an active opportunity agent.
7. **Requirement Graph:** Switch to the **Graph** tab to view the dependency DAG.
8. **Inspect Blocked Tasks:** Observe that downstream tasks remain strictly **Blocked** by upstream prerequisites.
9. **Execution Flow Modes:** Toggle between **Strict Sequential (01 → 02 → 03...)** and **Parallel DAG** modes.
10. **Complete Prerequisite:** Click *"Start Task"* then *"Mark Complete"* on an active prerequisite.
11. **Observe Automatic Unblocking:** Watch downstream dependent tasks automatically transition from **Blocked** to **Ready**.
12. **Attach Evidence:** Attach supporting evidence (text, link, or document) to a task.
13. **Inspect Verification Assessment:** Review the evaluation scope and verification level.
14. **Four-Factor Readiness Audit:** Click *"Run Four-Factor Readiness Audit"* on the Overview tab.
15. **Inspect Missing Items:** Review exact requirements missing, unverified items, and deadline risk factors.

---

## 4. Offline Capabilities & Persistence Boundary

- **Client-Side Cache (AsyncStorage):** The client retains user preferences (spatial glass wallpapers, dim levels), cached active agent views, and optimistic UI states across browser reloads.
- **Authoritative Backend (PostgreSQL):** PostgreSQL 16 is the authoritative store for all sources, claims, workflows, tasks, dependencies, evidence, and audit logs.
- **Offline Limitation:** Full offline operation is not claimed. Gemini document extractions, database mutations, and evidence file uploads require the running local Express server.

---

## 5. Remaining Test Gaps

The following testing areas are slated for upcoming production hardening:

- **End-to-End Client Automation:** Playwright / Detox test suite for multi-step browser and mobile UI interactions.
- **Live Device RevenueCat Sandbox:** Automated end-to-end testing against Apple StoreKit sandbox and Google Play billing sandbox (currently tested via RevenueCat Test Store).
- **Multi-User Ownership & Isolation:** Comprehensive multi-tenant regression suite verifying session token validation and cross-user query isolation.
- **Device Hardware APIs:** Automated native verification of camera photo capture, haptic engine feedback, and secure store access.
- **Offline Cache Migration:** Stress tests for AsyncStorage cache eviction, version migration, and network reconnection sync.