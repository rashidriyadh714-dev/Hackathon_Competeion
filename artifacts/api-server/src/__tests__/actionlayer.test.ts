import { describe, it, expect, beforeEach } from "vitest";
import {
  ExtractionResponseSchema,
  ExtractedClaimSchema,
  AiService,
  getMockCompetitionExtraction,
  VerificationResultSchema,
} from "../services/aiService";
import { GraphService, type TaskNode } from "../services/graphService";
import { StorageService } from "../services/storageService";

describe("1. Structured Extraction & Schema Validation", () => {
  it("accepts valid extraction schema", () => {
    const validData = getMockCompetitionExtraction();
    const result = ExtractionResponseSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid schema when required fields are missing", () => {
    const invalidData = {
      documentType: "competition",
      // missing classificationConfidence
      title: "Sample Hackathon",
      claims: [],
      tasks: [],
    };
    const result = ExtractionResponseSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects confidence scores outside 0 to 1", () => {
    const invalidClaim = {
      fieldName: "Submission deadline",
      value: "18 Oct 2026",
      status: "confirmed_from_source",
      confidence: 1.5, // INVALID: > 1
      sourceExcerpt: "18 Oct 2026",
    };
    const result = ExtractedClaimSchema.safeParse(invalidClaim);
    expect(result.success).toBe(false);
  });

  it("rejects negative confidence scores", () => {
    const invalidClaim = {
      fieldName: "Submission deadline",
      value: "18 Oct 2026",
      status: "confirmed_from_source",
      confidence: -0.2, // INVALID: < 0
      sourceExcerpt: "18 Oct 2026",
    };
    const result = ExtractedClaimSchema.safeParse(invalidClaim);
    expect(result.success).toBe(false);
  });

  it("rejects invalid claim statuses", () => {
    const invalidClaim = {
      fieldName: "Prize",
      value: "$10,000",
      status: "hallucinated_fact", // INVALID status
      confidence: 0.9,
    };
    const result = ExtractedClaimSchema.safeParse(invalidClaim);
    expect(result.success).toBe(false);
  });
});

describe("2. Mock Provider & AI Safety Rules", () => {
  it("MockAiProvider returns deterministic results", () => {
    const run1 = getMockCompetitionExtraction();
    const run2 = getMockCompetitionExtraction();
    expect(run1).toEqual(run2);
    expect(run1.title).toBe("Northstar Build Challenge");
    expect(run1.tasks.length).toBe(7);
  });

  it("identifies when running in mock mode vs real Gemini mode", () => {
    const previous = process.env.AI_PROVIDER;
    try {
      process.env.AI_PROVIDER = "mock";
      expect(AiService.isMockProvider()).toBe(true);
      expect(AiService.getActiveModelIdentifier()).toBe(
        "deterministic-mock-v1",
      );
    } finally {
      process.env.AI_PROVIDER = previous;
    }
  });

  it("never silently falls back to mock if in real mode and API key fails", async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    const prevProvider = process.env.AI_PROVIDER;
    try {
      process.env.AI_PROVIDER = "gemini";
      process.env.GEMINI_API_KEY = "invalid_fake_key_test";

      // Should attempt real API call and throw rather than returning silent mock
      await expect(
        AiService.extractSource({
          sourceType: "text",
          textContent: "Test hackathon announcement.",
        }),
      ).rejects.toThrow();
    } finally {
      process.env.GEMINI_API_KEY = prevKey;
      process.env.AI_PROVIDER = prevProvider;
    }
  });
});

describe("3. Requirement Graph & Dependency Unblocking", () => {
  let sampleTasks: TaskNode[];

  beforeEach(() => {
    sampleTasks = [
      {
        id: "task-concept",
        title: "Define Concept",
        category: "Plan",
        priority: "high",
        status: "in_progress",
        estimatedMinutes: 45,
        evidenceRequired: true,
        hasEvidence: false,
        hasVerification: false,
        prerequisiteTaskIds: [],
      },
      {
        id: "task-repo",
        title: "Create Repository",
        category: "Build",
        priority: "high",
        status: "blocked",
        estimatedMinutes: 25,
        evidenceRequired: true,
        hasEvidence: false,
        hasVerification: false,
        prerequisiteTaskIds: ["task-concept"],
      },
      {
        id: "task-prototype",
        title: "Build Prototype",
        category: "Build",
        priority: "high",
        status: "blocked",
        estimatedMinutes: 120,
        evidenceRequired: true,
        hasEvidence: false,
        hasVerification: false,
        prerequisiteTaskIds: ["task-concept"],
      },
    ];
  });

  it("blocks tasks whose prerequisites are incomplete", () => {
    const tasksById = new Map(sampleTasks.map((t) => [t.id, t]));
    const { satisfied, unsatisfiedPrereqs } =
      GraphService.arePrerequisitesSatisfied("task-repo", tasksById);

    expect(satisfied).toBe(false);
    expect(unsatisfiedPrereqs).toEqual(["Define Concept"]);

    const status = GraphService.computeTaskStatus(sampleTasks[1], tasksById);
    expect(status).toBe("blocked");
  });

  it("automatically unblocks dependent tasks when prerequisite completes", () => {
    // Mark concept task as completed
    sampleTasks[0].status = "completed_by_user";
    const tasksById = new Map(sampleTasks.map((t) => [t.id, t]));

    const { satisfied, unsatisfiedPrereqs } =
      GraphService.arePrerequisitesSatisfied("task-repo", tasksById);
    expect(satisfied).toBe(true);
    expect(unsatisfiedPrereqs).toEqual([]);

    const status = GraphService.computeTaskStatus(sampleTasks[1], tasksById);
    expect(status).toBe("ready");
  });

  it("identifies highest-priority unblocking next action", () => {
    // When task-concept is in progress, it must be the next action
    const next = GraphService.computeNextAction(sampleTasks);
    expect(next.taskTitle).toBe("Define Concept");
    expect(next.isBlocked).toBe(false);
  });
});

