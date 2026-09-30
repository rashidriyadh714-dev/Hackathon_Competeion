# ActionLayer Data Model Reference

ActionLayer models the complete source-to-audit opportunity execution pipeline in PostgreSQL using Drizzle ORM.

---

## 1. Entity Relationship Diagram

```
actionlayer_users
  │ 1
  ├───< actionlayer_sources
  │       │ 1
  │       ├───< actionlayer_extraction_jobs
  │       ├───< actionlayer_claims
  │       │       │ 1
  │       │       └───< actionlayer_task_claims >───┐
  │       │                                         │
  │       └───< actionlayer_workflow_sources >──┐   │
  │                                             │   │
  └───< actionlayer_workflows                   │   │
          │ 1                                   │   │
          ├─────────────────────────────────────┘   │
          │ 1                                       │
          ├───< actionlayer_tasks <─────────────────┘
          │       │ 1
          │       ├───< actionlayer_task_dependencies (prereq -> dependent)
          │       │
          │       └───< actionlayer_evidence
          │               │ 1
          │               └───< actionlayer_verifications
          │
          ├───< actionlayer_reminders
          ├───< actionlayer_audit_events
          └───< actionlayer_notifications
```

---

## 2. Table Definitions & Database Schema

All tables are implemented in [`lib/db/src/schema/actionlayer.ts`](../lib/db/src/schema/actionlayer.ts).

### 1. `actionlayer_users`
Stores user profile information and regional context.
- `id` (uuid, primary key, default random)
- `clerk_user_id` (text, nullable, for future Clerk session integration)
- `email` (text, not null, unique index)
- `display_name` (text, not null)
- `timezone` (text, not null, default `'UTC'`)
- `preferred_language` (text, not null, default `'en'`)
- `student_status` (text, not null, default `'undergraduate'`)
- `institution` (text, nullable)
- `created_at`, `updated_at` (timestamp with timezone)

### 2. `actionlayer_sources`
Stores cryptographically verified intake sources (posters, PDFs, text briefs).
- `id` (uuid, primary key, default random)
- `user_id` (uuid, foreign key -> `actionlayer_users.id`)
- `source_type` (text, not null: `'image'` | `'pdf'` | `'text'`)
  *(Note: URL ingestion is reserved for future crawler intake and is not currently accepted by the public intake API).*
- `original_filename` (text, nullable)
- `storage_path` (text, nullable, relative path in protected local storage)
- `source_url` (text, nullable)
- `checksum` (text, not null, 64-char SHA-256 cryptographic hash)
- `mime_type` (text, nullable)
- `retrieval_time` (timestamp with timezone, nullable)
- `deleted_at` (timestamp with timezone, nullable, for soft-deletion)
- `created_at`, `updated_at` (timestamp with timezone)

### 3. `actionlayer_extraction_jobs`
Tracks multimodal AI extraction runs and model telemetry.
- `id` (uuid, primary key, default random)
- `source_id` (uuid, foreign key -> `actionlayer_sources.id`)
- `status` (text, not null, default `'queued'`: `'queued'` | `'processing'` | `'completed'` | `'failed'`)
- `detected_agent_type` (text, nullable: `'competition'` | `'assignment'` | `'application'` | `'unsupported'` | `'uncertain'`)
- `classification_confidence` (real, nullable, 0.0 to 1.0)
- `provider` (text, not null, default `'gemini'`: `'gemini'` | `'mock'`)
- `model_version` (text, not null, default `'gemini-2.5-flash'`)
- `request_id` (text, nullable)
- `validation_status` (text, not null, default `'valid'`)
- `processing_duration_ms` (integer, nullable)
- `error_code` (text, nullable)
- `created_at`, `updated_at` (timestamp with timezone)
*(Note: To honor data minimization principles, full raw LLM responses are parsed in-memory and discarded; raw text outputs are not stored indefinitely in the database).*

