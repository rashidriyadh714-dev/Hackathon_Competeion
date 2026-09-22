# Competition submission package

## One-line pitch

ActionLayer turns messy opportunity information into a source-grounded requirement graph with a next action, evidence policy, and honest readiness signal.

## Problem

People miss competitions, grants, assignments, and applications because information arrives as posters, PDFs, links, and messages. Even after finding an opportunity, the requirements are scattered, dependencies are hidden, and “done” is often confused with “proven.”

## Solution

ActionLayer captures a source, extracts inspectable claims, asks the user to review uncertain values, creates a persistent Competition Agent, and guides progress through dependent tasks. Every task can carry evidence and a verification record with limitations. A readiness audit shows what is ready, missing, blocked, or uncertain.

## Differentiation

- Not a chatbot home screen: the product is an action system.
- Not a generic checklist: dependencies and completion conditions are explicit.
- Not an opaque AI summary: claims keep excerpts, confidence, and review state.
- Not a binary “complete”: evidence and verification are separate.
- Works offline in the demo and has an API/database contract for sync.

## Current scope

The Competition Agent is complete enough for the demo path. Assignment and Application Agents share the data model but are intentionally postponed until the Competition Agent workflow is stable.

## Honest limitations

- Demo extraction is deterministic and fictional.
- Production object storage scanning and retention policy still need deployment configuration.
- The API currently includes a local demo identity; server-side Clerk session enforcement is required for production.
- Automated unit and end-to-end test suites are the next hardening step.

## Judging checklist

- [x] Mobile navigation and responsive states
- [x] Capture/review/action flow
- [x] Requirement graph and dependencies
- [x] Evidence and verification semantics
- [x] Readiness audit and activity history
- [x] Offline-tolerant demo mode
- [x] PostgreSQL schema and API routes
- [x] Open-source documentation and license
- [ ] Production security scan results attached
- [ ] Production deployment with authenticated object storage