# ActionLayer Data Model Reference

ActionLayer models the complete opportunity compilation pipeline in PostgreSQL using Drizzle ORM.

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│   actionlayer   │ 1   * │   actionlayer   │
│     _users      │──────<│     _sources    │
└────────┬────────┘       └────────┬────────┘
         │ 1                       │ 1
         │                         │
         ▼ *                       ▼ *
┌─────────────────┐       ┌─────────────────┐
│   actionlayer   │ *   * │   actionlayer   │
│   _workflows    │───────│_workflow_sources│
└────────┬────────┘       └─────────────────┘
         │ 1                       │
         │                         ▼
         ▼ *              ┌─────────────────┐
┌─────────────────┐       │   actionlayer   │
│   actionlayer   │       │_extraction_jobs │
│     _tasks      │       └────────┬────────┘
└────────┬────────┘                │ 1
         │                         ▼ *
         │ *   * ┌─────────────────┐
         ├───────│ actionlayer     │
         │       │  _task_claims   │
         │       └────────┬────────┘
         │ 1              │ *
         │                ▼ 1
         │       ┌─────────────────┐
         │       │   actionlayer   │
         │       │     _claims     │
         │       └─────────────────┘
         │ 1
         ├─────────────────────────────────────┐
         │ 1                                   │ 1
         ▼ *                                   ▼ *
┌─────────────────┐                   ┌─────────────────┐
│   actionlayer   │                   │   actionlayer   │
│_task_dependenci │                   │    _evidence    │
└─────────────────┘                   └────────┬────────┘
                                               │ 1
                                               ▼ *
                                      ┌─────────────────┐
                                      │   actionlayer   │
                                      │  _verifications │
                                      └─────────────────┘
