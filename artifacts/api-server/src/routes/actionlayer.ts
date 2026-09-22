import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  actionlayerEvidence,
  actionlayerJobs,
  actionlayerSources,
  actionlayerTasks,
  actionlayerVerifications,
  actionlayerWorkflows,
} from "@workspace/db";

const router: IRouter = Router();

const demoUserId = "00000000-0000-4000-8000-000000000001";
const demoWorkflowId = "00000000-0000-4000-8000-000000000002";

const demoTasks = [
  ["Confirm team eligibility", "Check that every teammate is a current university student and the team has 2–4 members.", "Eligibility", "high", "completed_by_user", 10, []],
  ["Choose a problem and concept", "Write a one-paragraph problem statement and agree on the product direction.", "Plan", "high", "in_progress", 45, []],
  ["Create the project repository", "Create the repository, add a README, and choose an open-source license.", "Build", "high", "blocked", 25, ["Choose a problem and concept"]],
  ["Build the first working prototype", "Implement the smallest demonstrable path from input to a useful result.", "Build", "high", "ready", 180, ["Choose a problem and concept"]],
  ["Document the project", "Explain the problem, solution, setup, limitations, and demo path.", "Submission", "medium", "ready", 50, ["Create the project repository"]],
  ["Record the demo video", "Record a concise walkthrough of the working product.", "Submission", "medium", "ready", 35, ["Build the first working prototype"]],
  ["Complete the final submission", "Review all required fields and submit before the deadline.", "Final review", "high", "ready", 20, ["Document the project", "Record the demo video"]],
] as const;

function demoPayload() {
  return {
    id: demoWorkflowId,
    userId: demoUserId,
    title: "Northstar Build Challenge",
    organizer: "Northstar Student Labs",
    agentType: "competition",
    status: "active",
    isDemo: true,
    source: {
      filename: "northstar-poster.png",
      type: "image",
      privacy: "private",
      checksum: "demo-checksum-northstar-2026",
    },
    claims: [
      { id: "claim-title", fieldName: "Opportunity title", value: "Northstar Build Challenge", status: "confirmed_from_source", confidence: 0.98, sourceExcerpt: "NORTHSTAR BUILD CHALLENGE 2026", reviewed: true },
      { id: "claim-organizer", fieldName: "Organizer", value: "Northstar Student Labs", status: "confirmed_from_source", confidence: 0.94, sourceExcerpt: "Presented by Northstar Student Labs", reviewed: true },
      { id: "claim-deadline", fieldName: "Submission deadline", value: "18 October 2026, 11:59 PM", status: "inferred_needs_review", confidence: 0.78, sourceExcerpt: "Submit by 18 Oct at 11:59 PM", reviewed: false },
      { id: "claim-missing", fieldName: "Required deliverable", value: "Final demo video duration is not stated", status: "missing", confidence: 0.42, sourceExcerpt: "The poster does not specify a video duration.", reviewed: false },
    ],
    tasks: demoTasks.map(([title, description, category, priority, status, estimatedMinutes, dependencyTitles], index) => ({
      id: `demo-task-${index + 1}`,
      title,
      description,
      category,
      priority,
      status,
      estimatedMinutes,
      dependencyTitles,
      evidenceRequired: true,
    })),
    readiness: {
      requirementsCompletion: 24,
      evidenceReadiness: 14,
      sourceConfidence: "Review required",
      deadlineRisk: "Medium",
    },
  };
}

router.get("/v1/demo/competition", (_req, res) => {
  res.json(demoPayload());
});

router.post("/v1/sources", async (req, res, next) => {
  try {
    const body = req.body as { sourceType?: unknown; originalFilename?: unknown; sourceUrl?: unknown; checksum?: unknown; mimeType?: unknown };
    if (typeof body.sourceType !== "string" || typeof body.checksum !== "string") {
      res.status(400).json({ error: { code: "invalid_source", message: "sourceType and checksum are required." } });
      return;
    }
    const [source] = await db.insert(actionlayerSources).values({
      userId: demoUserId,
      sourceType: body.sourceType,
      originalFilename: typeof body.originalFilename === "string" ? body.originalFilename : null,
      sourceUrl: typeof body.sourceUrl === "string" ? body.sourceUrl : null,
      checksum: body.checksum,
      mimeType: typeof body.mimeType === "string" ? body.mimeType : null,
      retrievalTime: new Date(),
    }).returning();
    const [job] = await db.insert(actionlayerJobs).values({
      sourceId: source.id,
      status: "completed",
      detectedAgentType: "competition",
      classificationConfidence: 0.86,
      modelVersion: "mock-v1",
    }).returning();
    res.status(201).json({ source, extractionJob: job });
  } catch (error) {
    next(error);
  }
});

router.get("/v1/extractions/:jobId/claims", async (req, res, next) => {
  try {
    const [job] = await db.select().from(actionlayerJobs).where(eq(actionlayerJobs.id, req.params.jobId));
    if (!job) {
      res.status(404).json({ error: { code: "job_not_found", message: "Extraction job not found." } });
      return;
    }
    res.json({ job, claims: demoPayload().claims });
  } catch (error) {
    next(error);
  }
});