### 4. `actionlayer_claims`
Stores individual source-grounded statements extracted from documents.
- `id` (uuid, primary key, default random)
- `source_id` (uuid, foreign key -> `actionlayer_sources.id`)
- `field_name` (text, not null: e.g. `'Opportunity title'`, `'Submission deadline'`, `'Eligibility'`, `'Open-source license'`)
- `value` (text, not null)
- `original_text` (text, nullable)
- `value_json` (jsonb, nullable)
- `status` (text, not null: `'confirmed_from_source'` | `'supplied_by_user'` | `'inferred_needs_review'` | `'conflicting'` | `'missing'` | `'not_applicable'`)
- `confidence` (real, not null, 0.0 to 1.0)
- `source_page` (integer, nullable, default 1)
- `source_excerpt` (text, nullable, exact quotation from document)
- `source_region_json` (jsonb, nullable)
- `requires_review` (boolean, not null, default true)
- `reviewed_by_user` (boolean, not null, default false)
- `model_version` (text, not null, default `'gemini-2.5-flash'`)
- `created_at`, `updated_at` (timestamp with timezone)

### 5. `actionlayer_workflows`
The compiled opportunity agent coordinating tasks and audit state.
- `id` (uuid, primary key, default random)
- `user_id` (uuid, foreign key -> `actionlayer_users.id`)
- `primary_source_id` (uuid, nullable, foreign key -> `actionlayer_sources.id`)
- `agent_type` (text, not null: `'competition'` | `'assignment'` | `'application'`)
- `title` (text, not null)
- `organizer` (text, not null, default `''`)
- `description` (text, nullable)
- `status` (text, not null, default `'review_required'`: `'review_required'` | `'active'` | `'completed'` | `'archived'`)
- `target_deadline` (timestamp with timezone, nullable)
- `deadline_note` (text, nullable)
- `requirements_completion` (integer, not null, default 0, 0–100)
- `evidence_readiness` (integer, not null, default 0, 0–100)
- `source_confidence` (text, not null, default `'Review required'`: `'High'` | `'Medium'` | `'Review required'`)
- `deadline_risk` (text, not null, default `'Low'`: `'Low'` | `'Medium'` | `'High'` | `'Critical'`)
- `is_demo` (boolean, not null, default false)
- `created_at`, `updated_at` (timestamp with timezone)

### 6. `actionlayer_workflow_sources` (Join Table)
Many-to-many relationship linking multiple sources to an opportunity workflow.
- `id` (uuid, primary key, default random)
- `workflow_id` (uuid, foreign key -> `actionlayer_workflows.id`)
- `source_id` (uuid, foreign key -> `actionlayer_sources.id`)
- `relationship_type` (text, not null, default `'primary'`: `'primary'` | `'supporting'` | `'rubric'`)
- `created_at` (timestamp with timezone)

### 7. `actionlayer_tasks`
Discrete requirement nodes in the execution roadmap.
- `id` (uuid, primary key, default random)
- `workflow_id` (uuid, foreign key -> `actionlayer_workflows.id`)
- `parent_id` (uuid, nullable, for nested subtasks)
- `sequence_number` (integer, not null, default 1)
- `workflow_task_key` (text, nullable)
- `title` (text, not null)
- `description` (text, not null)
- `category` (text, not null: `'Eligibility'` | `'Conflicts'` | `'Foundation'` | `'Proposal'` | `'Build'` | `'Presentation'` | `'Submission'`)
- `priority` (text, not null, default `'medium'`: `'high'` | `'medium'` | `'low'`)
- `status` (text, not null, default `'ready'`: `'draft'` | `'ready'` | `'in_progress'` | `'blocked'` | `'submitted_for_review'` | `'partially_verified'` | `'verified'` | `'completed_by_user'` | `'needs_correction'` | `'skipped'` | `'not_applicable'`)
- `deadline` (timestamp with timezone, nullable)
- `estimated_minutes` (integer, not null, default 15)
- `completion_condition_json` (jsonb, not null)
- `evidence_policy_json` (jsonb, not null)
- `progress_weight` (real, not null, default 1.0)
- `evidence_required` (boolean, not null, default false)
- `created_at`, `updated_at` (timestamp with timezone)

### 8. `actionlayer_task_dependencies`
Enforces prerequisite blocking and topological ordering between tasks.
- `id` (uuid, primary key, default random)
- `prerequisite_task_id` (uuid, foreign key -> `actionlayer_tasks.id`, upstream prerequisite)
- `dependent_task_id` (uuid, foreign key -> `actionlayer_tasks.id`, downstream task)
- `dependency_type` (text, not null, default `'essential'`: `'essential'` | `'optional'`)
- `created_at` (timestamp with timezone)

