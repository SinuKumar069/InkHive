/**
 * Convex Database Schema
 *
 * Defines the structure for AI Content Marketing Pipeline
 * - contentProjects: Stores all generated content with draft/published states
 * - Real-time reactivity for UI updates
 * - Atomic operations for content updates
 */
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  contentProjects: defineTable({
    // User ownership - links to Clerk user ID
    userId: v.string(),

    // Input
    inputType: v.union(v.literal("topic"), v.literal("article")),
    inputContent: v.string(), // The topic text or article content

    // Overall project status
    status: v.union(
      v.literal("draft"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed"),
    ),

    // Granular job status tracking
    jobStatus: v.optional(
      v.object({
        blogPost: v.optional(
          v.union(
            v.literal("pending"),
            v.literal("running"),
            v.literal("completed"),
            v.literal("failed"),
          ),
        ),
        socialPosts: v.optional(
          v.union(
            v.literal("pending"),
            v.literal("running"),
            v.literal("completed"),
            v.literal("failed"),
          ),
        ),
        emailNewsletter: v.optional(
          v.union(
            v.literal("pending"),
            v.literal("running"),
            v.literal("completed"),
            v.literal("failed"),
          ),
        ),
        seoMetadata: v.optional(
          v.union(
            v.literal("pending"),
            v.literal("running"),
            v.literal("completed"),
            v.literal("failed"),
          ),
        ),
      }),
    ),

    // Error tracking
    error: v.optional(
      v.object({
        message: v.string(),
        step: v.string(),
        timestamp: v.number(),
        details: v.optional(v.string()),
      }),
    ),

    // Generated Content
    blogPost: v.optional(
      v.object({
        title: v.string(),
        content: v.string(), // Full markdown content
        excerpt: v.string(), // 150 char summary
        readingTime: v.number(), // Minutes
        isEdited: v.boolean(), // Track if user modified AI output
      }),
    ),

    // Social posts for each platform
    socialPosts: v.optional(
      v.object({
        twitter: v.object({
          text: v.string(),
          imageUrl: v.optional(v.string()),
          status: v.union(v.literal("draft"), v.literal("published")),
          publishedAt: v.optional(v.number()),
          error: v.optional(v.string()),
        }),
        linkedin: v.object({
          text: v.string(),
          imageUrl: v.optional(v.string()),
          status: v.union(v.literal("draft"), v.literal("published")),
          publishedAt: v.optional(v.number()),
          error: v.optional(v.string()),
        }),
        facebook: v.object({
          text: v.string(),
          imageUrl: v.optional(v.string()),
          status: v.union(v.literal("draft"), v.literal("published")),
          publishedAt: v.optional(v.number()),
          error: v.optional(v.string()),
        }),
        instagram: v.object({
          text: v.string(),
          imageUrl: v.optional(v.string()),
          status: v.union(v.literal("draft"), v.literal("published")),
          publishedAt: v.optional(v.number()),
          error: v.optional(v.string()),
        }),
        medium: v.object({
          text: v.string(),
          imageUrl: v.optional(v.string()),
          status: v.union(v.literal("draft"), v.literal("published")),
          publishedAt: v.optional(v.number()),
          error: v.optional(v.string()),
        }),
        isEdited: v.boolean(), // Track if user modified any post
      }),
    ),

    // Email newsletter
    emailNewsletter: v.optional(
      v.object({
        subjectLines: v.array(v.string()),
        previewText: v.string(),
        htmlContent: v.string(),
        plainText: v.string(),
        selectedSubjectLine: v.optional(v.number()), // Index of selected subject
        status: v.union(v.literal("draft"), v.literal("published")),
        publishedAt: v.optional(v.number()),
        isEdited: v.boolean(),
        error: v.optional(v.string()),
      }),
    ),

    // SEO metadata
    seoMetadata: v.optional(
      v.object({
        title: v.string(), // Under 60 chars
        description: v.string(), // 150-160 chars
        keywords: v.array(v.string()),
        slug: v.string(), // URL-friendly
        isEdited: v.boolean(),
      }),
    ),
    publicSlug: v.optional(v.string()),

    // Publishing tracking
    publishedTo: v.optional(v.array(v.string())), // ["twitter", "linkedin", "medium"]
    lastPublishedAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_public_slug", ["publicSlug"])
    .index("by_public_slug_and_status", ["publicSlug", "status"])
    .index("by_created_at", ["createdAt"]),
}); 
