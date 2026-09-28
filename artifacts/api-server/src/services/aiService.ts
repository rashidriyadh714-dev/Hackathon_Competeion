import { z } from "zod";

// --- Schema Definitions for Structured AI Output ---

export const ExtractedClaimSchema = z.object({
  fieldName: z.string().min(1),
  value: z.string().min(1),
  originalText: z.string().optional().default(""),
  status: z.enum([
    "confirmed_from_source",
    "supplied_by_user",
    "inferred_needs_review",
    "conflicting",
    "missing",
    "not_applicable",
  ]),
  confidence: z.number().min(0).max(1),
  sourceExcerpt: z.string().optional().default(""),
  sourcePage: z.number().int().optional().default(1),
  requiresReview: z.boolean().optional(),
  requiresTimezoneReview: z.boolean().optional(),
});

export const ExtractedTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category: z
    .enum([
      "Eligibility",
      "Conflicts",
      "Foundation",
      "Proposal",
      "Build",
      "Presentation",
      "Submission",
    ])
    .default("Foundation"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  estimatedMinutes: z.number().int().min(5).max(10000).default(30),
  dependencyTitles: z.array(z.string()).default([]),
  evidenceRequired: z.boolean().default(true),
  evidenceType: z
    .enum(["image", "pdf", "text", "url", "user_declaration"])
    .default("text"),
  completionCondition: z.string().default("Completed per stated requirements"),
});

export const ExtractionResponseSchema = z.object({
  documentType: z
    .string()
    .describe(
      "Classify the document in 1 to 3 words (e.g. Scholarship, Competition, Grant Application, Hackathon, Research Assignment)",
    ),
  classificationConfidence: z.number().min(0).max(1),
  title: z.string().min(1),
  organizer: z.string().default(""),
  targetDeadline: z.string().nullable().optional(),
  deadlineNote: z.string().nullable().optional(),
  claims: z.array(ExtractedClaimSchema).min(1),
  tasks: z.array(ExtractedTaskSchema).min(1),
  deadlineRisk: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
  reviewSummary: z.string().default(""),
  coverageReport: z
    .object({
      totalRequiredClaims: z.number().int(),
      mappedToTasks: z.number().int(),
      mappedToConditions: z.number().int(),
      unmappedClaims: z.number().int(),
      conflictingClaims: z.number().int(),
      missingInformation: z.number().int(),
      totalGraphTasks: z.number().int(),
      totalDependencyEdges: z.number().int(),
      isAcyclic: z.boolean(),
      prerequisitesVisible: z.boolean(),
    })
    .optional(),
});

export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>;

export const VerificationResultSchema = z.object({
  status: z.enum(["verified", "partially_verified", "needs_correction"]),
  verificationLevel: z.number().int().min(1).max(4),
  method: z.string(),
  requirementsMet: z.array(z.string()),
  requirementsMissing: z.array(z.string()),
  confidence: z.number().min(0).max(1).optional(),
  limitations: z.array(z.string()),
  recommendedCorrection: z.string().optional(),
  nextAction: z.string(),
});

export type VerificationResult = z.infer<typeof VerificationResultSchema>;

// --- Deterministic Mock Data Fixtures ---

