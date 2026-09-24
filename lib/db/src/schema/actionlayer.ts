import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const actionlayerUsers = pgTable(
  "actionlayer_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id"),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    timezone: text("timezone").notNull().default("UTC"),
    preferredLanguage: text("preferred_language").notNull().default("en"),
    studentStatus: text("student_status").notNull().default("undergraduate"),
    institution: text("institution"),
    ...timestamps,
  },
  (table) => [uniqueIndex("actionlayer_users_email_idx").on(table.email)],
);

export const actionlayerSources = pgTable("actionlayer_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  sourceType: text("source_type").notNull(), // 'image' | 'pdf' | 'text'
  originalFilename: text("original_filename"),
  storagePath: text("storage_path"),
  sourceUrl: text("source_url"),
  checksum: text("checksum").notNull(),
  mimeType: text("mime_type"),
  retrievalTime: timestamp("retrieval_time", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  ...timestamps,
});

export const actionlayerJobs = pgTable("actionlayer_extraction_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: uuid("source_id").notNull(),
  status: text("status").notNull().default("queued"), // 'queued' | 'processing' | 'completed' | 'failed'
  detectedAgentType: text("detected_agent_type"), // 'competition' | 'assignment' | 'application' | 'unsupported' | 'uncertain'
  classificationConfidence: real("classification_confidence"),
  provider: text("provider").notNull().default("gemini"), // 'gemini' | 'mock'
  modelVersion: text("model_version").notNull().default("gemini-2.5-flash"),
  requestId: text("request_id"),
  validationStatus: text("validation_status").notNull().default("valid"),
  processingDurationMs: integer("processing_duration_ms"),
  errorCode: text("error_code"),
  ...timestamps,
});

export const actionlayerClaims = pgTable("actionlayer_claims", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: uuid("source_id").notNull(),
  fieldName: text("field_name").notNull(),
  value: text("value").notNull(),
  originalText: text("original_text"),
  valueJson: jsonb("value_json"),
  status: text("status").notNull(), // 'confirmed_from_source' | 'supplied_by_user' | 'inferred_needs_review' | 'conflicting' | 'missing' | 'not_applicable'
  confidence: real("confidence").notNull(),
  sourcePage: integer("source_page"),
  sourceExcerpt: text("source_excerpt"),
  sourceRegionJson: jsonb("source_region_json"),
  requiresReview: boolean("requires_review").notNull().default(true),
  reviewedByUser: boolean("reviewed_by_user").notNull().default(false),
  modelVersion: text("model_version").notNull().default("gemini-2.5-flash"),
  ...timestamps,
});

export const actionlayerWorkflows = pgTable("actionlayer_workflows", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  primarySourceId: uuid("primary_source_id"),
  agentType: text("agent_type").notNull(), // 'competition' | 'assignment' | 'application'
  title: text("title").notNull(),
  organizer: text("organizer").notNull().default(""),
  description: text("description"),
  status: text("status").notNull().default("review_required"), // 'review_required' | 'active' | 'completed' | 'archived'
  targetDeadline: timestamp("target_deadline", { withTimezone: true }),
  deadlineNote: text("deadline_note"),
  requirementsCompletion: integer("requirements_completion")
    .notNull()
    .default(0),
  evidenceReadiness: integer("evidence_readiness").notNull().default(0),
  sourceConfidence: text("source_confidence")
    .notNull()
    .default("Review required"), // 'High' | 'Medium' | 'Review required'
  deadlineRisk: text("deadline_risk").notNull().default("Low"), // 'Low' | 'Medium' | 'High' | 'Critical'
  isDemo: boolean("is_demo").notNull().default(false),
  ...timestamps,
});

