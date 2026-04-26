---
title: "InkHive — Documentation"
description: "Comprehensive developer and design documentation for InkHive: an AI-powered content marketing pipeline built with Next.js, Convex, and Inngest."
slug: "/docs/inkhive"
---

# InkHive — Documentation

## Table of contents
- [Purpose & problem solved](#purpose--problem-solved)
- [Quick overview (no repo steps)](#quick-overview-no-repo-steps)
- [System design & architecture](#system-design--architecture)
- [Detailed agents & workflows](#detailed-agents--workflows)
- [Data model (Convex) — examples](#data-model-convex---examples)
- [API reference (detailed)](#api-reference-detailed)
- [AI prompts & generation details](#ai-prompts--generation-details)
- [Security & auth model](#security--auth-model)
- [Environment variables & deployment checklist](#environment-variables--deployment-checklist)
- [Testing, observability & runbook](#testing-observability--runbook)
- [Alternatives & comparison tables](#alternatives--comparison-tables)
- [Contributing & code map](#contributing--code-map)
- [Related links](#related-links)

[Edit on GitHub](https://github.com/Abhiraj35/ai-content-marketing/edit/main/documentation.md){: .edit-link }

---

## Purpose & problem solved

InkHive addresses the common marketing problem of scaling high-quality, cross-channel content from a single idea. It automates generation, organizes drafts, and provides a reliable publishing pipeline so teams can:

- Produce a publish-ready blog post, SEO metadata, social posts, and newsletter copy from one seed idea.
- Track progress and edits in a realtime UI.
- Publish reliably with retries and per-platform error reporting.

Who benefits:
- Content marketers needing consistency across channels.
- Agencies producing many variations from limited briefs.
- Startups automating content workflows with auditability.

---

## Quick overview (no repo steps)

This section summarizes how components interact without repo-level onboarding commands.

1. User creates a content project in the UI (topic or article text).
2. The frontend writes a `contentProjects` document into Convex and triggers a durable Inngest workflow `content/generate`.
3. Inngest's `contentPipeline` orchestrates AI generation (blog → social/email/SEO) and writes outputs back to Convex.
4. UI subscribes to Convex and shows per-job progress and generated drafts.
5. When the user requests publish, the frontend triggers `content/publish`, and Inngest runs `publishContent` to publish in parallel to chosen platforms.

---

## System design & architecture

High-level components:
- Frontend: Next.js (app router) — UI, Clerk auth, minimal server routes for uploads and triggering Inngest.
- Realtime data & transactional API: Convex — holds `contentProjects`, job statuses, errors, published history.
- Orchestration: Inngest — durable, observable execution for multi-step AI tasks and parallel publishing.
- AI engine: Google Generative AI — used in Inngest steps to generate natural language artifacts.
- Integrations: Resend (email), and social publishers under `lib/publish/`.

Design rationale:
- Convex for fast real-time UX and simple serverless data model with indexes.
- Inngest for complex background orchestration: retries, step-wise logging, parallelism, and observability.

Sequence diagram (conceptual):
- [UI] -> (Convex.createProject) -> [Convex]
- [UI] -> (POST /api/trigger-inngest) -> [Next API] -> (inngest.send)
- [Inngest] -> (contentPipeline) -> [AI steps] -> (Convex.save*) -> [Convex]
- [UI] subscribe -> [Convex] updates
- [UI] publish -> (POST /api/trigger-inngest publish) -> [Inngest.publishContent] -> [Platforms]

> Note: Replace sequence diagram with an SVG in `public/architecture.svg` for visual docs.

---

## Detailed agents & workflows

This section documents each Inngest function, its triggers, inputs, outputs, and failure semantics.

### contentPipeline (inngest/functions/content-pipeline.ts)
- Trigger: event `content/generate`
- Configuration: retries = 3, optimizeParallelism = true
- Responsibilities:
  - Mark `contentProjects.status = "generating"`
  - Run `generateBlogPost` (must complete first because downstream agents consume the blog output)
  - In parallel run `generateSocialPosts`, `generateEmailNewsletter`, `generateSeoMetadata`
  - On completion, set `status = "completed"`
  - On any error, call `api.contentProjects.recordError` with step and stack trace

Inputs (event.data):
- projectId: string
- inputType: "topic" | "article"
- inputContent: string

Primary outputs (Convex mutations called):
- updateProjectStatus(projectId, status)
- saveBlogPost(projectId, title, content, excerpt, readingTime)
- saveSocialPosts(projectId, twitter, linkedin, facebook, instagram, medium)
- saveEmailNewsletter(projectId, subjectLines..., htmlContent, plainText)
- saveSeoMetadata(projectId, title, description, keywords, slug)

Failure handling:
- Each step wrapped in `step.run` with automatic retry semantics.
- If the blog generation fails, pipeline records error and stops dependent step execution.
- Parallel step failures are recorded per-job; pipeline still tries to complete other jobs.

### publishContent (inngest/functions/publish-content.ts)
- Trigger: event `content/publish`
- Responsibilities:
  - Fetch project snapshot from Convex (getProjectById)
  - For each requested platform run publisher (parallel)
  - Update per-platform publish status via `updatePublishStatus`
  - Return consolidated results and record per-platform errors

Failure handling:
- Retries configured at function level
- `onFailure` logs exhausted retries for observability
- Publishing continues for other platforms if one platform fails

---

## Data model (Convex) — examples

Table: contentProjects (see `convex/schema.ts`)

Example document (abridged):

```json
{
  "_id": "proj_abc123",
  "userId": "user_xyz",
  "inputType": "topic",
  "inputContent": "How AI improves conversion",
  "status": "completed",
  "jobStatus": {
    "blogPost": "completed",
    "socialPosts": "completed",
    "emailNewsletter": "completed",
    "seoMetadata": "completed"
  },
  "blogPost": {
    "title": "How AI Improves Conversion",
    "content": "# Intro\n...markdown content...",
    "excerpt": "AI boosts conversion by...",
    "readingTime": 6,
    "isEdited": false
  },
  "socialPosts": {
    "twitter": { "text": "AI can boost conversion...", "status": "draft" },
    // ...
  },
  "createdAt": 1680000000000,
  "updatedAt": 1680000100000
}
```

Indexes used:
- by_user (userId)
- by_status (status)
- by_created_at (createdAt)

Guidelines:
- Use indexes for queries in Convex; avoid filter() usage.
- Keep large collections as separate tables (no unbounded arrays inside documents).

---

## API reference (detailed)

This section lists public HTTP endpoints and the Convex API surface used by the frontend.

### POST /api/trigger-inngest
Trigger generation for a project.

Request body

```json
{
  "projectId": "proj_abc123",
  "inputType": "topic",
  "inputContent": "Single idea to expand"
}
```

Successful response

```json
{
  "success": true,
  "projectId": "proj_abc123"
}
```

Error response (example)

```json
{
  "error": "Failed to trigger content generation"
}
```

Internal Convex functions (examples of usage from frontend):
- api.contentProjects.createProject (mutation) — creates a new content project (auth required)
- api.contentProjects.getUserProjects (query) — list projects for current user
- api.contentProjects.getProject (query) — get single project (auth required)
- api.contentProjects.updateBlogPost / updateSocialPost / updateEmailNewsletter (mutations) — user edits

Request/response patterns for Convex calls are typed in `convex/_generated` and executed via Convex client.

### POST /api/upload
- Accepts: multipart/form-data `file`
- Returns: { url: string }
- Implementation note: currently returns data URL placeholder; replace with signed URL uploads to stable storage (Vercel Blob, S3, etc.)

---

## AI prompts & generation details

This section documents the high-level prompt engineering and expected outputs for each agent. Keep prompts in `inngest/steps/ai-generation/*` and version them when updated.

General guidance:
- Use deterministic system prompt elements for style (tone, length, audience).
- Request structured output (markdown for blog, JSON for metadata) to simplify parsing.
- Include examples in the prompt to reduce hallucinations.

Example blog-generation prompt (conceptual):

```text
System: You are a professional marketing copywriter. Produce a long-form blog post in Markdown with title, subheadings, and conclusion. Target audience: B2B SaaS marketers. Tone: authoritative but friendly.

User: Topic: "How AI improves conversion"

Output: JSON with keys: title, content(markdown), excerpt(<=150 chars), readingTime (minutes)
```

Example social-post prompt (derived from blog):

```text
Create platform-specific short posts for Twitter (X), LinkedIn, and Instagram captions using the blog title and excerpt. Limit Twitter to 280 characters, LinkedIn to 600, Instagram caption to 2200. Provide optional image prompt.
```

SEO metadata prompt (structured JSON):

```text
Return a slug (URL-friendly), meta title <= 60 chars, meta description 150-160 chars, and 5 keywords as array.
```

Prompt versioning:
- Keep prompt text in source files and add a comment with a short changelog when altering behavior.

Cost & safety:
- Log token usage per step (optional) and set sensible max tokens for long-form content.
- Add moderation checks if exposing content to public channels.

---

## Security & auth model

Auth providers:
- Clerk (frontend) — issues JWTs used by Convex auth.config.ts for server-side identity.

Convex security patterns:
- UI-facing mutations must derive identity server-side using `ctx.auth.getUserIdentity()`.
- Avoid accepting userId arguments for authorization — always use server-derived identity.
- Inngest jobs call Convex queries/mutations without a user token; the security model relies on unguessable `projectId` and server-side validation where necessary.

Sensitive data handling:
- Never store API keys or secrets in the repo. Use environment variables or secret manager.
- When publishing to third-party platforms, encrypt keys in your deployment platform and rotate regularly.

Operational security:
- Log errors and redact PII before sending logs to external systems.

---

## Environment variables & deployment checklist

Minimum environment variables (example):

- NEXT_PUBLIC_CONVEX_URL — Convex deployment URL
- CLERK_JWT_ISSUER_DOMAIN — Clerk OIDC issuer domain
- GOOGLE_API_KEY (or equivalent) — Generative AI credentials
- RESEND_API_KEY — email sending
- SOCIAL_TWITTER_TOKEN, SOCIAL_LINKEDIN_TOKEN, SOCIAL_FACEBOOK_TOKEN, etc.
- INNGEST_API_KEY (if using hosted Inngest)

Deployment checklist:
1. Configure Convex deployment and set NEXT_PUBLIC_CONVEX_URL.
2. Provision Inngest (hosted or self-host) and set API keys.
3. Add platform credentials (Twitter, LinkedIn, Resend) in deployment secrets.
4. Add monitoring & alerting for Inngest failures and Convex function errors.

---

## Testing, observability & runbook

Testing:
- Add Convex unit tests using convex-test + vitest for core mutations and queries.
- Add integration tests for Inngest functions by mocking Convex responses (or spinning a test Convex instance).

Logs & monitoring:
- Inngest step logs give step-level visibility. Aggregate with a logging backend (Datadog, Logflare).
- Record job-level errors in Convex via `recordError` for historic analysis.

Runbook (high-level):
1. If pipeline fails for many projects, check Inngest dashboard for failing steps.
2. Query Convex `contentProjects` for documents with `status: failed` and inspect `error` field.
3. For publishing failures, inspect per-platform `error` fields in `contentProjects.socialPosts` and `emailNewsletter`.
4. Rotate credentials if a platform starts returning auth errors.

## Contributing & code map

Primary folders:
- app/ — Next.js app components and pages
- components/ — shared UI
- convex/ — schema.ts and server functions (queries/mutations)
- inngest/ — client.ts, functions/, steps/
- lib/publish/ — platform-specific publishing logic
- public/ — static assets and suggested SVG diagrams

How to add a new AI step:
1. Create an `inngest/steps/ai-generation/<your-step>.ts` with prompt and helper parsing.
2. Wire the step into `contentPipeline` or a new Inngest function.
3. Add Convex mutation to persist results.
4. Add tests and log token usage.

---

## Related links

- Convex docs: https://convex.dev/docs
- Inngest docs: https://www.inngest.com/docs
- Google Generative AI: https://developers.google.com/generative-ai
- Clerk docs: https://docs.clerk.com
- Resend docs: https://resend.com/docs



---

If you want, next actions I can take:
- Insert real prompt text from `inngest/steps/ai-generation` into this file and version them.
- Generate a visual architecture SVG and add it to `public/`.
- Create a detailed runbook (incident playbook) with exact commands and queries for on-call.

