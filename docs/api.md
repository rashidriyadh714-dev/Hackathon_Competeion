# ActionLayer REST API Reference

The ActionLayer backend server exposes a RESTful JSON API implemented with Express 5 in [`artifacts/api-server`](../artifacts/api-server).

- **Default Server Base URL:** `http://localhost:5001`
- **API Base Path:** `/api/v1`
- **Health Endpoint:** `http://localhost:5001/api/healthz`
- **User Identity & Local Mode:** The local competition build operates in single-user mode. Requests automatically resolve to the local user ID (`00000000-0000-4000-8000-000000000001`) or accept an optional `x-user-id` request header.

---

## 1. System Health

### `GET /api/healthz`
Returns backend server health status.

- **Response:** `200 OK`
```json
{
  "status": "ok"
}
```

---

## 2. Development & Testing Fixtures

### `GET /api/v1/demo/competition`
*(Development & automated testing fixture route)*  
Returns the seeded deterministic "Northstar Build Challenge" workflow for quick evaluation.

- **Response:** `200 OK`
```json
{
  "workflow": {
    "id": "00000000-0000-4000-8000-000000000002",
    "title": "Northstar Build Challenge",
    "agentType": "competition",
    "status": "active"
  },
  "tasks": [ ... ],
  "claims": [ ... ]
}
```

---

## 3. Sources & Extraction

### `POST /api/v1/sources`
Accepts an image, PDF file, or raw text brief, records the source with a cryptographic SHA-256 hash, and queues an extraction job.

- **Content-Type:** `multipart/form-data` or `application/json`
- **Form Fields / JSON Body:**
  - `file`: (Binary, optional) Image (PNG, JPEG, WebP) or PDF file (max 10MB).
  - `textContent`: (string, optional) Pasted text announcement or guidelines.
  - `sourceType`: (string) `'image'` | `'pdf'` | `'text'`
  - `originalFilename`: (string, optional)
- **Response:** `201 Created`
```json
{
  "sourceId": "uuid",
  "jobId": "uuid",
  "status": "completed",
  "checksum": "sha256...",
  "detectedAgentType": "competition",
  "classificationConfidence": 0.96,
  "claimsCount": 6,
  "tasksCount": 7
}
```

### `GET /api/v1/extractions/:jobId/claims`
Retrieves all source-grounded claims extracted by Gemini (or MockAiProvider) for user review.

- **Parameters:** `jobId` (UUID)
- **Response:** `200 OK`
```json
{
  "jobId": "uuid",
  "status": "completed",
  "detectedAgentType": "competition",
  "claims": [
    {
      "id": "uuid",
      "fieldName": "Submission deadline",
      "value": "18 Oct 2026",
      "status": "confirmed_from_source",
      "confidence": 0.98,
      "sourcePage": 1,
      "sourceExcerpt": "All submissions must be uploaded by 18 Oct 2026 · 11:59 PM MYT",
      "requiresReview": false,
      "reviewedByUser": false
    }
  ]
}
```

### `PATCH /api/v1/claims/:claimId`
Allows the user to correct, confirm, or mark an extracted claim during the human-in-the-loop review stage.

- **Parameters:** `claimId` (UUID)
- **Body:**
```json
{
  "value": "Updated value",
  "status": "confirmed_from_source",
  "reviewedByUser": true
}
```
- **Response:** `200 OK`

### `POST /api/v1/extractions/:jobId/confirm`
Completes the human review gate, creates the compiled opportunity agent workflow, and commits the DAG tasks to PostgreSQL.

- **Parameters:** `jobId` (UUID)
- **Body:**
```json
{
  "title": "Confirmed Competition Title",
  "agentType": "competition"
}
```
- **Response:** `201 Created`
```json
{
  "workflowId": "uuid",
  "status": "active",
  "tasksCount": 7
}
```

---

## 4. Opportunity Agents & Workflows

### `GET /api/v1/agents`
Returns all active opportunity agents for the current user.

- **Response:** `200 OK`
```json
{
  "agents": [
    {
      "id": "uuid",
      "title": "Northstar Build Challenge",
      "agentType": "competition",
      "status": "active",
      "requirementsCompletion": 42,
      "evidenceReadiness": 60,
      "sourceConfidence": "High",
      "deadlineRisk": "Low"
    }
  ]
}
```

### `GET /api/v1/agents/:agentId`
Returns detailed metadata, source associations, and audit metrics for a specific agent.

- **Parameters:** `agentId` (UUID)
- **Response:** `200 OK`

### `DELETE /api/v1/agents/:agentId`
Soft-deletes or archives an agent and its associated tasks.

- **Parameters:** `agentId` (UUID)
- **Response:** `200 OK`
```json
{
  "success": true,
  "deletedAgentId": "uuid"
}
```

---

## 5. Requirement Tasks & DAG Dependency Engine

### `GET /api/v1/agents/:agentId/tasks`
Returns all tasks for the agent, annotated with prerequisite states, blocking statuses, and the calculated next action.