router.post("/v1/extractions/:jobId/confirm", async (req, res, next) => {
  try {
    const [job] = await db.select().from(actionlayerJobs).where(eq(actionlayerJobs.id, req.params.jobId));
    if (!job) {
      res.status(404).json({ error: { code: "job_not_found", message: "Extraction job not found." } });
      return;
    }
    res.status(201).json({
      workflow: demoPayload(),
      review: {
        required: true,
        confirmationReceivedAt: new Date().toISOString(),
        note: "Claims remain editable until the user confirms them.",
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/v1/agents", async (req, res, next) => {
  try {
    const userId = typeof req.header("x-demo-user-id") === "string" ? req.header("x-demo-user-id")! : demoUserId;
    const workflows = await db.select().from(actionlayerWorkflows).where(eq(actionlayerWorkflows.userId, userId)).orderBy(asc(actionlayerWorkflows.createdAt));
    res.json({ items: workflows, nextCursor: null });
  } catch (error) {
    next(error);
  }
});

router.get("/v1/agents/:agentId/tasks", async (req, res, next) => {
  try {
    const tasks = await db.select().from(actionlayerTasks).where(eq(actionlayerTasks.workflowId, req.params.agentId)).orderBy(asc(actionlayerTasks.createdAt));
    res.json({ items: tasks });
  } catch (error) {
    next(error);
  }
});

router.post("/v1/tasks/:taskId/start", async (req, res, next) => {
  try {
    const [task] = await db.update(actionlayerTasks).set({ status: "in_progress", updatedAt: new Date() }).where(eq(actionlayerTasks.id, req.params.taskId)).returning();
    if (!task) {
      res.status(404).json({ error: { code: "task_not_found", message: "Task not found." } });
      return;
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.post("/v1/tasks/:taskId/complete", async (req, res, next) => {
  try {
    const [task] = await db.update(actionlayerTasks).set({ status: "completed_by_user", updatedAt: new Date() }).where(eq(actionlayerTasks.id, req.params.taskId)).returning();
    if (!task) {
      res.status(404).json({ error: { code: "task_not_found", message: "Task not found." } });
      return;
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.post("/v1/agents", async (req, res, next) => {
  try {
    const body = req.body as { title?: unknown; agentType?: unknown; isDemo?: unknown };
    if (typeof body.title !== "string" || body.title.trim().length < 3) {
      res.status(400).json({ error: { code: "invalid_title", message: "A workflow title is required." } });
      return;
    }
    const [workflow] = await db.insert(actionlayerWorkflows).values({
      userId: demoUserId,
      title: body.title.trim(),
      description: "Source-grounded workflow created through the ActionLayer API.",
      agentType: typeof body.agentType === "string" ? body.agentType : "competition",
      isDemo: body.isDemo === true,
      status: "active",
    }).returning();
    res.status(201).json(workflow);
  } catch (error) {
    next(error);
  }
});

router.post("/v1/tasks/:taskId/evidence", async (req, res, next) => {
  try {
    const body = req.body as { evidenceType?: unknown; textValue?: unknown; userExplanation?: unknown };
    if (typeof body.evidenceType !== "string" || typeof body.userExplanation !== "string") {
      res.status(400).json({ error: { code: "invalid_evidence", message: "Evidence type and explanation are required." } });
      return;
    }
    const [evidence] = await db.insert(actionlayerEvidence).values({
      taskId: req.params.taskId,
      userId: demoUserId,
      evidenceType: body.evidenceType,
      textValue: typeof body.textValue === "string" ? body.textValue : null,
      userExplanation: body.userExplanation,
    }).returning();
    const [verification] = await db.insert(actionlayerVerifications).values({
      evidenceId: evidence.id,
      verificationLevel: 2,
      status: "partially_verified",
      method: "Evidence attachment",
      requirementsMetJson: ["Evidence was attached to the task"],
      requirementsMissingJson: ["Rule-based verification has not run"],
      limitationsJson: ["Attachment presence does not prove the underlying requirement."],
    }).returning();
    res.status(201).json({ evidence, verification });
  } catch (error) {
    next(error);
  }
});

router.get("/v1/agents/:agentId/audit", async (req, res, next) => {
  try {
    const tasks = await db.select().from(actionlayerTasks).where(eq(actionlayerTasks.workflowId, req.params.agentId));
    const ready = tasks.filter((task) => task.status === "completed_by_user" || task.status === "verified");
    const blocked = tasks.filter((task) => task.status === "blocked");
    res.json({
      ready: ready.map((task) => task.title),
      missing: tasks.filter((task) => !["completed_by_user", "verified", "blocked"].includes(task.status)).map((task) => task.title),
      blocked: blocked.map((task) => task.title),
      uncertain: ["Submission deadline timezone interpretation", "Final demo video duration"],
      nextAction: "Finish the concept before creating the project repository.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;