export const actionlayerWorkflowSources = pgTable(
  "actionlayer_workflow_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowId: uuid("workflow_id").notNull(),
    sourceId: uuid("source_id").notNull(),
    relationshipType: text("relationship_type").notNull().default("primary"), // 'primary' | 'supporting' | 'rubric'
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const actionlayerTasks = pgTable("actionlayer_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id").notNull(),
  parentId: uuid("parent_id"),
  sequenceNumber: integer("sequence_number").notNull().default(1),
  workflowTaskKey: text("workflow_task_key"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'Eligibility' | 'Plan' | 'Build' | 'Submission' | 'Final review'
  priority: text("priority").notNull().default("medium"), // 'high' | 'medium' | 'low'
  status: text("status").notNull().default("ready"), // 'draft' | 'ready' | 'in_progress' | 'blocked' | 'submitted_for_review' | 'partially_verified' | 'verified' | 'completed_by_user' | 'needs_correction' | 'skipped' | 'not_applicable'
  deadline: timestamp("deadline", { withTimezone: true }),
  estimatedMinutes: integer("estimated_minutes").notNull().default(15),
  completionConditionJson: jsonb("completion_condition_json").notNull(),
  evidencePolicyJson: jsonb("evidence_policy_json").notNull(),
  progressWeight: real("progress_weight").notNull().default(1),
  evidenceRequired: boolean("evidence_required").notNull().default(false),
  ...timestamps,
});

export const actionlayerTaskDependencies = pgTable(
  "actionlayer_task_dependencies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prerequisiteTaskId: uuid("prerequisite_task_id").notNull(),
    dependentTaskId: uuid("dependent_task_id").notNull(),
    dependencyType: text("dependency_type").notNull().default("essential"), // 'essential' | 'optional'
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const actionlayerTaskClaims = pgTable("actionlayer_task_claims", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull(),
  claimId: uuid("claim_id").notNull(),
  relationshipType: text("relationship_type").notNull().default("grounded_in"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const actionlayerEvidence = pgTable("actionlayer_evidence", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull(),
  userId: uuid("user_id").notNull(),
  evidenceType: text("evidence_type").notNull(), // 'image' | 'pdf' | 'text' | 'url' | 'user_declaration'
  storagePath: text("storage_path"),
  externalUrl: text("external_url"),
  textValue: text("text_value"),
  userExplanation: text("user_explanation").notNull(),
  ...timestamps,
});

export const actionlayerVerifications = pgTable("actionlayer_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  evidenceId: uuid("evidence_id").notNull(),
  verificationLevel: integer("verification_level").notNull(), // 0 to 4
  status: text("status").notNull(), // 'partially_verified' | 'verified' | 'needs_correction'
  confidence: real("confidence"),
  method: text("method").notNull(), // 'User-confirmed completion' | 'Evidence attachment' | 'Rule validation' | 'AI-assisted assessment'
  requirementsMetJson: jsonb("requirements_met_json").notNull(),
  requirementsMissingJson: jsonb("requirements_missing_json").notNull(),
  limitationsJson: jsonb("limitations_json").notNull(),
  recommendedCorrection: text("recommended_correction"),
  nextAction: text("next_action"),
  provider: text("provider").notNull().default("gemini"),
  modelVersion: text("model_version").notNull().default("gemini-2.5-flash"),
  requestId: text("request_id"),
  validationStatus: text("validation_status").notNull().default("valid"),
  processingDurationMs: integer("processing_duration_ms"),
  ...timestamps,
});

export const actionlayerReminders = pgTable("actionlayer_reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id").notNull(),
  taskId: uuid("task_id"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  reminderType: text("reminder_type").notNull(), // '7d' | '3d' | '1d' | '6h' | '1h'
  status: text("status").notNull().default("scheduled"), // 'scheduled' | 'delivered' | 'cancelled'
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  ...timestamps,
});

export const actionlayerAuditEvents = pgTable("actionlayer_audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  workflowId: uuid("workflow_id"),
  eventType: text("event_type").notNull(),
  actorType: text("actor_type").notNull(), // 'user' | 'agent' | 'system'
  summary: text("summary").notNull(),
  metadataJson: jsonb("metadata_json"),
  ...timestamps,
});

export const actionlayerNotifications = pgTable("actionlayer_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("info"), // 'info' | 'success' | 'warning' | 'risk'
  readAt: timestamp("read_at", { withTimezone: true }),
  ...timestamps,
});