### 9. `actionlayer_task_claims` (Join Table)
Links tasks directly to the extracted document claims that govern them.
- `id` (uuid, primary key, default random)
- `task_id` (uuid, foreign key -> `actionlayer_tasks.id`)
- `claim_id` (uuid, foreign key -> `actionlayer_claims.id`)
- `relationship_type` (text, not null, default `'grounded_in'`)
- `created_at` (timestamp with timezone)

### 10. `actionlayer_evidence`
Stores artifacts and user explanations demonstrating task completion.
- `id` (uuid, primary key, default random)
- `task_id` (uuid, foreign key -> `actionlayer_tasks.id`)
- `user_id` (uuid, foreign key -> `actionlayer_users.id`)
- `evidence_type` (text, not null: `'image'` | `'pdf'` | `'text'` | `'url'` | `'user_declaration'`)
- `storage_path` (text, nullable, relative path to stored file)
- `external_url` (text, nullable, e.g. public repository link)
- `text_value` (text, nullable, text artifact or declaration)
- `user_explanation` (text, not null)
- `created_at`, `updated_at` (timestamp with timezone)

### 11. `actionlayer_verifications`
Audits evidence against task criteria across Levels 0 to 3.
- `id` (uuid, primary key, default random)
- `evidence_id` (uuid, foreign key -> `actionlayer_evidence.id`)
- `verification_level` (integer, not null: 0 to 3)
- `status` (text, not null: `'partially_verified'` | `'verified'` | `'needs_correction'`)
- `confidence` (real, nullable, 0.0 to 1.0)
- `method` (text, not null: e.g. `'User-confirmed completion'`, `'Evidence attachment'`, `'AI-assisted assessment'`)
- `requirements_met_json` (jsonb, not null, list of satisfied requirements)
- `requirements_missing_json` (jsonb, not null, list of missing requirements)
- `limitations_json` (jsonb, not null, transparent boundaries of evaluation)
- `recommended_correction` (text, nullable)
- `next_action` (text, nullable)
- `provider` (text, not null, default `'gemini'`)
- `model_version` (text, not null, default `'gemini-2.5-flash'`)
- `request_id` (text, nullable)
- `validation_status` (text, not null, default `'valid'`)
- `processing_duration_ms` (integer, nullable)
- `created_at`, `updated_at` (timestamp with timezone)

### 12. `actionlayer_reminders`
Scheduled alerts for upcoming deadlines.
- `id` (uuid, primary key, default random)
- `workflow_id` (uuid, foreign key -> `actionlayer_workflows.id`)
- `task_id` (uuid, nullable, foreign key -> `actionlayer_tasks.id`)
- `scheduled_at` (timestamp with timezone, not null)
- `reminder_type` (text, not null: `'7d'` | `'3d'` | `'1d'` | `'6h'` | `'1h'`)
- `status` (text, not null, default `'scheduled'`: `'scheduled'` | `'delivered'` | `'cancelled'`)
- `delivered_at` (timestamp with timezone, nullable)
- `created_at`, `updated_at` (timestamp with timezone)

### 13. `actionlayer_audit_events`
Immutable historical log of key workflow mutations.
- `id` (uuid, primary key, default random)
- `user_id` (uuid, foreign key -> `actionlayer_users.id`)
- `workflow_id` (uuid, nullable, foreign key -> `actionlayer_workflows.id`)
- `event_type` (text, not null: e.g. `'source_captured'`, `'claim_confirmed'`, `'task_completed'`, `'evidence_attached'`, `'readiness_audited'`)
- `actor_type` (text, not null: `'user'` | `'agent'` | `'system'`)
- `summary` (text, not null)
- `metadata_json` (jsonb, nullable)
- `created_at`, `updated_at` (timestamp with timezone)

### 14. `actionlayer_notifications`
System notifications and risk warnings.
- `id` (uuid, primary key, default random)
- `user_id` (uuid, foreign key -> `actionlayer_users.id`)
- `title` (text, not null)
- `message` (text, not null)
- `severity` (text, not null, default `'info'`: `'info'` | `'success'` | `'warning'` | `'risk'`)
- `read_at` (timestamp with timezone, nullable)
- `created_at`, `updated_at` (timestamp with timezone)