```

---

## Detailed Schema Table Definitions

### 1. `actionlayer_users`
- `id` (text, primary key)
- `email` (text, not null)
- `name` (text, not null)
- `timezone` (text, default 'UTC')
- `language` (text, default 'en')
- `created_at`, `updated_at` (timestamp)

### 2. `actionlayer_sources`
- `id` (text, primary key)
- `user_id` (foreign key -> `actionlayer_users.id`)
- `type` (text: 'image', 'pdf', 'text', 'url')
- `label` (text, original filename)
- `mime_type` (text)
- `storage_path` (text, application-managed local path)
- `sha256_hash` (text, 64-char cryptographic hash)
- `content_text` (text, optional cached plaintext)
- `byte_size` (integer)
- `created_at`, `updated_at`, `deleted_at` (timestamp)

### 3. `actionlayer_workflows`
- `id` (text, primary key)
- `user_id` (foreign key -> `actionlayer_users.id`)
- `agent_type` (text: 'competition', 'assignment', 'application')
- `title` (text)
- `organizer` (text)
- `status` (text: 'active', 'review_required', 'completed', 'archived')
- `target_deadline` (timestamp)
- `deadline_note` (text)
- `is_demo` (boolean, default false)
- `created_at`, `updated_at` (timestamp)

### 4. `actionlayer_workflow_sources` (Many-to-Many)
- `id` (text, primary key)
- `workflow_id` (foreign key -> `actionlayer_workflows.id`)
- `source_id` (foreign key -> `actionlayer_sources.id`)
- `relationship_type` (text: 'primary', 'supplementary', 'syllabus', 'rubric')
- `created_at` (timestamp)

### 5. `actionlayer_extraction_jobs`
- `id` (text, primary key)
- `source_id` (foreign key -> `actionlayer_sources.id`)
- `user_id` (foreign key -> `actionlayer_users.id`)
- `status` (text: 'pending', 'processing', 'completed', 'failed')
- `provider` (text: 'gemini', 'mock')
- `model_version` (text: 'gemini-2.5-flash', 'deterministic-mock')
- `validation_status` (text: 'valid', 'schema_invalid', 'rejected')
- `processing_duration_ms` (integer)
- `raw_output_json` (text)
- `error_message` (text)
- `created_at`, `updated_at` (timestamp)

### 6. `actionlayer_claims`
- `id` (text, primary key)
- `job_id` (foreign key -> `actionlayer_extraction_jobs.id`)
- `source_id` (foreign key -> `actionlayer_sources.id`)
- `field_name` (text: 'title', 'organizer', 'deadline', 'eligibility', 'license', etc.)
- `value` (text)
- `original_text` (text)
- `status` (text: 'confirmed_from_source', 'supplied_by_user', 'inferred_needs_review', 'conflicting', 'missing', 'not_applicable')
- `confidence` (real, 0.0 to 1.0)
- `source_excerpt` (text)
- `source_page` (integer, optional)
- `requires_review` (boolean)
- `reviewed_by_user` (boolean)
- `model_version` (text)
- `created_at`, `updated_at` (timestamp)

### 7. `actionlayer_tasks`
- `id` (text, primary key)
- `workflow_id` (foreign key -> `actionlayer_workflows.id`)
- `title` (text)
- `description` (text)
- `category` (text: 'Eligibility', 'Plan', 'Build', 'Documentation', 'Submission')
- `priority` (text: 'high', 'medium', 'low')
- `status` (text: 'ready', 'in_progress', 'blocked', 'submitted_for_review', 'partially_verified', 'verified', 'completed_by_user', 'needs_correction')
- `estimated_minutes` (integer)
- `sequence_number` (integer)
- `completion_condition` (text)
- `evidence_required` (boolean)
- `deadline` (timestamp)
- `created_at`, `updated_at` (timestamp)

### 8. `actionlayer_task_claims` (Many-to-Many)
- `id` (text, primary key)
- `task_id` (foreign key -> `actionlayer_tasks.id`)
- `claim_id` (foreign key -> `actionlayer_claims.id`)
- `relationship_type` (text: 'governs', 'informs', 'prerequisite_source')
- `created_at` (timestamp)

### 9. `actionlayer_task_dependencies`
- `id` (text, primary key)
- `task_id` (foreign key -> `actionlayer_tasks.id`, downstream task)
- `prerequisite_task_id` (foreign key -> `actionlayer_tasks.id`, upstream prerequisite)
- `is_required` (boolean, default true)
- `created_at` (timestamp)

### 10. `actionlayer_evidence`
- `id` (text, primary key)
- `task_id` (foreign key -> `actionlayer_tasks.id`)
- `user_id` (foreign key -> `actionlayer_users.id`)
- `type` (text: 'image', 'pdf', 'text', 'user_declaration')
- `label` (text)
- `explanation` (text)
- `storage_path` (text, optional)
- `sha256_hash` (text, optional)
- `created_at`, `updated_at` (timestamp)

### 11. `actionlayer_verifications` (One-to-Many with Evidence)
- `id` (text, primary key)
- `evidence_id` (foreign key -> `actionlayer_evidence.id`)
- `task_id` (foreign key -> `actionlayer_tasks.id`)
- `status` (text: 'partially_verified', 'verified', 'needs_correction')
- `level` (integer: 0 to 3)
- `method` (text: 'User-confirmed completion', 'Evidence attachment', 'Deterministic rule', 'AI-assisted assessment')
- `requirements_met_json` (text)
- `requirements_missing_json` (text)
- `confidence` (real, optional)
- `limitations_json` (text)
- `recommended_correction` (text)
- `next_action` (text)
- `model_version` (text)
- `created_at` (timestamp)

### 12. `actionlayer_audit_events`
- `id` (text, primary key)
- `user_id` (foreign key -> `actionlayer_users.id`)
- `workflow_id` (foreign key -> `actionlayer_workflows.id`, optional)
- `event_type` (text: 'source_captured', 'extraction_reviewed', 'claim_confirmed', 'task_completed', 'evidence_attached', 'readiness_audited')
- `summary` (text)
- `metadata_json` (text)
- `created_at` (timestamp)

### 13. `actionlayer_readiness_audits`
- `id` (text, primary key)
- `workflow_id` (foreign key -> `actionlayer_workflows.id`)
- `requirements_completion_pct` (integer)
- `evidence_readiness_pct` (integer)
- `source_confidence_level` (text: 'High', 'Medium', 'Review Required', 'Uncertain')
- `deadline_risk_level` (text: 'Low', 'Medium', 'High', 'Critical')
- `risk_reasons_json` (text)
- `missing_items_json` (text)
- `created_at` (timestamp)

### 14. `actionlayer_notifications`
- `id` (text, primary key)
- `user_id` (foreign key -> `actionlayer_users.id`)
- `title` (text)
- `message` (text)
- `read` (boolean, default false)
- `created_at` (timestamp)