- **Parameters:** `agentId` (UUID)
- **Response:** `200 OK`
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Repository Setup & License",
      "category": "Foundation",
      "priority": "high",
      "status": "ready",
      "estimatedMinutes": 30,
      "evidenceRequired": true,
      "prerequisites": [],
      "blockedBy": []
    },
    {
      "id": "uuid",
      "title": "Submit Working Prototype",
      "category": "Build",
      "priority": "high",
      "status": "blocked",
      "estimatedMinutes": 120,
      "evidenceRequired": true,
      "prerequisites": ["Repository Setup & License"],
      "blockedBy": ["Repository Setup & License"]
    }
  ],
  "nextAction": {
    "taskTitle": "Repository Setup & License",
    "reason": "High-priority deliverable ready to start.",
    "isBlocked": false
  }
}
```

### `POST /api/v1/tasks/:taskId/start`
Transitions a ready task into `in_progress`.

- **Parameters:** `taskId` (UUID)
- **Response:** `200 OK`

### `POST /api/v1/tasks/:taskId/complete`
Marks a task as completed (`completed_by_user`). Automatically evaluates the DAG and transitions dependent downstream tasks from `blocked` to `ready`.

- **Parameters:** `taskId` (UUID)
- **Body:**
```json
{
  "explanation": "Completed repository setup and added Apache-2.0 license."
}
```
- **Response:** `200 OK`
```json
{
  "task": { "id": "uuid", "status": "completed_by_user" },
  "unblockedTasks": ["Submit Working Prototype"]
}
```

---

## 6. Evidence & Multi-Level Verification

### `POST /api/v1/tasks/:taskId/evidence`
Attaches evidence (file upload, text value, or repository URL) demonstrating task completion.

- **Content-Type:** `multipart/form-data` or `application/json`
- **Parameters:** `taskId` (UUID)
- **Fields:**
  - `file`: (Binary, optional) Stored in protected local disk with SHA-256 hash.
  - `textValue`: (string, optional)
  - `externalUrl`: (string, optional)
  - `evidenceType`: `'image'` | `'pdf'` | `'text'` | `'url'` | `'user_declaration'`
  - `userExplanation`: (string, required)
- **Response:** `201 Created`
```json
{
  "evidenceId": "uuid",
  "taskId": "uuid",
  "evidenceType": "url",
  "status": "partially_verified"
}
```

### `POST /api/v1/evidence/:evidenceId/verify`
Runs an AI-assisted rubric assessment (Level 3) evaluating the attached evidence against original source rules.

- **Parameters:** `evidenceId` (UUID)
- **Response:** `200 OK`
```json
{
  "verification": {
    "id": "uuid",
    "verificationLevel": 3,
    "status": "verified",
    "method": "AI-assisted assessment",
    "requirementsMet": ["Public repository URL provided", "License file detected"],
    "requirementsMissing": [],
    "confidence": 0.94,
    "limitations": ["Verification assessed repository metadata; does not evaluate runtime code execution."],
    "nextAction": "Proceed to next roadmap task."
  }
}
```

---

## 7. Readiness Audits & Telemetry

### `GET /api/v1/agents/:agentId/audit`
Executes the deterministic Four-Factor Readiness Audit for the opportunity agent.

- **Parameters:** `agentId` (UUID)
- **Response:** `200 OK`
```json
{
  "requirementsCompletion": 75,
  "evidenceReadiness": 66,
  "sourceConfidence": "High",
  "deadlineRisk": "Low",
  "readyTasks": ["Confirm Eligibility", "Repository Setup & License"],
  "missingTasks": ["Submit Final Deliverables"],
  "blockedTasks": [],
  "uncertainItems": [],
  "reasons": ["Adequate time remaining (over 20 days)."],
  "nextAction": {
    "taskTitle": "Submit Final Deliverables",
    "reason": "Final submission is ready for audit.",
    "isBlocked": false
  }
}
```

### `GET /api/v1/activity`
Returns the recent audit events and user action timeline.

- **Response:** `200 OK`

### `GET /api/v1/notifications`
Returns pending notifications and risk alerts.

- **Response:** `200 OK`

### `GET /api/v1/profile`
Fetches the active user profile, institution, student status, and timezone settings.

- **Response:** `200 OK`

### `GET /api/v1/entitlements`
Returns the active subscription tier and feature flags (e.g. `pro` entitlement).

- **Response:** `200 OK`
```json
{
  "tier": "pro",
  "entitlements": ["pro", "unlimited_extractions", "readiness_audit"],
  "isPro": true
}
```

---

## 8. Production Hardening Requirements

Prior to multi-user public deployment, the following safeguards must be enabled:
1. **Authenticated Session Middleware:** Validate Clerk session tokens on every incoming request.
2. **Ownership Predicates:** Ensure all database queries filter by `eq(table.userId, authenticatedUserId)`.
3. **Rate Limiting:** Implement token-bucket rate limiting on `/sources` and `/verify` endpoints.
4. **Idempotency Keys:** Support `Idempotency-Key` headers on extraction and evidence submission requests.