export interface TaskNode {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  estimatedMinutes: number;
  evidenceRequired: boolean;
  hasEvidence: boolean;
  hasVerification: boolean;
  prerequisiteTaskIds: string[];
}

export interface ReadinessAuditResult {
  requirementsCompletion: number; // 0..100
  evidenceReadiness: number; // 0..100
  sourceConfidence: "High" | "Medium" | "Review required";
  deadlineRisk: "Low" | "Medium" | "High" | "Critical";
  readyTasks: string[];
  missingTasks: string[];
  blockedTasks: { title: string; waitingOn: string[] }[];
  uncertainItems: string[];
  nextAction: {
    taskTitle: string;
    reason: string;
    isBlocked: boolean;
    prerequisiteTitle?: string;
  };
  reasons: string[];
}

export class GraphService {
  /**
   * Checks if all required prerequisites of a task are completed/verified.
   */
  public static arePrerequisitesSatisfied(
    taskId: string,
    tasksById: Map<string, TaskNode>,
  ): { satisfied: boolean; unsatisfiedPrereqs: string[] } {
    const task = tasksById.get(taskId);
    if (!task || task.prerequisiteTaskIds.length === 0) {
      return { satisfied: true, unsatisfiedPrereqs: [] };
    }

    const unsatisfiedPrereqs: string[] = [];
    for (const prereqId of task.prerequisiteTaskIds) {
      const prereq = tasksById.get(prereqId);
      if (!prereq) continue;
      const isComplete =
        prereq.status === "completed_by_user" || prereq.status === "verified";
      if (!isComplete) {
        unsatisfiedPrereqs.push(prereq.title);
      }
    }

    return {
      satisfied: unsatisfiedPrereqs.length === 0,
      unsatisfiedPrereqs,
    };
  }

  /**
   * Evaluates task status based on dependency rules.
   */
  public static computeTaskStatus(
    task: TaskNode,
    tasksById: Map<string, TaskNode>,
  ): "blocked" | "ready" | "in_progress" | "completed_by_user" | "verified" {
    // If already completed or verified, preserve completion
    if (task.status === "completed_by_user" || task.status === "verified") {
      return task.status;
    }

    const { satisfied } = this.arePrerequisitesSatisfied(task.id, tasksById);
    if (!satisfied) {
      return "blocked";
    }

    if (task.status === "in_progress") {
      return "in_progress";
    }

    return "ready";
  }

  /**
   * Computes the single highest-priority next action for the user.
   */
  public static computeNextAction(tasks: TaskNode[]): {
    taskTitle: string;
    reason: string;
    isBlocked: boolean;
    prerequisiteTitle?: string;
  } {
    const tasksById = new Map(tasks.map((t) => [t.id, t]));

    // 1. If there is an in-progress task that is not blocked, that is the immediate next action
    const inProgress = tasks.find((t) => t.status === "in_progress");
    if (inProgress) {
      const { satisfied, unsatisfiedPrereqs } = this.arePrerequisitesSatisfied(
        inProgress.id,
        tasksById,
      );
      if (satisfied) {
        return {
          taskTitle: inProgress.title,
          reason: "Currently in progress. Continue to maintain momentum.",
          isBlocked: false,
        };
      } else {
        return {
          taskTitle: unsatisfiedPrereqs[0],
          reason: `Unblock "${inProgress.title}" by completing its prerequisite first.`,
          isBlocked: true,
          prerequisiteTitle: unsatisfiedPrereqs[0],
        };
      }
    }

    // 2. Check if a high-priority task is blocked by a prerequisite
    const blockedHigh = tasks.find(
      (t) =>
        t.status === "blocked" &&
        (t.priority === "high" ||
          t.category === "Build" ||
          t.category === "Eligibility"),
    );
    if (blockedHigh) {
      const { unsatisfiedPrereqs } = this.arePrerequisitesSatisfied(
        blockedHigh.id,
        tasksById,
      );
      if (unsatisfiedPrereqs.length > 0) {
        return {
          taskTitle: unsatisfiedPrereqs[0],
          reason: `Complete "${unsatisfiedPrereqs[0]}" to unblock ${blockedHigh.title}.`,
          isBlocked: true,
          prerequisiteTitle: unsatisfiedPrereqs[0],
        };
      }
    }

    // 3. Find highest-priority ready task
    const readyHigh = tasks.find(
      (t) => t.status === "ready" && t.priority === "high",
    );
    if (readyHigh) {
      return {
        taskTitle: readyHigh.title,
        reason: "High-priority deliverable is ready to start.",
        isBlocked: false,
      };
    }

    // 4. Any ready task
    const anyReady = tasks.find((t) => t.status === "ready");
    if (anyReady) {
      return {
        taskTitle: anyReady.title,
        reason: "Next ready task in the action plan.",
        isBlocked: false,
      };
    }

    return {
      taskTitle: tasks[0]?.title || "Review requirements",
      reason: "All active tasks are addressed or awaiting final audit.",
      isBlocked: false,
    };
  }