describe("4. Four-Factor Readiness Audit", () => {
  it("calculates 4 distinct readiness indicators with zero ambiguity", () => {
    const tasks: TaskNode[] = [
      {
        id: "t1",
        title: "Confirm Eligibility",
        category: "Eligibility",
        priority: "high",
        status: "completed_by_user",
        estimatedMinutes: 10,
        evidenceRequired: true,
        hasEvidence: true,
        hasVerification: true,
        prerequisiteTaskIds: [],
      },
      {
        id: "t2",
        title: "Build Prototype",
        category: "Build",
        priority: "high",
        status: "ready",
        estimatedMinutes: 120,
        evidenceRequired: true,
        hasEvidence: false,
        hasVerification: false,
        prerequisiteTaskIds: [],
      },
    ];

    const claims = [
      {
        fieldName: "Title",
        status: "confirmed_from_source",
        confidence: 0.98,
        requiresReview: false,
        reviewedByUser: true,
      },
      {
        fieldName: "Deadline",
        status: "inferred_needs_review",
        confidence: 0.75,
        requiresReview: true,
        reviewedByUser: false,
      },
    ];

    const targetDeadline = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000); // 25 days away
    const audit = GraphService.computeReadinessAudit(
      tasks,
      claims,
      targetDeadline,
    );

    expect(audit.requirementsCompletion).toBe(50);
    expect(audit.evidenceReadiness).toBe(50);
    expect(audit.sourceConfidence).toBe("Medium");
    expect(audit.deadlineRisk).toBe("Low");
    expect(audit.readyTasks).toContain("Confirm Eligibility");
    expect(audit.missingTasks).toContain("Build Prototype");
    expect(audit.uncertainItems.length).toBeGreaterThan(0);
  });
});

describe("5. File Storage & Security Validation", () => {
  it("enforces maximum file size limit (10MB)", () => {
    const oversizedFile = {
      mimetype: "image/png",
      size: 11 * 1024 * 1024, // 11 MB
      originalname: "huge.png",
    };
    const check = StorageService.validateFile(oversizedFile);
    expect(check.valid).toBe(false);
    expect(check.error).toContain("10MB");
  });

  it("rejects executable or unsupported file MIME types", () => {
    const exeFile = {
      mimetype: "application/x-msdownload",
      size: 1024,
      originalname: "danger.exe",
    };
    const check = StorageService.validateFile(exeFile);
    expect(check.valid).toBe(false);
    expect(check.error).toContain("Unsupported file type");
  });

  it("accepts supported images and documents", () => {
    for (const mime of [
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
    ]) {
      const file = {
        mimetype: mime,
        size: 2048,
        originalname: `doc.${mime.split("/")[1]}`,
      };
      const check = StorageService.validateFile(file);
      expect(check.valid).toBe(true);
    }
  });

  it("computes reproducible SHA-256 checksums", () => {
    const buffer1 = Buffer.from("ActionLayer Test Source Content", "utf-8");
    const buffer2 = Buffer.from("ActionLayer Test Source Content", "utf-8");
    const hash1 = StorageService.computeChecksum(buffer1);
    const hash2 = StorageService.computeChecksum(buffer2);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });
});

describe("6. Verification Results Schema", () => {
  it("validates Level 1 to 4 AI-assisted verification results", () => {
    const validVerification = {
      status: "partially_verified",
      verificationLevel: 4,
      method: "AI-assisted assessment",
      requirementsMet: ["Public repo URL provided", "README exists"],
      requirementsMissing: ["Demo video link not found"],
      confidence: 0.91,
      limitations: ["System checked repository metadata, not code execution."],
      recommendedCorrection: "Add public demo video link to README.",
      nextAction: "Record and attach demo video.",
    };

    const result = VerificationResultSchema.safeParse(validVerification);
    expect(result.success).toBe(true);
  });
});
