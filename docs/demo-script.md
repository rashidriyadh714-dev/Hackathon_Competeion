# ActionLayer Demonstration Script

> **Guide for Shipaton 2026 Video Recording & Live Judging**  
> Focus: 14-Step Complete Vertical Slice from Source Intake to Four-Factor Audit

---

## Prerequisites for Recording

1. **Local Setup Running:**
   - Docker PostgreSQL: `pnpm run db:up`
   - Express Backend: `pnpm run start:api` (Port 5001)
   - Expo Mobile PWA: `pnpm run start:mobile` (Port 8081)
2. **Device Frame:** Run in Chrome/Safari with Mobile Device Toolbar active (iPhone 15 Pro, 393 x 852).
3. **Data State:** Default seed data loaded (`pnpm run seed`).

---

## 14-Step Critical Demonstration Journey (2 to 3 Minutes)

### Step 1: Capture & Intake
- Open the application at `http://localhost:8081`.
- Tap the **Capture** tab from the bottom navigation bar.
- Point out the **"Explore Fictional Competition Demo"** card (Northstar Build Challenge 2026).
- Mention that ActionLayer also supports real camera/screenshot, gallery image, PDF, and pasted text intake.

### Step 2: Gemini Privacy Disclosure
- Tap **"Explore Fictional Competition Demo"** (or tap **"Gallery Image"**).
- Show the mandatory **AI Processing Disclosure**:
  > *"ActionLayer will send this source to Google Gemini for analysis. Do not upload identity documents, financial records, medical records, confidential research, private university materials, or company-confidential files."*
- Highlight the **"Enter Manually Instead"** alternative for zero-AI entry.
- Tap **"I Understand & Continue"**.

### Step 3: Structured Extraction & Grounded Claims
- The app transitions to **Extraction Review** (`/review/demo-competition-2026`).
- Point out the preserved source record: `northstar-build-challenge-2026.png`.
- Show that 6 structured claims were extracted with exact source excerpts and confidence percentages:
  - Opportunity Title (98% grounded)
  - Organizer (95% grounded)
  - Submission Deadline (74% grounded, flagged with "Needs review" warning banner)
  - Eligibility (92% grounded)
  - Open Source License (91% grounded)
  - Demo Video Duration (45% confidence, marked "Missing from source")

### Step 4: Correct an Uncertain Claim
- Tap **"Edit"** on the Submission Deadline claim.
- In the bottom sheet, correct the value to confirm the timezone: `"18 October 2026, 11:59 PM MYT"`.
- Tap **"Save & Confirm Correction"**. Show that the status badge updates to **"Supplied by you"**.

### Step 5: Confirm Claims
- Tap **"Confirm"** on any remaining unconfirmed claims.
- Point out that the warning banner turns green: *"All claims confirmed. The agent is ready for activation!"*

### Step 6: Activate Competition Agent
- Tap **"Activate Competition Agent"**.
- Confirm the activation dialog. The agent transitions immediately to the active agent dashboard (`/agent/demo-competition-2026`).

### Step 7: Open the Requirement Graph (DAG)
- Switch from the **Overview** tab to the **Graph (DAG)** tab.
- Show the 7 compiled tasks in logical sequence with categories, estimates, and priority tags:
  1. `Confirm team eligibility` (Completed)
  2. `Choose problem & write architecture concept` (Ready)
  3. `Create public GitHub repo with Apache-2.0` (Blocked)
  4. `Build working local MVP prototype` (Blocked)
  5. `Write README, setup guide & future roadmap` (Blocked)
  6. `Record working local demonstration video` (Blocked)
  7. `Final readiness check & form submission` (Blocked)

### Step 8: Inspect the Blocked Task
- Point to Task 3: *"Create public GitHub repo with Apache-2.0"*.
- Highlight the amber banner: **"Prerequisite required: Choose problem & write architecture concept"**.
- Emphasize that ActionLayer enforces deterministic scheduling in application logic, not LLM guesswork.

### Step 9: Complete the Prerequisite Task
- Find Task 2: *"Choose problem & write architecture concept"*.
- Tap **"Start Task"**, then tap **"Mark Complete (Unblock Next)"**.

### Step 10: Automatic Unblocking
- Observe Task 3 (*"Create public GitHub repo"*) immediately transition from **Blocked** to **Ready**!
- Point out that its action button now reads **"Start Task"**.

### Step 11: Attach Evidence Artifact
- Tap **"Attach Evidence"** on Task 3.
- In the bottom sheet, enter:
  - Artifact Label: `"https://github.com/actionlayer/actionlayer-mvp"`
  - Verification Explanation: `"Repository initialized with Apache-2.0 license, full README, and clean CI test suite."`
  - Verification Method: Select **Level 2: Evidence Attached** (or Level 3 AI-Assisted Assessment).
- Tap **"Submit & Verify Artifact"**.

### Step 12: Inspect Verification Result
- Switch to the **Evidence** tab.
- View the attached artifact with its badge: **"Level 2 · Evidence attachment"**.
- Expand to show verified rubric requirements, confidence score (0.88), and verification scope note:
  > *"Evidence attachment verifies presence, with automated third-party validation planned in future scope."*

### Step 13: Run Four-Factor Readiness Audit
- Return to the **Overview** tab and tap **"Run Four-Factor Readiness Audit"**.
- Point out the 4 separate transparent indicators (never averaged into a meaningless score):
  1. **Requirements Completion:** 28% (weighted completion based on task priorities)
  2. **Evidence Readiness:** 33% (verified artifacts vs required evidence)
  3. **Source Confidence:** High (all source claims confirmed)
  4. **Deadline Risk:** Medium (qualitative evaluation with exact contributing reasons)

### Step 14: Inspect Exact Remaining Missing Items
- Scroll inside the audit modal to show the **Exact Remaining Items**:
  - Incomplete tasks (`"Build working local MVP prototype"`, `"Write README"`, `"Record demo video"`, `"Final submission"`)
  - Missing evidence items listed clearly so the builder knows exactly what remains before deadline.
- Tap **"Close Audit"**.

---

## Key Talking Points for Video

- *"ActionLayer doesn't guess—it grounds every claim in the original poster."*
- *"Task prerequisites are solved deterministically by a DAG solver."*
- *"Completing a prerequisite automatically unlocks the next step."*
- *"Evidence levels distinguish user self-declarations from AI rubric assessments."*
- *"The four-factor audit gives builders complete transparency before submitting."*