export function getMockCompetitionExtraction(): ExtractionResponse {
  return {
    documentType: "competition",
    classificationConfidence: 0.96,
    title: "Northstar Build Challenge",
    organizer: "Northstar Student Labs",
    targetDeadline: "2026-10-18T15:59:00Z",
    deadlineNote: "18 Oct 2026 · 11:59 PM MYT",
    deadlineRisk: "Medium",
    reviewSummary:
      "Opportunity classified as Student Hackathon / Build Challenge. 6 claims extracted, 2 require user confirmation.",
    claims: [
      {
        fieldName: "Opportunity title",
        value: "Northstar Build Challenge",
        originalText: "NORTHSTAR BUILD CHALLENGE 2026",
        status: "confirmed_from_source",
        confidence: 0.98,
        sourceExcerpt:
          "NORTHSTAR BUILD CHALLENGE 2026: Innovate for Student Life",
        sourcePage: 1,
        requiresReview: false,
      },
      {
        fieldName: "Organizer",
        value: "Northstar Student Labs",
        originalText: "Presented by Northstar Student Labs",
        status: "confirmed_from_source",
        confidence: 0.95,
        sourceExcerpt:
          "Presented by Northstar Student Labs in collaboration with Alumni",
        sourcePage: 1,
        requiresReview: false,
      },
      {
        fieldName: "Eligibility",
        value: "Current university students in teams of 2 to 4 members",
        originalText: "Open to enrolled university students in teams of 2-4",
        status: "confirmed_from_source",
        confidence: 0.92,
        sourceExcerpt:
          "Open to enrolled university students. Teams must have 2-4 members.",
        sourcePage: 1,
        requiresReview: false,
      },
      {
        fieldName: "Submission deadline",
        value: "18 October 2026, 11:59 PM",
        originalText: "Submit by 18 Oct at 11:59 PM",
        status: "inferred_needs_review",
        confidence: 0.78,
        sourceExcerpt:
          "Submit all deliverables by 18 Oct at 11:59 PM. Late entries disqualified.",
        sourcePage: 1,
        requiresReview: true,
        requiresTimezoneReview: true,
      },
      {
        fieldName: "Required deliverable - Repository",
        value: "Public GitHub repository with open-source license and README",
        originalText: "Public code repo with README and open source license",
        status: "confirmed_from_source",
        confidence: 0.94,
        sourceExcerpt:
          "Deliverable 1: Public GitHub repo with complete setup instructions and OSS license.",
        sourcePage: 1,
        requiresReview: false,
      },
      {
        fieldName: "Required deliverable - Demo video",
        value: "Working product walkthrough video (duration not specified)",
        originalText: "Video walkthrough of working product",
        status: "missing",
        confidence: 0.45,
        sourceExcerpt: "Deliverable 2: Working product walkthrough video.",
        sourcePage: 1,
        requiresReview: true,
      },
    ],
    tasks: [
      {
        title: "Confirm team eligibility",
        description:
          "Verify that all 3 teammates are enrolled university students and agree on team roles.",
        category: "Eligibility",
        priority: "high",
        estimatedMinutes: 15,
        dependencyTitles: [],
        evidenceRequired: true,
        evidenceType: "user_declaration",
        completionCondition:
          "All members verified as current university students",
      },
      {
        title: "Define problem statement and concept",
        description:
          "Write a clear one-paragraph problem statement and agree on the student life solution concept.",
        category: "Foundation",
        priority: "high",
        estimatedMinutes: 45,
        dependencyTitles: [],
        evidenceRequired: true,
        evidenceType: "text",
        completionCondition:
          "Agreed problem statement and architecture sketch documented",
      },
      {
        title: "Create project repository and setup",
        description:
          "Initialize public GitHub repository, configure Apache-2.0 license, and create initial README.",
        category: "Build",
        priority: "high",
        estimatedMinutes: 25,
        dependencyTitles: ["Define problem statement and concept"],
        evidenceRequired: true,
        evidenceType: "url",
        completionCondition:
          "Public GitHub repository with valid OSS license and README",
      },
      {
        title: "Build core working prototype slice",
        description:
          "Implement the end-to-end working path demonstrating key student workflow.",
        category: "Build",
        priority: "high",
        estimatedMinutes: 180,
        dependencyTitles: ["Define problem statement and concept"],
        evidenceRequired: true,
        evidenceType: "url",
        completionCondition:
          "Working software demo runnable locally without errors",
      },
      {
        title: "Document setup, architecture, and limitations",
        description:
          "Write comprehensive README explaining problem, solution, setup guide, and honest limitations.",
        category: "Submission",
        priority: "medium",
        estimatedMinutes: 50,
        dependencyTitles: ["Create project repository and setup"],
        evidenceRequired: true,
        evidenceType: "text",
        completionCondition:
          "README covers all competition evaluation criteria",
      },
      {
        title: "Record video walkthrough",
        description:
          "Record concise demonstration video showing the working software in action.",
        category: "Submission",
        priority: "medium",
        estimatedMinutes: 35,
        dependencyTitles: ["Build core working prototype slice"],
        evidenceRequired: true,
        evidenceType: "url",
        completionCondition:
          "Video link recorded and verified publicly accessible",
      },
      {
        title: "Complete final submission audit and submit",
        description:
          "Perform final readiness audit, verify all deliverables, and submit on competition portal.",
        category: "Submission",
        priority: "high",
        estimatedMinutes: 20,
        dependencyTitles: [
          "Document setup, architecture, and limitations",
          "Record video walkthrough",
        ],
        evidenceRequired: true,
        evidenceType: "image",
        completionCondition:
          "All deliverables attached and submission confirmation receipt saved",
      },
    ],
  };
}

