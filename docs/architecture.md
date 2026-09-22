# Architecture

## Product surfaces

The mobile app is an Expo Router application with five primary tabs:

- Home: next action, readiness, deadline risk, and active agent.
- Agents: persistent workflows and the Competition Agent.
- Capture: source intake and preserved-source review.
- Activity: append-only user-visible history.
- Profile: preferences, offline behavior, demo controls, privacy, and security posture.

Detail routes cover an agent, extraction review, authentication, and not-found handling.

## Domain flow

```text
source
  -> extraction job
  -> claims with excerpt + confidence
  -> user review
  -> workflow / requirement graph
  -> task execution
  -> evidence attachment
  -> verification record
  -> readiness audit + activity event
```

The important boundary is between claims and confirmed requirements. A low-confidence or missing claim remains visible as uncertainty until the user reviews it or supplies the missing value.

## Persistence

The mobile layer uses AsyncStorage for offline-tolerant demo state. The API layer uses PostgreSQL through Drizzle ORM. The database schema separates users, sources, extraction jobs, claims, workflows, tasks, dependencies, evidence, verifications, and audit events.

The current API includes a deterministic demo adapter so a judge can inspect the workflow without an external extraction provider. Production extraction can be added behind the same job and claim boundaries.

## Authentication

When the managed Clerk publishable key is available, the mobile app uses Clerk Expo sign-in and email verification flows. When it is unavailable, the app presents a clearly labeled fictional demo flow. The API scaffold currently uses a demo user identifier for local development; authenticated ownership middleware is required before production release.

## Design principles

- Warm neutral surfaces, charcoal text, cobalt primary actions, restrained teal accents.
- No gradients, glow, robot imagery, or chatbot-first navigation.
- Statuses are explicit and color is paired with text.
- Dynamic text and large touch targets are preferred.
- Every automated result should be explainable through a source excerpt, confidence, or evidence limitation.