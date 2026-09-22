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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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
    ...timestamps,
  },
  (table) => [uniqueIndex("actionlayer_users_email_idx").on(table.email)],
);

export const actionlayerSources = pgTable("actionlayer_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  sourceType: text("source_type").notNull(),
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
  status: text("status").notNull().default("queued"),
  detectedAgentType: text("detected_agent_type"),
  classificationConfidence: real("classification_confidence"),
  modelVersion: text("model_version").notNull().default("mock-v1"),
  errorCode: text("error_code"),
  ...timestamps,
});

export const actionlayerClaims = pgTable("actionlayer_claims", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: uuid("source_id").notNull(),
  fieldName: text("field_name").notNull(),
  valueJson: jsonb("value_json").notNull(),
  status: text("status").notNull(),
  confidence: real("confidence").notNull(),
  sourcePage: integer("source_page"),
  sourceExcerpt: text("source_excerpt"),
  requiresReview: boolean("requires_review").notNull().default(true),
  reviewedByUser: boolean("reviewed_by_user").notNull().default(false),
  ...timestamps,
});

export const actionlayerWorkflows = pgTable("actionlayer_workflows", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  primarySourceId: uuid("primary_source_id"),
  agentType: text("agent_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("review_required"),
  targetDeadline: timestamp("target_deadline", { withTimezone: true }),
  requirementsCompletion: integer("requirements_completion").notNull().default(0),
  evidenceReadiness: integer("evidence_readiness").notNull().default(0),
  sourceConfidence: integer("source_confidence").notNull().default(0),
  deadlineRisk: text("deadline_risk").notNull().default("unknown"),
  isDemo: boolean("is_demo").notNull().default(false),
  ...timestamps,
});

export const actionlayerTasks = pgTable("actionlayer_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id").notNull(),
  parentId: uuid("parent_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("ready"),
  deadline: timestamp("deadline", { withTimezone: true }),
  estimatedMinutes: integer("estimated_minutes").notNull().default(15),
  completionConditionJson: jsonb("completion_condition_json").notNull(),
  evidencePolicyJson: jsonb("evidence_policy_json").notNull(),
  progressWeight: real("progress_weight").notNull().default(1),
  ...timestamps,
});

export const actionlayerDependencies = pgTable("actionlayer_task_dependencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  prerequisiteTaskId: uuid("prerequisite_task_id").notNull(),
  dependentTaskId: uuid("dependent_task_id").notNull(),
  dependencyType: text("dependency_type").notNull().default("essential"),
});

export const actionlayerEvidence = pgTable("actionlayer_evidence", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull(),
  userId: uuid("user_id").notNull(),
  evidenceType: text("evidence_type").notNull(),
  storagePath: text("storage_path"),
  externalUrl: text("external_url"),
  textValue: text("text_value"),
  userExplanation: text("user_explanation"),
  ...timestamps,
});

export const actionlayerVerifications = pgTable("actionlayer_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  evidenceId: uuid("evidence_id").notNull(),
  verificationLevel: integer("verification_level").notNull(),
  status: text("status").notNull(),
  confidence: real("confidence"),
  method: text("method").notNull(),
  requirementsMetJson: jsonb("requirements_met_json").notNull(),
  requirementsMissingJson: jsonb("requirements_missing_json").notNull(),
  limitationsJson: jsonb("limitations_json").notNull(),
  nextAction: text("next_action"),
  modelVersion: text("model_version"),
  ...timestamps,
});

export const actionlayerAuditEvents = pgTable("actionlayer_audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  workflowId: uuid("workflow_id"),
  eventType: text("event_type").notNull(),
  actorType: text("actor_type").notNull(),
  summary: text("summary").notNull(),
  metadataJson: jsonb("metadata_json"),
  ...timestamps,
});