// --- Gemini API & Mock Service ---

export class AiService {
  private static getModel(): string {
    return process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  private static getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY?.trim();
  }

  public static isMockProvider(): boolean {
    const forced = process.env.AI_PROVIDER === "mock";
    const noKey = !this.getApiKey();
    return forced || noKey;
  }

  public static getActiveModelIdentifier(): string {
    return this.isMockProvider() ? "deterministic-mock-v1" : this.getModel();
  }

  /**
   * Multimodal extraction from image, PDF, or text.
   * If in mock mode: returns deterministic fixture.
   * If in real mode: calls Google Gemini API, validates with Zod, or throws on failure.
   */
  public static async extractSource(options: {
    sourceType: "image" | "pdf" | "text";
    textContent?: string;
    buffer?: Buffer;
    mimeType?: string;
  }): Promise<{
    result: ExtractionResponse;
    provider: string;
    modelVersion: string;
    processingDurationMs: number;
    requestId: string;
  }> {
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (this.isMockProvider()) {
      return {
        result: getMockCompetitionExtraction(),
        provider: "mock",
        modelVersion: "deterministic-mock-v1",
        processingDurationMs: Date.now() - startTime,
        requestId,
      };
    }

    // Call Google Gemini API
    const apiKey = this.getApiKey()!;
    const model = this.getModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemPrompt = `You are the ActionLayer Action Compiler.
Analyze the provided document (poster, screenshot, syllabus, assignment, or competition announcement).
Extract source-grounded opportunity information and output strictly valid JSON matching the schema below.

CRITICAL GRAPH REQUIREMENTS:
1. DAG Structure (CRITICAL): DO NOT output a simple linear chain (A -> B -> C -> D). You MUST produce a branching Directed Acyclic Graph (DAG) representing parallel workstreams. If Task B and Task C can be done simultaneously, they should BOTH depend on Task A, and neither should depend on each other.
2. Conflicts: Separate the deadline conflict from team/eligibility conflicts. These should be early, parallel tasks.
3. Decoupling: Code/Build tasks and Proposal/Writing tasks should generally run in parallel. Do not make "Develop Working Prototype" depend on "Draft Project Proposal" or vice versa unless explicitly required by the source.
4. Granularity: Decompose "Final Submission" into distinct audit and submission tasks.
5. Complexity: The number of tasks should scale with document complexity (e.g., 3 tasks for simple documents, up to ~15 tasks for complex rulebooks).
6. Categories: All tasks must map to one of: "Eligibility", "Conflicts", "Foundation", "Proposal", "Build", "Presentation", "Submission".
7. Conditions: Store detailed document rules as completion conditions under the correct task. Generate conditional tasks only when the user's circumstances make them applicable.
8. Validation: Make the Final Readiness Audit depend on every required parallel branch, and make Submit Application depend on a passed final audit. Every 'dependencyTitle' must exactly match the 'title' of another generated task. No nonexistent prerequisites.

JSON SCHEMA:
{
  "documentType": "String",
  "classificationConfidence": number,
  "title": string,
  "organizer": string,
  "targetDeadline": string (ISO-8601 if identifiable) or null,
  "deadlineNote": string,
  "deadlineRisk": "Low" | "Medium" | "High" | "Critical",
  "reviewSummary": string,
  "coverageReport": {
    "totalRequiredClaims": number,
    "mappedToTasks": number,
    "mappedToConditions": number,
    "unmappedClaims": number,
    "conflictingClaims": number,
    "missingInformation": number,
    "totalGraphTasks": number,
    "totalDependencyEdges": number,
    "isAcyclic": boolean,
    "prerequisitesVisible": boolean
  },
  "claims": [
    {
      "fieldName": string,
      "value": string,
      "originalText": string,
      "status": "confirmed_from_source" | "inferred_needs_review" | "conflicting" | "missing",
      "confidence": number,
      "sourceExcerpt": string,
      "sourcePage": number,
      "requiresReview": boolean,
      "requiresTimezoneReview": boolean
    }
  ],
  "tasks": [
    {
      "title": string,
      "description": string,
      "category": "Eligibility" | "Conflicts" | "Foundation" | "Proposal" | "Build" | "Presentation" | "Submission",
      "priority": "high" | "medium" | "low",
      "estimatedMinutes": number,
      "dependencyTitles": [string],
      "evidenceRequired": boolean,
      "evidenceType": "image" | "pdf" | "text" | "url" | "user_declaration",
      "completionCondition": string
    }
  ]
}

RULES:
1. Every confirmed claim MUST contain an exact short sourceExcerpt from the source text.
2. If deadline timezone is not explicitly mentioned, set requiresTimezoneReview: true and status: "inferred_needs_review".
3. Return pure JSON only.`;

    const contents: any[] = [];
    if (options.sourceType === "text" && options.textContent) {
      contents.push({
        role: "user",
        parts: [
          { text: `${systemPrompt}\n\nDocument text:\n${options.textContent}` },
        ],
      });
    } else if (options.buffer && options.mimeType) {
      contents.push({
        role: "user",
        parts: [
          { text: systemPrompt },
          {
            inlineData: {
              mimeType: options.mimeType,
              data: options.buffer.toString("base64"),
            },
          },
        ],
      });
    } else {
      throw new Error("Invalid source intake: content missing");
    }

    const candidateModels = [
      model,
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
    ];
    let lastError: Error | null = null;
    let candidateText: string | null = null;
    let successfulModel = model;
    let validationResult: {
      success: boolean;
      data?: ExtractionResponse;
      error?: any;
    } = { success: false };

    for (let attempt = 0; attempt < candidateModels.length; attempt++) {
      const activeModel = candidateModels[attempt];
      const attemptUrl = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(attemptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096,
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = new Error(
            `Gemini API error (HTTP ${response.status} for ${activeModel}): ${errText}`,
          );

          if (response.status === 429 && attempt < candidateModels.length - 1) {
            console.warn(
              `[ActionLayer] 429 Rate Limit Hit. Waiting 15 seconds before retry ${attempt + 1}...`,
            );
            await new Promise((r) => setTimeout(r, 15000));
            continue;
          }
          break; // Break if not rate limited
        }

        const responseJson: any = await response.json();
        candidateText =
          responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (candidateText) {
          let cleanJson = candidateText.trim();
          if (cleanJson.startsWith("```json")) cleanJson = cleanJson.slice(7);
          else if (cleanJson.startsWith("```")) cleanJson = cleanJson.slice(3);
          if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);
          cleanJson = cleanJson.trim();

          const parsed = JSON.parse(cleanJson);
          const parseCheck = ExtractionResponseSchema.safeParse(parsed);

          if (parseCheck.success) {
            // Validate DAG dependencies exist
            const allTaskTitles = new Set(
              parseCheck.data.tasks.map((t) => t.title),
            );
            let hasInvalidDependency = false;
            let invalidDepName = "";

            for (const task of parseCheck.data.tasks) {
              for (const dep of task.dependencyTitles) {
                if (!allTaskTitles.has(dep)) {
                  hasInvalidDependency = true;
                  invalidDepName = dep;
                  break;
                }
              }
              if (hasInvalidDependency) break;
            }

            if (hasInvalidDependency) {
              console.warn(
                `[ActionLayer] Gemini generated invalid dependency: ${invalidDepName}. Forcing retry.`,
              );
              throw new Error(
                `Invalid dependency generated: ${invalidDepName} does not match any generated task title.`,
              );
            }

            validationResult = { success: true, data: parseCheck.data };
            successfulModel = activeModel;
            break; // Success, exit loop
          } else {
            console.warn(
              "[ActionLayer] Gemini schema parse warning:",
              parseCheck.error.message,
            );
            throw new Error(
              `Schema validation failed: ${parseCheck.error.message}`,
            );
          }
        }
      } catch (err: any) {
        lastError = err;
        // Retry logic for schema failures
        if (attempt < candidateModels.length - 1) {
          console.warn(
            `[ActionLayer] Attempt ${attempt + 1} failed with error: ${err.message}. Retrying immediately with next model...`,
          );
          continue;
        }
        break; // Max attempts reached
      }
    }

    if (validationResult.success && validationResult.data) {
      // Invariant check: confirmed claims must have excerpts
      for (const claim of validationResult.data.claims) {
        if (claim.status === "confirmed_from_source" && !claim.sourceExcerpt) {
          claim.status = "inferred_needs_review";
          claim.requiresReview = true;
        }
      }

      return {
        result: validationResult.data,
        provider: "gemini",
        modelVersion: successfulModel,
        processingDurationMs: Date.now() - startTime,
        requestId,
      };
    }

    throw (
      lastError || new Error("Failed to extract information from AI provider.")
    );
  }

  /**
   * Evidence Evaluation (Level 3: AI-Assisted Assessment)
   */
  public static async evaluateEvidence(options: {
    taskTitle: string;
    requirement: string;
    evidenceType: string;
    evidenceText?: string | null;
    userExplanation?: string;
    fileBuffer?: Buffer;
    mimeType?: string;
  }): Promise<{
    result: VerificationResult;
    provider: string;
    modelVersion: string;
    processingDurationMs: number;
    requestId: string;
  }> {
    const startTime = Date.now();
    const requestId = `verify-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (this.isMockProvider()) {
      return {
        result: {
          status: "partially_verified",
          verificationLevel: 2,
          method: "Evidence attachment",
          requirementsMet: [
            "Evidence submission was recorded and parsed",
            "User explanation is attached",
          ],
          requirementsMissing: [
            "Rule-based automated validation criteria have not yet run",
          ],
          confidence: 0.88,
          limitations: [
            "This assessment was performed against local rules. It does not constitute official third-party certification.",
          ],
          recommendedCorrection:
            "Provide a direct repository link or public preview URL to reach Level 3.",
          nextAction:
            "Review any prerequisites or proceed to the next ready task.",
        },
        provider: "mock",
        modelVersion: "deterministic-mock-v1",
        processingDurationMs: Date.now() - startTime,
        requestId,
      };
    }

    const apiKey = this.getApiKey()!;
    const model = this.getModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `You are evaluating student opportunity evidence.
Task: "${options.taskTitle}"
Requirement: "${options.requirement}"
Evidence Type: "${options.evidenceType}"
Evidence Content: "${options.evidenceText}"
User Explanation: "${options.userExplanation}"

Evaluate whether the evidence satisfies the stated requirement.
Output strictly JSON matching:
{
  "status": "verified" | "partially_verified" | "needs_correction",
  "verificationLevel": 4,
  "method": "AI-assisted assessment",
  "requirementsMet": [string],
  "requirementsMissing": [string],
  "confidence": number (0 to 1),
  "limitations": [string],
  "recommendedCorrection": string or null,
  "nextAction": string
}`;

    const contents: any[] = [];
    if (options.fileBuffer && options.mimeType) {
      contents.push({
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: options.mimeType,
              data: options.fileBuffer.toString("base64"),
            },
          },
        ],
      });
    } else {
      contents.push({ role: "user", parts: [{ text: prompt }] });
    }

    const candidateModels = [
      model,
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
    ];
    let lastError: Error | null = null;
    let candidateText: string | null = null;
    let successfulModel = model;

    for (let attempt = 0; attempt < candidateModels.length; attempt++) {
      const activeModel = candidateModels[attempt];
      const attemptUrl = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(attemptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = new Error(
            `Gemini API error (HTTP ${response.status} for ${activeModel}): ${errText}`,
          );

          if (response.status === 429 && attempt < candidateModels.length - 1) {
            console.warn(
              `[ActionLayer Evidence] 429 Rate Limit Hit. Waiting 15 seconds before retry ${attempt + 1}...`,
            );
            await new Promise((r) => setTimeout(r, 15000));
            continue;
          }
          break;
        }

        const jsonResponse: any = await response.json();
        candidateText =
          jsonResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          successfulModel = activeModel;
          break;
        }
      } catch (err: any) {
        lastError = err;
        if (attempt < candidateModels.length - 1) {
          await new Promise((r) => setTimeout(r, 15000));
          continue;
        }
        break;
      }
    }

    if (candidateText) {
      let clean = candidateText.trim();
      if (clean.startsWith("```json")) clean = clean.slice(7);
      if (clean.startsWith("```")) clean = clean.slice(3);
      if (clean.endsWith("```")) clean = clean.slice(0, -3);
      clean = clean.trim();

      try {
        const parsed = JSON.parse(clean);
        const validated = VerificationResultSchema.safeParse(parsed);
        if (validated.success) {
          return {
            result: validated.data,
            provider: "gemini",
            modelVersion: successfulModel,
            processingDurationMs: Date.now() - startTime,
            requestId,
          };
        } else {
          throw new Error("Failed to validate verification result schema");
        }
      } catch (e: any) {
        throw new Error("Failed to parse verification result: " + e.message);
      }
    } else {
      throw new Error(
        "Failed to evaluate evidence from AI provider: " +
          (lastError?.message || "No text returned"),
      );
    }
  }
}
