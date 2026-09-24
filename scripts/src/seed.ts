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
import { eq } from "drizzle-orm";

const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_WORKFLOW_ID = "00000000-0000-4000-8000-000000000002";
const DEMO_SOURCE_ID = "00000000-0000-4000-8000-000000000003";
const DEMO_JOB_ID = "00000000-0000-4000-8000-000000000004";

async function seed() {
  console.log("Seeding ActionLayer competition demo data...");

  // 1. Ensure Demo User exists
  const [existingUser] = await db
    .select()
    .from(actionlayerUsers)
    .where(eq(actionlayerUsers.id, DEMO_USER_ID));

  if (!existingUser) {
    await db.insert(actionlayerUsers).values({
      id: DEMO_USER_ID,
      email: "rashid.student@globaltech.edu",
      displayName: "Rashid Riyadh",
      timezone: "Asia/Kuala_Lumpur",
      preferredLanguage: "en",
      studentStatus: "undergraduate",
      institution: "Global Tech University",
    });
    console.log("✓ Created demo user:Rashid Riyadh (rashid.student@globaltech.edu)");
  }

  // Clean existing demo workflow records to allow clean re-seeding
  await db.delete(actionlayerWorkflows).where(eq(actionlayerWorkflows.id, DEMO_WORKFLOW_ID));
  await db.delete(actionlayerJobs).where(eq(actionlayerJobs.id, DEMO_JOB_ID));
  await db.delete(actionlayerSources).where(eq(actionlayerSources.id, DEMO_SOURCE_ID));

  // 2. Insert Demo Preserved Source
  const [source] = await db
    .insert(actionlayerSources)
    .values({
      id: DEMO_SOURCE_ID,
      userId: DEMO_USER_ID,
      sourceType: "image",
      originalFilename: "northstar-build-challenge-2026.png",
      storagePath: "uploads/00000000-0000-4000-8000-000000000001/sources/northstar-poster.png",
      checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      mimeType: "image/png",
      retrievalTime: new Date("2026-09-20T08:30:00Z"),
    })
    .returning();
  console.log("✓ Created demo source: northstar-build-challenge-2026.png");

  // 3. Insert Extraction Job
  await db.insert(actionlayerJobs).values({
    id: DEMO_JOB_ID,
    sourceId: source.id,
    status: "completed",
    detectedAgentType: "competition",
    classificationConfidence: 0.96,
    provider: "gemini",
    modelVersion: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    requestId: "req-demo-northstar-001",
    validationStatus: "valid",
    processingDurationMs: 840,
  });

  // 4. Insert Grounded Claims
  const claimsData = [
    {
      fieldName: "Opportunity title",
      value: "Northstar Build Challenge 2026",
      originalText: "NORTHSTAR BUILD CHALLENGE 2026",
      status: "confirmed_from_source",
      confidence: 0.98,
      sourcePage: 1,
      sourceExcerpt: "NORTHSTAR BUILD CHALLENGE 2026: Innovate for Student Life",
      requiresReview: false,
      reviewedByUser: true,
    },
    {
      fieldName: "Organizer",
      value: "Northstar Student Labs",
      originalText: "Presented by Northstar Student Labs",
      status: "confirmed_from_source",
      confidence: 0.95,
      sourcePage: 1,
      sourceExcerpt: "Presented by Northstar Student Labs in collaboration with Alumni",
      requiresReview: false,
      reviewedByUser: true,
    },
    {
      fieldName: "Eligibility",
      value: "Current university students in teams of 2 to 4 members",
      originalText: "Open to enrolled university students in teams of 2-4",
      status: "confirmed_from_source",
      confidence: 0.92,
      sourcePage: 1,
      sourceExcerpt: "Open to enrolled university students. Teams must have 2-4 members.",
      requiresReview: false,
      reviewedByUser: true,
    },
    {
      fieldName: "Submission deadline",
      value: "18 October 2026, 11:59 PM MYT",
      originalText: "Submit by 18 Oct at 11:59 PM",
      status: "inferred_needs_review",
      confidence: 0.78,
      sourcePage: 1,
      sourceExcerpt: "Submit all deliverables by 18 Oct at 11:59 PM. Late entries disqualified.",
      requiresReview: true,
      reviewedByUser: false,
    },
    {
      fieldName: "Required deliverable - Repository",
      value: "Public GitHub repository with open-source license and README",
      originalText: "Public code repo with README and open source license",
      status: "confirmed_from_source",
      confidence: 0.94,
      sourcePage: 1,
      sourceExcerpt: "Deliverable 1: Public GitHub repo with complete setup instructions and OSS license.",
      requiresReview: false,
      reviewedByUser: true,
    },
    {
      fieldName: "Required deliverable - Demo video",
      value: "Walkthrough video demonstrating working software (duration unstated)",
      originalText: "Video walkthrough of working product",
      status: "missing",
      confidence: 0.45,
      sourcePage: 1,
      sourceExcerpt: "Deliverable 2: Working product walkthrough video. (Duration not specified in poster)",
      requiresReview: true,
      reviewedByUser: false,
    },
  ];

  const insertedClaims = await db.insert(actionlayerClaims).values(
    claimsData.map((c) => ({
      sourceId: source.id,
      fieldName: c.fieldName,
      value: c.value,
      originalText: c.originalText,
      status: c.status,
      confidence: c.confidence,
      sourcePage: c.sourcePage,
      sourceExcerpt: c.sourceExcerpt,
      requiresReview: c.requiresReview,
      reviewedByUser: c.reviewedByUser,
      modelVersion: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    }))
  ).returning();
  console.log(`✓ Inserted ${insertedClaims.length} grounded claims`);

  // 5. Insert Competition Agent Workflow
  const [workflow] = await db
    .insert(actionlayerWorkflows)
    .values({
      id: DEMO_WORKFLOW_ID,
      userId: DEMO_USER_ID,
      primarySourceId: source.id,
      agentType: "competition",
      title: "Northstar Build Challenge",
      organizer: "Northstar Student Labs",
      description: "Source-grounded action workflow compiled from the Northstar 2026 poster.",
      status: "active",
      targetDeadline: new Date("2026-10-18T15:59:00Z"), // 11:59 PM MYT (UTC+8)
      deadlineNote: "18 Oct 2026 · 11:59 PM MYT",
      requirementsCompletion: 25,
      evidenceReadiness: 18,
      sourceConfidence: "Review required",
      deadlineRisk: "Medium",
      isDemo: true,
    })
    .returning();

  await db.insert(actionlayerWorkflowSources).values({
    workflowId: workflow.id,
    sourceId: source.id,
    relationshipType: "primary",
  });
  console.log("✓ Created Competition Agent: Northstar Build Challenge");

  // 6. Insert 9 Tasks with Branching Dependencies (Requirement Graph)
  const taskDefinitions = [
    {
      key: "task-eligibility",
      title: "Confirm team eligibility",
      description: "Verify that all 3 teammates are enrolled university students and agree on team roles.",
      category: "Eligibility",
      priority: "high",
      status: "completed_by_user",
      estimatedMinutes: 15,
      completionCondition: { condition: "All members verified as current university students" },
      evidencePolicy: { level: 1, type: "user_declaration", required: true },
      evidenceRequired: true,
      sequence: 1,
    },
    {
      key: "task-register",
      title: "Register for competition",
      description: "Complete registration on the competition portal before registrations close.",
      category: "Foundation",
      priority: "high",
      status: "ready",
      estimatedMinutes: 20,
      completionCondition: { condition: "Registration confirmed with participant pass" },
      evidencePolicy: { level: 2, type: "url", required: true },
      evidenceRequired: true,
      sequence: 2,
    },
    {
      key: "task-repo",
      title: "Create public GitHub repository",
      description: "Initialize public repository, configure Apache-2.0 license, and setup development environment.",
      category: "Foundation",
      priority: "high",
      status: "ready",
      estimatedMinutes: 20,
      completionCondition: { condition: "Public repository URL and LICENSE file verified" },
      evidencePolicy: { level: 3, type: "url", required: true },
      evidenceRequired: true,
      sequence: 3,
    },
    {
      key: "task-prototype",
      title: "Build working prototype",
      description: "Implement core functionality locally with working verification pipeline and tests.",
      category: "Build",
      priority: "high",
      status: "blocked",
      estimatedMinutes: 180,
      completionCondition: { condition: "Automated tests pass and application runs end-to-end locally" },
      evidencePolicy: { level: 2, type: "url", required: true },
      evidenceRequired: true,
      sequence: 4,
    },
    {
      key: "task-test",
      title: "Test critical workflow",
      description: "Validate the primary flagship journey three consecutive times from a clean state.",
      category: "Build",
      priority: "high",
      status: "blocked",
      estimatedMinutes: 45,
      completionCondition: { condition: "Flagship test suite passes without flaky or intermittent errors" },
      evidencePolicy: { level: 2, type: "text", required: true },
      evidenceRequired: true,
      sequence: 5,
    },
    {
      key: "task-readme",
      title: "Finalize README",
      description: "Document architecture, local setup instructions, data flow, and honest limitations.",
      category: "Build",
      priority: "medium",
      status: "blocked",
      estimatedMinutes: 40,
      completionCondition: { condition: "README contains all required competition sections with reproducible instructions" },
      evidencePolicy: { level: 2, type: "text", required: true },
      evidenceRequired: true,
      sequence: 6,
    },
    {
      key: "task-story",
      title: "Prepare project story",
      description: "Outline the core problem, why static prototypes fail, and how ActionLayer compiles actions.",
      category: "Presentation",
      priority: "medium",
      status: "ready",
      estimatedMinutes: 30,
      completionCondition: { condition: "Written narrative covering problem, architecture, differentiation, and impact" },
      evidencePolicy: { level: 2, type: "text", required: true },
      evidenceRequired: true,
      sequence: 7,
    },
    {
      key: "task-video",
      title: "Record demo video",
      description: "Record an end-to-end screen demonstration showing real source intake, DAG unblocking, and audit.",
      category: "Presentation",
      priority: "high",
      status: "blocked",
      estimatedMinutes: 35,
      completionCondition: { condition: "Working demonstration video recorded and verified accessible" },
      evidencePolicy: { level: 2, type: "url", required: true },
      evidenceRequired: true,
      sequence: 8,
    },
    {
      key: "task-submit",
      title: "Run final submission audit",
      description: "Run four-factor readiness audit, check all required evidence items, and submit project.",
      category: "Submission",
      priority: "high",
      status: "blocked",
      deadline: new Date("2026-10-18T15:59:00Z"),
      estimatedMinutes: 20,
      completionCondition: { condition: "Readiness audit shows 0 critical blockers and submission confirmed" },
      evidencePolicy: { level: 2, type: "image", required: true },
      evidenceRequired: true,
      sequence: 9,
    },
  ];

  const taskMap: Record<string, string> = {};
  for (const def of taskDefinitions) {
    const [t] = await db
      .insert(actionlayerTasks)
      .values({
        workflowId: workflow.id,
        workflowTaskKey: def.key,
        sequenceNumber: def.sequence,
        title: def.title,
        description: def.description,
        category: def.category,
        priority: def.priority,
        status: def.status,
        deadline: def.deadline ?? null,
        estimatedMinutes: def.estimatedMinutes,
        completionConditionJson: def.completionCondition,
        evidencePolicyJson: def.evidencePolicy,
        evidenceRequired: def.evidenceRequired,
        progressWeight: def.priority === "high" ? 2 : 1,
      })
      .returning();
    taskMap[def.key] = t.id;
  }
  console.log(`✓ Inserted 9 tasks in Requirement Graph`);

  // 7. Insert Branching Dependencies
  const dependencies = [
    { prereq: "task-eligibility", dep: "task-register" },
    { prereq: "task-eligibility", dep: "task-repo" },
    { prereq: "task-eligibility", dep: "task-story" },
    { prereq: "task-repo", dep: "task-prototype" },
    { prereq: "task-prototype", dep: "task-test" },
    { prereq: "task-repo", dep: "task-readme" },
    { prereq: "task-prototype", dep: "task-readme" },
    { prereq: "task-prototype", dep: "task-video" },
    { prereq: "task-story", dep: "task-video" },
    { prereq: "task-register", dep: "task-submit" },
    { prereq: "task-test", dep: "task-submit" },
    { prereq: "task-readme", dep: "task-submit" },
    { prereq: "task-video", dep: "task-submit" },
  ];

  for (const d of dependencies) {
    await db.insert(actionlayerTaskDependencies).values({
      prerequisiteTaskId: taskMap[d.prereq],
      dependentTaskId: taskMap[d.dep],
      dependencyType: "essential",
    });
  }
  console.log(`✓ Configured ${dependencies.length} prerequisite dependencies in Requirement Graph`);

  // 8. Ground Tasks to Claims
  await db.insert(actionlayerTaskClaims).values([
    { taskId: taskMap["task-eligibility"], claimId: insertedClaims[2].id, relationshipType: "grounded_in" },
    { taskId: taskMap["task-repo"], claimId: insertedClaims[4].id, relationshipType: "grounded_in" },
    { taskId: taskMap["task-video"], claimId: insertedClaims[5].id, relationshipType: "grounded_in" },
    { taskId: taskMap["task-submit"], claimId: insertedClaims[3].id, relationshipType: "grounded_in" },
  ]);

  // 9. Insert Evidence and Verification for Completed Task
  const [evidence] = await db
    .insert(actionlayerEvidence)
    .values({
      taskId: taskMap["task-eligibility"],
      userId: DEMO_USER_ID,
      evidenceType: "user_declaration",
      textValue: "Team roster confirmed: Rashid Riyadh (Lead), Maya Chen (Backend), Sam Patel (Frontend). All are active undergraduates at Global Tech University.",
      userExplanation: "Confirmed student IDs and active enrollment for all 3 team members.",
    })
    .returning();

  await db.insert(actionlayerVerifications).values({
    evidenceId: evidence.id,
    verificationLevel: 1,
    status: "partially_verified",
    confidence: 0.9,
    method: "User-confirmed completion",
    requirementsMetJson: ["Team has between 2 and 4 members (3 members)", "Student declaration submitted"],
    requirementsMissingJson: ["Official external university registrar verification has not been integrated"],
    limitationsJson: ["Level 1 verification relies on user declaration. Official university validation is not yet external."],
    recommendedCorrection: "Optional: attach official student ID card photos for Level 2 verification.",
    nextAction: "Complete the problem concept to unblock repository creation.",
    provider: "gemini",
    modelVersion: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  });
  console.log("✓ Recorded Level 1 verification for team eligibility");

  // 10. Seed Audit Events & Activity History
  await db.insert(actionlayerAuditEvents).values([
    {
      userId: DEMO_USER_ID,
      workflowId: workflow.id,
      eventType: "workflow_activated",
      actorType: "user",
      summary: "Competition Agent activated for Northstar Build Challenge",
      metadataJson: { source: "northstar-poster.png", claimsCount: 6 },
      createdAt: new Date("2026-09-20T09:00:00Z"),
    },
    {
      userId: DEMO_USER_ID,
      workflowId: workflow.id,
      eventType: "task_completed",
      actorType: "user",
      summary: "Completed task: Confirm team eligibility",
      metadataJson: { taskId: taskMap["task-eligibility"], verificationLevel: 1 },
      createdAt: new Date("2026-09-20T09:15:00Z"),
    },
    {
      userId: DEMO_USER_ID,
      workflowId: workflow.id,
      eventType: "task_started",
      actorType: "user",
      summary: "Started task: Define problem statement and concept",
      metadataJson: { taskId: taskMap["task-concept"] },
      createdAt: new Date("2026-09-20T09:20:00Z"),
    },
  ]);

  // 11. Seed In-App Notifications
  await db.insert(actionlayerNotifications).values([
    {
      userId: DEMO_USER_ID,
      title: "Task Blocked: Create project repository",
      message: "This task is waiting on 'Define problem statement and concept' before it can begin.",
      severity: "warning",
      createdAt: new Date("2026-09-20T09:21:00Z"),
    },
    {
      userId: DEMO_USER_ID,
      title: "Unclear Deadline Timezone",
      message: "The submission deadline was extracted as 18 Oct 11:59 PM. Please review and confirm your timezone.",
      severity: "info",
      createdAt: new Date("2026-09-20T09:05:00Z"),
    },
  ]);

  console.log("✓ Seeded audit events and notifications");
  console.log("ActionLayer database seeding complete!");
}

seed()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .then(() => process.exit(0));
