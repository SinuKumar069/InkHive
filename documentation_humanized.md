---
title: "InkHive — Documentation"
description: "Professional, human-centered documentation for InkHive: an AI-powered content marketing pipeline built with Next.js, Convex, and Inngest."
slug: "/docs/inkhive"
---

<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/docs">Docs</a></li>
    <li>InkHive</li>
  </ol>
</nav>

# InkHive — Documentation

## Table of contents
- [Purpose & problem solved](#purpose--problem-solved)
- [Executive overview](#executive-overview)
- [System architecture](#system-architecture)
- [Workflows & agents](#workflows--agents)
- [Data model examples (Convex)](#data-model-examples-convex)
- [API reference (key endpoints)](#api-reference-key-endpoints)
- [AI prompts & generation guidance](#ai-prompts--generation-guidance)
- [Security & deployment checklist](#security--deployment-checklist)
- [Observability & runbook](#observability--runbook)
- [Contributing & code map](#contributing--code-map)
- [Related links](#related-links)

[Edit on GitHub](https://github.com/Abhiraj35/ai-content-marketing/edit/main/documentation.md){: .edit-link }

---

## Purpose & problem solved

InkHive helps teams and creators convert a single idea into consistent, high-quality content across channels: a publish-ready blog post, social copy, an email newsletter, and SEO metadata. It reduces repetitive drafting work, makes multi-channel consistency easy, and provides auditable, retryable publishing.

Who benefits:
- Marketing teams who need repeatable, on-brand output.
- Small teams and solo creators who need speed without sacrificing quality.
- Agencies producing many variations from a single brief.

---

## Executive overview

InkHive combines a lightweight frontend, a realtime store for project state, and a durable orchestration layer for AI generation and publishing. The UI is responsible for capturing user intent and displaying progress. Convex stores project state, generated artifacts, and job statuses. Inngest runs the long-lived, retriable workflows that call AI services and publishing adapters.

This separation keeps the UI responsive and simple while moving heavy, uncertain work (AI generation, networked publishing) to a platform built for durability and observability.

---

## System architecture

Components:
- Frontend: Next.js (app router) + React. Clerk handles auth. UI uses shadcn components and Tailwind for styling.
- Realtime store: Convex. Stores `contentProjects` with job-level state and generated artifacts.
- Orchestration: Inngest. Runs `contentPipeline` and `publishContent` workflows with fine-grained retry/parallelism.
- AI provider: Google Generative AI (wrapped in steps under `inngest/steps/ai-generation`).
- Integrations: Resend for email; platform adapters under `lib/publish/` for social networks.

Key design choices:
- Convex for real-time updates and simple transactional mutations.
- Inngest for durable, observable orchestration and parallel step execution.

Sequence (brief): UI -> Convex (create project) -> Inngest event -> AI steps -> Convex (save outputs) -> UI subscribes and shows results -> Publish via Inngest -> Platform APIs.

---

## Workflows & agents

InkHive models generation as a multi-agent pipeline. Each agent has a focused responsibility and clear inputs/outputs.

1. contentPipeline (generate)
   - Trigger: `content/generate` (contains projectId, inputType, inputContent)
   - Steps:
     - Set project status to `generating`.
     - Generate blog post (first, because other agents depend on it).
     - In parallel: generate social posts, email draft, SEO metadata.
     - Persist each result to Convex and update per-job status.
     - On completion, set project status to `completed`.
   - Failure model: step-level retries; errors are recorded in Convex with details for diagnosis.

2. publishContent (publish)
   - Trigger: `content/publish` (projectId, platforms, userEmail)
   - Fetch project snapshot from Convex.
   - For each platform, call the corresponding publisher in parallel.
   - Record per-platform success/failure; continue publishing other platforms if one fails.
   - Return consolidated results.

Operational notes:
- Use `projectId` as a secure reference; Inngest jobs do not require a user token.
- Track `jobStatus` for user-facing progress UI.

---

## Data model examples (Convex)

Primary table: `contentProjects`.

Example (trimmed):

```json
{
  "_id": "proj_abc123",
  "userId": "user_xyz",
  "inputType": "topic",
  "inputContent": "How AI improves conversion",
  "status": "completed",
  "jobStatus": { "blogPost":"completed", "socialPosts":"completed" },
  "blogPost": { "title":"How AI Improves Conversion","content":"#...","excerpt":"...", "readingTime":6 },
  "createdAt": 1680000000000
}
```

Indexes: by_user, by_status, by_created_at. Keep high-churn data out of dense documents.

---

## API reference (key endpoints)

POST /api/trigger-inngest
- Purpose: trigger generation for an existing project.
- Body: { projectId, inputType, inputContent }
- Success: { success: true, projectId }

POST /api/upload
- Purpose: accept an image and return an accessible URL.
- Current implementation: returns a data URL placeholder. Replace with a signed upload to a storage provider for production.

Convex public functions called by the frontend (examples):
- `createProject` (mutation) — create a project (auth required)
- `getUserProjects` (query) — list projects (auth required)
- `getProject` (query) — fetch single project (auth required)
- `updateBlogPost`, `updateSocialPost`, `updateEmailNewsletter` — user edits (mutations)

Request/response examples are typed in `convex/_generated` and are available to the TypeScript client.

---

## AI prompts & generation guidance

High-level guidance for prompts:
- Be explicit about audience, tone, format, and length.
- Ask for structured output (JSON or clearly delimited sections) to simplify parsing.
- Include examples and constraints (e.g., title length, Twitter character limit).
- Version prompts in source files and keep a changelog comment.

Example brief prompts (conceptual):

- Blog: "Write a 900–1,200 word B2B blog post in Markdown for SaaS marketers. Include title, H2/H3 headings, conclusion, and suggest 150-char excerpt. Output as JSON: {title, content, excerpt, readingTime}."

- Social: "From the blog title and excerpt, create platform-specific posts for X (<=280 chars), LinkedIn (<=600 chars), and Instagram (caption + hashtag suggestions). Return a JSON object keyed by platform."

- SEO: "Return a slug, meta title (<=60 chars), meta description (150–160 chars), and 5 keywords as an array."

Safety and cost:
- Limit token usage per step. Log token counts for cost tracking.
- Add moderation safeguards before publishing to public channels.

---

## Security & deployment checklist

Minimum secrets and environment variables:
- NEXT_PUBLIC_CONVEX_URL
- CLERK_JWT_ISSUER_DOMAIN
- GOOGLE_API_KEY (or equivalent)
- RESEND_API_KEY
- SOCIAL platform tokens/keys
- INNGEST_API_KEY (if using hosted service)

Deployment checklist:
1. Lock down Convex access and set public URL in secrets.
2. Provision Inngest and add API keys.
3. Provision storage for uploads and replace the `/api/upload` placeholder.
4. Store social platform credentials securely and test each publisher.
5. Configure monitoring and alerts for Inngest failures.

Operational tips:
- Rotate credentials periodically.
- Redact PII from logs before sending to external systems.

---

## Observability & runbook

Logging & metrics:
- Inngest provides step-level visibility. Export logs to your chosen backend.
- Record structured error objects in Convex (`recordError`) for post-mortem analysis.

Quick runbook (high-level):
1. If many pipelines are failing, inspect Inngest dashboard for failing steps.
2. Query Convex for projects where `status === 'failed'` and check `error`.
3. Re-run generation for a specific `projectId` after resolving transient issues.
4. For publishing failures, check per-platform error fields in the project document and rotate credentials if auth errors persist.

---

## Contributing & code map

Primary folders:
- `app/` — Next.js UI and routes
- `components/` — shared UI components
- `convex/` — schema and server functions
- `inngest/` — client, functions, and AI steps
- `lib/publish/` — publishers for each platform
- `public/` — static assets and diagrams

How to add a new AI step:
1. Create a new step in `inngest/steps/ai-generation` with clear prompt text and parsing logic.
2. Wire it into `contentPipeline` using `step.run` and update Convex with a save mutation.
3. Add unit tests for parsing and a Convex test for persistence.
4. Document the prompt and expected output in this docs file and include a small changelog comment.

---

## Related links

- Convex docs: https://convex.dev/docs
- Inngest docs: https://www.inngest.com/docs
- Google Generative AI: https://developers.google.com/generative-ai
- Clerk docs: https://docs.clerk.com
- Resend docs: https://resend.com/docs

---

If you'd like, next steps I can take:
- Replace the original `documentation.md` with this humanized version.
- Insert the exact prompt text from `inngest/steps/ai-generation` and add prompt version history.
- Add a simple SVG architecture diagram to `public/` and embed it here.