  /**
   * Deterministic 4-Factor Readiness Audit
   */
  public static computeReadinessAudit(
    tasks: TaskNode[],
    claims: {
      fieldName: string;
      status: string;
      confidence: number;
      requiresReview: boolean;
      reviewedByUser: boolean;
    }[],
    targetDeadline?: Date | null,
  ): ReadinessAuditResult {
    const tasksById = new Map(tasks.map((t) => [t.id, t]));

    // 1. Requirements Completion (weighted by priority)
    let totalWeight = 0;
    let completedWeight = 0;
    const readyTasks: string[] = [];
    const missingTasks: string[] = [];
    const blockedTasks: { title: string; waitingOn: string[] }[] = [];

    for (const t of tasks) {
      const weight = t.priority === "high" ? 2 : 1;
      totalWeight += weight;

      const isDone =
        t.status === "completed_by_user" || t.status === "verified";
      if (isDone) {
        completedWeight += weight;
        readyTasks.push(t.title);
      } else {
        missingTasks.push(t.title);
        const { satisfied, unsatisfiedPrereqs } =
          this.arePrerequisitesSatisfied(t.id, tasksById);
        if (!satisfied || t.status === "blocked") {
          blockedTasks.push({ title: t.title, waitingOn: unsatisfiedPrereqs });
        }
      }
    }

    const requirementsCompletion =
      totalWeight === 0 ? 0 : Math.round((completedWeight / totalWeight) * 100);

    // 2. Evidence Readiness (tasks that require evidence and have verified/attached evidence)
    const evidenceRequiredTasks = tasks.filter((t) => t.evidenceRequired);
    const evidenceAttachedTasks = evidenceRequiredTasks.filter(
      (t) => t.hasEvidence,
    );
    const evidenceReadiness =
      evidenceRequiredTasks.length === 0
        ? 100
        : Math.round(
            (evidenceAttachedTasks.length / evidenceRequiredTasks.length) * 100,
          );

    // 3. Source Confidence
    const uncertainItems: string[] = [];
    let hasConflict = false;
    let unreviewedCount = 0;

    for (const c of claims) {
      if (c.status === "conflicting") {
        hasConflict = true;
        uncertainItems.push(`${c.fieldName}: Conflicting source statements`);
      } else if (c.status === "missing") {
        uncertainItems.push(`${c.fieldName}: Not stated in source`);
      } else if (
        !c.reviewedByUser &&
        (c.requiresReview || c.status === "inferred_needs_review")
      ) {
        unreviewedCount++;
        uncertainItems.push(
          `${c.fieldName}: Inferred value awaiting user review`,
        );
      }
    }

    let sourceConfidence: "High" | "Medium" | "Review required" = "High";
    if (hasConflict || unreviewedCount >= 2) {
      sourceConfidence = "Review required";
    } else if (unreviewedCount === 1) {
      sourceConfidence = "Medium";
    }

    // 4. Deadline Risk
    const reasons: string[] = [];
    let riskScore = 0;

    if (targetDeadline) {
      const daysRemaining =
        (targetDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysRemaining < 3 && requirementsCompletion < 80) {
        riskScore += 3;
        reasons.push(
          "Deadline is under 3 days and requirements are incomplete.",
        );
      } else if (daysRemaining < 14 && requirementsCompletion < 40) {
        riskScore += 2;
        reasons.push(
          "Less than 2 weeks remaining with more than half of deliverables unfinished.",
        );
      } else if (daysRemaining >= 20) {
        reasons.push("Adequate time remaining (over 20 days).");
      }
    }

    if (blockedTasks.length > 0) {
      riskScore += 1;
      reasons.push(
        `${blockedTasks.length} task(s) currently blocked by prerequisites.`,
      );
    }

    if (unreviewedCount > 0) {
      reasons.push(
        `${unreviewedCount} source claim(s) require review to avoid inaccurate assumptions.`,
      );
    }

    let deadlineRisk: "Low" | "Medium" | "High" | "Critical" = "Low";
    if (riskScore >= 4) {
      deadlineRisk = "Critical";
    } else if (riskScore >= 2) {
      deadlineRisk = "High";
    } else if (riskScore === 1 || blockedTasks.length > 0) {
      deadlineRisk = "Medium";
    }

    const nextAction = this.computeNextAction(tasks);

    return {
      requirementsCompletion,
      evidenceReadiness,
      sourceConfidence,
      deadlineRisk,
      readyTasks,
      missingTasks,
      blockedTasks,
      uncertainItems,
      nextAction,
      reasons,
    };
  }
}
