import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { asc, desc, eq, and } from "drizzle-orm";
import multer from "multer";
import { db } from "@workspace/db";
import {
  actionlayerUsers,
  actionlayerSources,
  actionlayerJobs,
  actionlayerClaims,
  actionlayerWorkflows,
  actionlayerWorkflowSources,
  actionlayerTasks,
  actionlayerTaskDependencies,
  actionlayerTaskClaims,
  actionlayerEvidence,
  actionlayerVerifications,
  actionlayerAuditEvents,
  actionlayerNotifications,
} from "@workspace/db";
import { AiService, getMockCompetitionExtraction } from "../services/aiService";
import { GraphService, type TaskNode } from "../services/graphService";
import { StorageService } from "../services/storageService";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_WORKFLOW_ID = "00000000-0000-4000-8000-000000000002";

// Helper to get active user ID
function getUserId(req: Request): string {
  const headerUser = req.header("x-user-id");
  if (headerUser && headerUser.trim().length > 0) {
    return headerUser.trim();
  }
  return DEMO_USER_ID;
}

// ==========================================
// 1. DEMO COMPETITION WORKFLOW
// ==========================================
router.get("/v1/demo/competition", async (req, res, next) => {
  try {
    const [workflow] = await db
      .select()
      .from(actionlayerWorkflows)
      .where(eq(actionlayerWorkflows.id, DEMO_WORKFLOW_ID));

    if (!workflow) {
      res.status(404).json({
        error: {
          code: "demo_not_found",
          message: "Demo workflow not seeded.",
        },
      });
      return;
    }

    const tasks = await db
      .select()
      .from(actionlayerTasks)
      .where(eq(actionlayerTasks.workflowId, workflow.id))
      .orderBy(asc(actionlayerTasks.sequenceNumber));

    const dependencies = await db.select().from(actionlayerTaskDependencies);
    const claims = await db
      .select()
      .from(actionlayerClaims)
      .where(eq(actionlayerClaims.sourceId, workflow.primarySourceId!));

    const evidenceList = await db
      .select()
      .from(actionlayerEvidence)
      .where(eq(actionlayerEvidence.userId, workflow.userId));

    const verificationsList = await db.select().from(actionlayerVerifications);

    // Map tasks to TaskNodes for graph computation
    const taskNodes: TaskNode[] = tasks.map((t) => {
      const taskPrereqs = dependencies
        .filter((d) => d.dependentTaskId === t.id)
        .map((d) => d.prerequisiteTaskId);
      const hasEv = evidenceList.some((e) => e.taskId === t.id);
      const hasVer = verificationsList.some((v) =>
        evidenceList.some((e) => e.taskId === t.id && e.id === v.evidenceId),
      );
      return {
        id: t.id,
        title: t.title,
        category: t.category,
        priority: t.priority,
        status: t.status,
        estimatedMinutes: t.estimatedMinutes,
        evidenceRequired: t.evidenceRequired,
        hasEvidence: hasEv,
        hasVerification: hasVer,
        prerequisiteTaskIds: taskPrereqs,
      };
    });

    const tasksById = new Map(taskNodes.map((n) => [n.id, n]));
    const computedTasks = taskNodes.map((node) => {
      const { unsatisfiedPrereqs } = GraphService.arePrerequisitesSatisfied(
        node.id,
        tasksById,
      );
      const effectiveStatus = GraphService.computeTaskStatus(node, tasksById);
      return {
        ...node,
        status: effectiveStatus,
        waitingOn: unsatisfiedPrereqs,
      };
    });

    const audit = GraphService.computeReadinessAudit(
      taskNodes,
      claims.map((c) => ({
        fieldName: c.fieldName,
        status: c.status,
        confidence: c.confidence,
        requiresReview: c.requiresReview,
        reviewedByUser: c.reviewedByUser,
      })),
      workflow.targetDeadline,
    );

    res.json({
      workflow: {
        ...workflow,
        source: {
          filename: "northstar-build-challenge-2026.png",
          type: "image",
          privacy: "private",
          checksum:
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        },
      },
      claims,
      tasks: computedTasks,
      readiness: audit,
      isDemo: true,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. SOURCES: INTAKE & FILE UPLOAD
// ==========================================
router.post(
  "/v1/sources",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const body = req.body;
      let fileBuffer: Buffer;
      let originalFilename: string;
      let mimeType: string;
      let sourceType: "image" | "pdf" | "text" = "text";

      if (req.file) {
        const validation = StorageService.validateFile(req.file);
        if (!validation.valid) {
          res.status(400).json({
            error: { code: "invalid_file", message: validation.error },
          });
          return;
        }
        fileBuffer = req.file.buffer;
        originalFilename = req.file.originalname;
        mimeType = req.file.mimetype;
        if (mimeType.startsWith("image/")) sourceType = "image";
        else if (mimeType === "application/pdf") sourceType = "pdf";
        else sourceType = "text";
      } else if (body.text) {
        fileBuffer = Buffer.from(body.text, "utf-8");
        originalFilename = body.title
          ? `${body.title}.txt`
          : "pasted-source.txt";
        mimeType = "text/plain";
        sourceType = "text";
      } else {
        res.status(400).json({
          error: {
            code: "missing_content",
            message: "Please upload an image, PDF, or supply source text.",
          },
        });
        return;
      }

      const checksum = StorageService.computeChecksum(fileBuffer);

      // Save to Database
      const [source] = await db
        .insert(actionlayerSources)
        .values({
          userId,
          sourceType,
          originalFilename,
          checksum,
          mimeType,
          retrievalTime: new Date(),
        })
        .returning();

      // Save file to protected storage
      const saved = StorageService.saveSourceFile({
        userId,
        sourceId: source.id,
        filename: originalFilename,
        buffer: fileBuffer,
      });

      await db
        .update(actionlayerSources)
        .set({ storagePath: saved.storagePath })
        .where(eq(actionlayerSources.id, source.id));

      // Run AI Extraction (Gemini with strict Zod validation or Deterministic Mock)
      const extractionResult = await AiService.extractSource({
        sourceType,
        textContent:
          sourceType === "text" ? fileBuffer.toString("utf-8") : undefined,
        buffer: sourceType !== "text" ? fileBuffer : undefined,
        mimeType,
      });

      // Create Extraction Job record
      const [job] = await db
        .insert(actionlayerJobs)
        .values({
          sourceId: source.id,
          status: "completed",
          detectedAgentType: extractionResult.result.documentType,
          classificationConfidence:
            extractionResult.result.classificationConfidence,
          provider: extractionResult.provider,
          modelVersion: extractionResult.modelVersion,
          requestId: extractionResult.requestId,
          processingDurationMs: extractionResult.processingDurationMs,
        })
        .returning();

      // Insert Extracted Claims
      const insertedClaims = await db
        .insert(actionlayerClaims)
        .values(
          extractionResult.result.claims.map((c) => ({
            sourceId: source.id,
            fieldName: c.fieldName,
            value: c.value,
            originalText: c.originalText || c.value,
            status: c.status,
            confidence: c.confidence,
            sourcePage: c.sourcePage,
            sourceExcerpt: c.sourceExcerpt,
            requiresReview: c.requiresReview,
            reviewedByUser: false,
            modelVersion: extractionResult.modelVersion,
          })),
        )
        .returning();

      res.status(201).json({
        source: {
          id: source.id,
          originalFilename: source.originalFilename,
          sourceType: source.sourceType,
          checksum: source.checksum,
          retrievalTime: source.retrievalTime,
        },
        job: {
          id: job.id,
          detectedAgentType: job.detectedAgentType,
          classificationConfidence: job.classificationConfidence,
          provider: job.provider,
          modelVersion: job.modelVersion,
        },
        extraction: extractionResult.result,
        claims: insertedClaims,
      });
    } catch (err: any) {
      console.error("Extraction failed in routes/actionlayer.ts:", err);
      const detail = err?.message || "";
      res.status(503).json({
        error: {
          code: "extraction_failed",
          message:
            "ActionLayer couldn’t analyze this source. Your original file is still available.",
          detail,
          actions: ["retry", "manual_entry", "explore_demo"],
        },
      });
    }
  },
);

// ==========================================
// 3. EXTRACTIONS & CLAIMS
// ==========================================
router.get("/v1/extractions/:jobId/claims", async (req, res, next) => {
  try {
    const [job] = await db
      .select()
      .from(actionlayerJobs)
      .where(eq(actionlayerJobs.id, String(req.params.jobId)));

    if (!job) {
      res.status(404).json({
        error: {
          code: "job_not_found",
          message: "Extraction job not found.",
        },
      });
      return;
    }

    const claims = await db
      .select()
      .from(actionlayerClaims)
      .where(eq(actionlayerClaims.sourceId, job.sourceId));

    res.json({ job, claims });
  } catch (err) {
    next(err);
  }
});

router.patch("/v1/claims/:claimId", async (req, res, next) => {
  try {
    const body = req.body as {
      value?: string;
      status?: string;
      reviewedByUser?: boolean;
    };
    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (typeof body.value === "string") {
      updateData.value = body.value.trim();
      updateData.status = "supplied_by_user";
      updateData.reviewedByUser = true;
      updateData.requiresReview = false;
    }
    if (body.reviewedByUser === true) {
      updateData.reviewedByUser = true;
      updateData.requiresReview = false;
      if (!updateData.status) {
        updateData.status = "confirmed_from_source";
      }
    }
    if (typeof body.status === "string") {
      updateData.status = body.status;
    }

    const [updatedClaim] = await db
      .update(actionlayerClaims)
      .set(updateData)
      .where(eq(actionlayerClaims.id, String(req.params.claimId)))
      .returning();

    if (!updatedClaim) {
      res.status(404).json({
        error: { code: "claim_not_found", message: "Claim not found." },
      });
      return;
    }

    res.json(updatedClaim);
  } catch (err) {
    next(err);
  }
});

// Confirm extraction and Activate Workflow / Requirement Graph
router.post("/v1/extractions/:jobId/confirm", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const [job] = await db
      .select()
      .from(actionlayerJobs)
      .where(eq(actionlayerJobs.id, String(req.params.jobId)));

    if (!job) {
      res.status(404).json({
        error: {
          code: "job_not_found",
          message: "Extraction job not found.",
        },
      });
      return;
    }

    const claims = await db
      .select()
      .from(actionlayerClaims)
      .where(eq(actionlayerClaims.sourceId, job.sourceId));

    const titleClaim =
      claims.find((c) => c.fieldName.toLowerCase().includes("title"))?.value ||
      "Extracted Opportunity";
    const organizerClaim =
      claims.find((c) => c.fieldName.toLowerCase().includes("organizer"))
        ?.value || "";
    const deadlineClaim = claims.find((c) =>
      c.fieldName.toLowerCase().includes("deadline"),
    )?.value;

    let targetDeadline: Date | null = null;
    if (deadlineClaim) {
      const parsed = Date.parse(deadlineClaim);
      if (!isNaN(parsed)) {
        targetDeadline = new Date(parsed);
      }
    }

    // 1. Create Active Workflow
    const [workflow] = await db
      .insert(actionlayerWorkflows)
      .values({
        userId,
        primarySourceId: job.sourceId,
        agentType: job.detectedAgentType || "competition",
        title: titleClaim,
        organizer: organizerClaim,
        description: `Source-grounded agent compiled from ${job.sourceId}.`,
        status: "active",
        targetDeadline,
        deadlineNote: deadlineClaim || undefined,
        deadlineRisk: "Medium",
        isDemo: false,
      })
      .returning();

    // 2. Link Workflow & Source
    await db.insert(actionlayerWorkflowSources).values({
      workflowId: workflow.id,
      sourceId: job.sourceId,
      relationshipType: "primary",
    });

    // 3. Build Default Requirement Graph Tasks for Competition
    const mockTasks = AiService.isMockProvider()
      ? getMockCompetitionExtraction().tasks
      : [
          {
            title: "Confirm eligibility requirements",
            description:
              "Review competition rules and verify individual and team criteria.",
            category: "Eligibility",
            priority: "high" as const,
            estimatedMinutes: 20,
            dependencyTitles: [],
            evidenceRequired: true,
            evidenceType: "user_declaration" as const,
            completionCondition: "Eligibility confirmed per criteria",
          },
          {
            title: "Define problem and project scope",
            description:
              "Clarify problem statement and outline core deliverable scope.",
            category: "Plan",
            priority: "high" as const,
            estimatedMinutes: 45,
            dependencyTitles: [],
            evidenceRequired: true,
            evidenceType: "text" as const,
            completionCondition: "Problem statement documented",
          },
          {
            title: "Build and verify submission deliverable",
            description:
              "Construct required deliverable and prepare verification artifacts.",
            category: "Build",
            priority: "high" as const,
            estimatedMinutes: 120,
            dependencyTitles: ["Define problem and project scope"],
            evidenceRequired: true,
            evidenceType: "url" as const,
            completionCondition: "Deliverable verified per rubric",
          },
          {
            title: "Final submission and audit",
            description:
              "Review readiness audit and submit all verified materials.",
            category: "Final review",
            priority: "high" as const,
            estimatedMinutes: 30,
            dependencyTitles: ["Build and verify submission deliverable"],
            evidenceRequired: true,
            evidenceType: "image" as const,
            completionCondition: "Final confirmation received",
          },
        ];

    const taskMap: Record<string, string> = {};
    for (let i = 0; i < mockTasks.length; i++) {
      const def = mockTasks[i];
      const [t] = await db
        .insert(actionlayerTasks)
        .values({
          workflowId: workflow.id,
          sequenceNumber: i + 1,
          title: def.title,
          description: def.description,
          category: def.category,
          priority: def.priority,
          status: i === 0 ? "ready" : "ready",
          estimatedMinutes: def.estimatedMinutes,
          completionConditionJson: { condition: def.completionCondition },
          evidencePolicyJson: {
            type: def.evidenceType,
            required: def.evidenceRequired,
          },
          evidenceRequired: def.evidenceRequired,
          progressWeight: def.priority === "high" ? 2 : 1,
        })
        .returning();
      taskMap[def.title] = t.id;
    }

    // Build Task Dependencies
    for (const def of mockTasks) {
      const dependentId = taskMap[def.title];
      for (const prereqTitle of def.dependencyTitles) {
        const prereqId = taskMap[prereqTitle];
        if (prereqId && dependentId) {
          await db.insert(actionlayerTaskDependencies).values({
            prerequisiteTaskId: prereqId,
            dependentTaskId: dependentId,
            dependencyType: "essential",
          });
        }
      }
    }

    // Log Audit Event
    await db.insert(actionlayerAuditEvents).values({
      userId,
      workflowId: workflow.id,
      eventType: "workflow_activated",
      actorType: "user",
      summary: `Activated Competition Agent: ${workflow.title}`,
      metadataJson: {
        claimsCount: claims.length,
        tasksCount: mockTasks.length,
      },
    });

    res.status(201).json({
      workflow,
      message: "Competition Agent activated with persistent Requirement Graph.",
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. AGENTS (WORKFLOWS)
// ==========================================
router.get("/v1/agents", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const workflows = await db
      .select()
      .from(actionlayerWorkflows)
      .where(eq(actionlayerWorkflows.userId, userId))
      .orderBy(desc(actionlayerWorkflows.createdAt));

    res.json({ items: workflows });
  } catch (err) {
    next(err);
  }
});

router.get("/v1/agents/:agentId", async (req, res, next) => {
  try {
    const [workflow] = await db
      .select()
      .from(actionlayerWorkflows)
      .where(eq(actionlayerWorkflows.id, String(req.params.agentId)));

    if (!workflow) {
      res.status(404).json({
        error: {
          code: "agent_not_found",
          message: "Agent workflow not found.",
        },
      });
      return;
    }

    const tasks = await db
      .select()
      .from(actionlayerTasks)
      .where(eq(actionlayerTasks.workflowId, workflow.id))
      .orderBy(asc(actionlayerTasks.sequenceNumber));

    const dependencies = await db.select().from(actionlayerTaskDependencies);
    const claims = await db
      .select()
      .from(actionlayerClaims)
      .where(eq(actionlayerClaims.sourceId, workflow.primarySourceId!));

    const evidenceList = await db
      .select()
      .from(actionlayerEvidence)
      .where(eq(actionlayerEvidence.userId, workflow.userId));

    const taskNodes: TaskNode[] = tasks.map((t) => {
      const taskPrereqs = dependencies
        .filter((d) => d.dependentTaskId === t.id)
        .map((d) => d.prerequisiteTaskId);
      const hasEv = evidenceList.some((e) => e.taskId === t.id);
      return {
        id: t.id,
        title: t.title,
        category: t.category,
        priority: t.priority,
        status: t.status,
        estimatedMinutes: t.estimatedMinutes,
        evidenceRequired: t.evidenceRequired,
        hasEvidence: hasEv,
        hasVerification: hasEv,
        prerequisiteTaskIds: taskPrereqs,
      };
    });

    const audit = GraphService.computeReadinessAudit(
      taskNodes,
      claims.map((c) => ({
        fieldName: c.fieldName,
        status: c.status,
        confidence: c.confidence,
        requiresReview: c.requiresReview,
        reviewedByUser: c.reviewedByUser,
      })),
      workflow.targetDeadline,
    );

    res.json({
      workflow,
      readiness: audit,
      claimsCount: claims.length,
      tasksCount: tasks.length,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 5. TASKS & REQUIREMENT GRAPH
// ==========================================
router.get("/v1/agents/:agentId/tasks", async (req, res, next) => {
  try {
    const tasks = await db
      .select()
      .from(actionlayerTasks)
      .where(eq(actionlayerTasks.workflowId, String(req.params.agentId)))
      .orderBy(asc(actionlayerTasks.sequenceNumber));

    const dependencies = await db.select().from(actionlayerTaskDependencies);
    const evidenceList = await db.select().from(actionlayerEvidence);
    const verificationsList = await db.select().from(actionlayerVerifications);

    const taskNodes: TaskNode[] = tasks.map((t) => {
      const taskPrereqs = dependencies
        .filter((d) => d.dependentTaskId === t.id)
        .map((d) => d.prerequisiteTaskId);
      const hasEv = evidenceList.some((e) => e.taskId === t.id);
      return {
        id: t.id,
        title: t.title,
        category: t.category,
        priority: t.priority,
        status: t.status,
        estimatedMinutes: t.estimatedMinutes,
        evidenceRequired: t.evidenceRequired,
        hasEvidence: hasEv,
        hasVerification: hasEv,
        prerequisiteTaskIds: taskPrereqs,
      };
    });

    const tasksById = new Map(taskNodes.map((n) => [n.id, n]));

    const result = tasks.map((t) => {
      const node = tasksById.get(t.id)!;
      const { satisfied, unsatisfiedPrereqs } =
        GraphService.arePrerequisitesSatisfied(t.id, tasksById);
      const computedStatus = GraphService.computeTaskStatus(node, tasksById);
      const taskEvidence = evidenceList.find((e) => e.taskId === t.id);
      const taskVerification = taskEvidence
        ? verificationsList.find((v) => v.evidenceId === taskEvidence.id)
        : null;

      return {
        ...t,
        status: computedStatus,
        isBlocked: !satisfied,
        waitingOn: unsatisfiedPrereqs,
        evidence: taskEvidence
          ? {
              ...taskEvidence,
              verification: taskVerification,
            }
          : null,
      };
    });

    res.json({ items: result });
  } catch (err) {
    next(err);
  }
});

// Start Task (Validates prerequisites are complete)
router.post("/v1/tasks/:taskId/start", async (req, res, next) => {
  try {
    const [task] = await db
      .select()
      .from(actionlayerTasks)
      .where(eq(actionlayerTasks.id, String(req.params.taskId)));

    if (!task) {
      res.status(404).json({
        error: { code: "task_not_found", message: "Task not found." },
      });
      return;
    }

    // Check prerequisites
    const allTasks = await db
      .select()
      .from(actionlayerTasks)
      .where(eq(actionlayerTasks.workflowId, task.workflowId));
    const allDeps = await db.select().from(actionlayerTaskDependencies);

    const taskNodes: TaskNode[] = allTasks.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      status: t.status,
      estimatedMinutes: t.estimatedMinutes,
      evidenceRequired: t.evidenceRequired,
      hasEvidence: false,
      hasVerification: false,
      prerequisiteTaskIds: allDeps
        .filter((d) => d.dependentTaskId === t.id)
        .map((d) => d.prerequisiteTaskId),
    }));

    const tasksById = new Map(taskNodes.map((n) => [n.id, n]));
    const { satisfied, unsatisfiedPrereqs } =
      GraphService.arePrerequisitesSatisfied(task.id, tasksById);

    if (!satisfied) {
      res.status(400).json({
        error: {
          code: "prerequisite_unmet",
          message: `Cannot start task. Complete prerequisite first: ${unsatisfiedPrereqs.join(", ")}`,
        },
      });
      return;
    }

    const [updated] = await db
      .update(actionlayerTasks)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(actionlayerTasks.id, task.id))
      .returning();

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Complete Task (Automatically unblocks dependent tasks in the Requirement Graph)
router.post("/v1/tasks/:taskId/complete", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const [task] = await db
      .select()
      .from(actionlayerTasks)
      .where(eq(actionlayerTasks.id, String(req.params.taskId)));

    if (!task) {
      res.status(404).json({
        error: { code: "task_not_found", message: "Task not found." },
      });
      return;
    }

    // 1. Mark task completed
    const [completedTask] = await db
      .update(actionlayerTasks)
      .set({ status: "completed_by_user", updatedAt: new Date() })
      .where(eq(actionlayerTasks.id, task.id))
      .returning();

    // 2. Fetch all tasks and dependencies for this workflow to check unblocking
    const workflowTasks = await db
      .select()
      .from(actionlayerTasks)
      .where(eq(actionlayerTasks.workflowId, task.workflowId));
    const allDeps = await db.select().from(actionlayerTaskDependencies);

    const taskNodes: TaskNode[] = workflowTasks.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      status: t.id === task.id ? "completed_by_user" : t.status,
      estimatedMinutes: t.estimatedMinutes,
      evidenceRequired: t.evidenceRequired,
      hasEvidence: false,
      hasVerification: false,
      prerequisiteTaskIds: allDeps
        .filter((d) => d.dependentTaskId === t.id)
        .map((d) => d.prerequisiteTaskId),
    }));

    const tasksById = new Map(taskNodes.map((n) => [n.id, n]));
    const unblockedTaskTitles: string[] = [];

    // Check all tasks dependent on this completed task
    for (const t of workflowTasks) {
      if (
        t.id === task.id ||
        t.status === "completed_by_user" ||
        t.status === "verified"
      )
        continue;
      const { satisfied } = GraphService.arePrerequisitesSatisfied(
        t.id,
        tasksById,
      );
      if (satisfied && t.status === "blocked") {
        await db
          .update(actionlayerTasks)
          .set({ status: "ready", updatedAt: new Date() })
          .where(eq(actionlayerTasks.id, t.id));
        unblockedTaskTitles.push(t.title);
      }
    }

    // 3. Log Audit Event
    await db.insert(actionlayerAuditEvents).values({
      userId,
      workflowId: task.workflowId,
      eventType: "task_completed",
      actorType: "user",
      summary: `Completed: ${task.title}${unblockedTaskTitles.length > 0 ? ` (Unblocked: ${unblockedTaskTitles.join(", ")})` : ""}`,
      metadataJson: { taskId: task.id, unblocked: unblockedTaskTitles },
    });

    res.json({
      task: completedTask,
      unblocked: unblockedTaskTitles,
      message:
        unblockedTaskTitles.length > 0
          ? `Unblocked: ${unblockedTaskTitles.join(", ")}`
          : "Task marked complete.",
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 6. EVIDENCE & VERIFICATION
// ==========================================
router.post(
  "/v1/tasks/:taskId/evidence",
  upload.single("file"),
  async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const [task] = await db
        .select()
        .from(actionlayerTasks)
        .where(eq(actionlayerTasks.id, String(req.params.taskId)));

      if (!task) {
        res.status(404).json({
          error: { code: "task_not_found", message: "Task not found." },
        });
        return;
      }

      const body = req.body;
      let storagePath: string | null = null;
      let evidenceType = body.evidenceType || "text";
      let textValue = body.textValue || null;
      const userExplanation =
        body.userExplanation || "Evidence attached by user.";

      if (req.file) {
        const validation = StorageService.validateFile(req.file);
        if (!validation.valid) {
          res.status(400).json({
            error: { code: "invalid_file", message: validation.error },
          });
          return;
        }
        evidenceType = req.file.mimetype.startsWith("image/") ? "image" : "pdf";
        const saved = StorageService.saveEvidenceFile({
          userId,
          taskId: task.id,
          evidenceId: `ev-${Date.now()}`,
          filename: req.file.originalname,
          buffer: req.file.buffer,
        });
        storagePath = saved.storagePath;
      }

      // 1. Insert Evidence
      const [evidence] = await db
        .insert(actionlayerEvidence)
        .values({
          taskId: task.id,
          userId,
          evidenceType,
          storagePath,
          externalUrl: body.externalUrl || null,
          textValue,
          userExplanation,
        })
        .returning();

      // 2. AI-Assisted Assessment
      const evaluation = await AiService.evaluateEvidence({
        taskTitle: task.title,
        requirement:
          (task.completionConditionJson as any)?.condition || task.title,
        evidenceType,
        evidenceText: textValue,
        userExplanation,
        fileBuffer: req.file?.buffer,
        mimeType: req.file?.mimetype,
      });

      const [verification] = await db
        .insert(actionlayerVerifications)
        .values({
          evidenceId: evidence.id,
          verificationLevel: evaluation.result.verificationLevel,
          status: evaluation.result.status,
          confidence: evaluation.result.confidence ?? null,
          method: evaluation.result.method,
          requirementsMetJson: evaluation.result.requirementsMet,
          requirementsMissingJson: evaluation.result.requirementsMissing,
          limitationsJson: evaluation.result.limitations,
          recommendedCorrection:
            evaluation.result.recommendedCorrection || null,
          nextAction: evaluation.result.nextAction,
          provider: evaluation.provider,
          modelVersion: evaluation.modelVersion,
        })
        .returning();

      // 3. Update task status to submitted_for_review if not complete
      if (task.status === "ready" || task.status === "in_progress") {
        await db
          .update(actionlayerTasks)
          .set({ status: "submitted_for_review", updatedAt: new Date() })
          .where(eq(actionlayerTasks.id, task.id));
      }

      // 4. Log Audit Event
      await db.insert(actionlayerAuditEvents).values({
        userId,
        workflowId: task.workflowId,
        eventType: "evidence_attached",
        actorType: "user",
        summary: `Attached evidence to: ${task.title}`,
        metadataJson: {
          evidenceId: evidence.id,
          verificationLevel: verification.verificationLevel,
        },
      });

      res.status(201).json({ evidence, verification });
    } catch (err) {
      next(err);
    }
  },
);

// Run AI-Assisted Assessment on Evidence (Level 3)
router.post("/v1/evidence/:evidenceId/verify", async (req, res, next) => {
  try {
    const [evidence] = await db
      .select()
      .from(actionlayerEvidence)
      .where(eq(actionlayerEvidence.id, String(req.params.evidenceId)));

    if (!evidence) {
      res.status(404).json({
        error: { code: "evidence_not_found", message: "Evidence not found." },
      });
      return;
    }

    const [task] = await db
      .select()
      .from(actionlayerTasks)
      .where(eq(actionlayerTasks.id, evidence.taskId));

    const evalResult = await AiService.evaluateEvidence({
      taskTitle: task?.title || "Required Deliverable",
      requirement:
        (task?.completionConditionJson as any)?.condition ||
        "Satisfy stated competition deliverable",
      evidenceType: evidence.evidenceType,
      evidenceText:
        evidence.textValue ||
        evidence.externalUrl ||
        "Uploaded binary artifact",
      userExplanation: evidence.userExplanation,
    });

    // Record new verification (One evidence -> many verifications history)
    const [newVerification] = await db
      .insert(actionlayerVerifications)
      .values({
        evidenceId: evidence.id,
        verificationLevel: evalResult.result.verificationLevel,
        status: evalResult.result.status,
        confidence: evalResult.result.confidence,
        method: evalResult.result.method,
        requirementsMetJson: evalResult.result.requirementsMet,
        requirementsMissingJson: evalResult.result.requirementsMissing,
        limitationsJson: evalResult.result.limitations,
        recommendedCorrection: evalResult.result.recommendedCorrection,
        nextAction: evalResult.result.nextAction,
        provider: evalResult.provider,
        modelVersion: evalResult.modelVersion,
        requestId: evalResult.requestId,
        processingDurationMs: evalResult.processingDurationMs,
      })
      .returning();

    // If verified, update task to verified
    if (evalResult.result.status === "verified" && task) {
      await db
        .update(actionlayerTasks)
        .set({ status: "verified", updatedAt: new Date() })
        .where(eq(actionlayerTasks.id, task.id));
    }

    res.json({ verification: newVerification });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 7. READINESS AUDIT & ACTIVITY
// ==========================================
router.get("/v1/agents/:agentId/audit", async (req, res, next) => {
  try {
    const [workflow] = await db
      .select()
      .from(actionlayerWorkflows)
      .where(eq(actionlayerWorkflows.id, String(req.params.agentId)));

    if (!workflow) {
      res.status(404).json({
        error: {
          code: "agent_not_found",
          message: "Agent workflow not found.",
        },
      });
      return;
    }

    const tasks = await db
      .select()
      .from(actionlayerTasks)
      .where(eq(actionlayerTasks.workflowId, workflow.id))
      .orderBy(asc(actionlayerTasks.sequenceNumber));

    const dependencies = await db.select().from(actionlayerTaskDependencies);
    const claims = await db
      .select()
      .from(actionlayerClaims)
      .where(eq(actionlayerClaims.sourceId, workflow.primarySourceId!));

    const evidenceList = await db.select().from(actionlayerEvidence);

    const taskNodes: TaskNode[] = tasks.map((t) => {
      const taskPrereqs = dependencies
        .filter((d) => d.dependentTaskId === t.id)
        .map((d) => d.prerequisiteTaskId);
      const hasEv = evidenceList.some((e) => e.taskId === t.id);
      return {
        id: t.id,
        title: t.title,
        category: t.category,
        priority: t.priority,
        status: t.status,
        estimatedMinutes: t.estimatedMinutes,
        evidenceRequired: t.evidenceRequired,
        hasEvidence: hasEv,
        hasVerification: hasEv,
        prerequisiteTaskIds: taskPrereqs,
      };
    });

    const audit = GraphService.computeReadinessAudit(
      taskNodes,
      claims.map((c) => ({
        fieldName: c.fieldName,
        status: c.status,
        confidence: c.confidence,
        requiresReview: c.requiresReview,
        reviewedByUser: c.reviewedByUser,
      })),
      workflow.targetDeadline,
    );

    // Update workflow metrics in database
    await db
      .update(actionlayerWorkflows)
      .set({
        requirementsCompletion: audit.requirementsCompletion,
        evidenceReadiness: audit.evidenceReadiness,
        sourceConfidence: audit.sourceConfidence,
        deadlineRisk: audit.deadlineRisk,
        updatedAt: new Date(),
      })
      .where(eq(actionlayerWorkflows.id, workflow.id));

    res.json(audit);
  } catch (err) {
    next(err);
  }
});

router.get("/v1/activity", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const events = await db
      .select()
      .from(actionlayerAuditEvents)
      .where(eq(actionlayerAuditEvents.userId, userId))
      .orderBy(desc(actionlayerAuditEvents.createdAt));

    res.json({ items: events });
  } catch (err) {
    next(err);
  }
});

router.get("/v1/notifications", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const notifications = await db
      .select()
      .from(actionlayerNotifications)
      .where(eq(actionlayerNotifications.userId, userId))
      .orderBy(desc(actionlayerNotifications.createdAt));

    res.json({ items: notifications });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 8. PROFILE & ENTITLEMENTS
// ==========================================
router.get("/v1/profile", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const [user] = await db
      .select()
      .from(actionlayerUsers)
      .where(eq(actionlayerUsers.id, userId));

    if (!user) {
      res.json({
        id: DEMO_USER_ID,
        displayName: "Rashid Riyadh",
        email: "rashid.student@globaltech.edu",
        timezone: "Asia/Kuala_Lumpur",
        studentStatus: "undergraduate",
        institution: "Global Tech University",
      });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.get("/v1/entitlements", async (_req, res) => {
  res.json({
    tier: "student_free",
    activeAgentsLimit: 3,
    activeAgentsCount: 1,
    canRunReadinessAudit: true,
    canAttachEvidence: true,
    features: [
      "Multimodal document extraction (Gemini Flash & Mock)",
      "Source-grounded Requirement Graph with DAG dependencies",
      "Evidence verification up to Level 3",
      "Full 4-factor readiness audit",
    ],
  });
});

export default router;
