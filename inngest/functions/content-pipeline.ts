/**
 * Content Pipeline Workflow - Main Orchestration Function
 *
 * Multi-Agent Pipeline:
 * Agent 1: Generates blog post from topic/article
 * Agent 2: Creates social media variations
 * Agent 3: Drafts email newsletter
 * Agent 4: Optimizes SEO metadata
 * All published via APIs
 *
 * Workflow Pattern:
 * 1. Update project status to "generating"
 * 2. Run all AI generation agents in parallel
 * 3. Save all results to Convex
 * 4. Update status to "completed"
 *
 * Cancellation:
 * - Uses Inngest cancelOn to listen for "content/cancel" events
 * - Each step checks Convex project status before expensive AI work
 * - Already-completed content is preserved after cancellation
 *
 * Benefits:
 * - Parallel execution: All agents run simultaneously (5x faster)
 * - Durable execution: Automatic retries on failure
 * - Real-time updates: UI shows progress via Convex subscriptions
 * - Cancellable: Users can abort generation to save AI tokens
 */
import { inngest } from "../client";
import { generateBlogPost } from "../steps/ai-generation/blog-post";
import { generateSocialPosts } from "../steps/ai-generation/social-posts";
import { generateEmailNewsletter } from "../steps/ai-generation/email-newsletter";
import { generateSeoMetadata } from "../steps/ai-generation/seo-metadata";
import {
  generateGroundedResearch,
  isQuotaError,
  type ResearchPack,
} from "../lib/research-provider";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

// Initialize Convex client for Inngest functions
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const contentPipeline = inngest.createFunction(
  {
    id: "content-pipeline",
    optimizeParallelism: true,
    retries: 3,
    cancelOn: [
      {
        event: "content/cancel",
        if: "async.data.projectId == event.data.projectId",
      },
    ],
    triggers: [{ event: "content/generate" }],
  },
  async ({ event, step }) => {
    const {
      projectId,
      inputType,
      inputContent,
      generationMode = "grounded",
      researchEnabled = true,
    } = event.data;

    /**
     * Check if the project has been canceled in Convex.
     * Called at the start of each step to avoid expensive AI work
     * after the user clicks cancel.
     */
    const isCanceled = async (): Promise<boolean> => {
      const project = await convex.query(api.contentProjects.getProjectById, {
        projectId,
      });
      return project?.status === "canceled";
    };

  // console.log(`Starting content pipeline for project ${projectId}`);

    try {
      // Step 1: Mark project as generating
      await step.run("update-status-generating", async () => {
        await convex.mutation(api.contentProjects.updateProjectStatus, {
          projectId,
          status: "generating",
        });
        await convex.mutation(api.contentProjects.setGenerationMode, {
          projectId,
          generationMode,
        });
      });

      let research: ResearchPack | undefined;
      const shouldRunResearch = generationMode === "grounded" && researchEnabled;

      if (shouldRunResearch) {
        const researchResult = await step.run("research-and-grounding", async () => {
          // Guard: skip expensive work if already canceled
          if (await isCanceled()) {
            return { ok: false as const, canceled: true as const };
          }

          await convex.mutation(api.contentProjects.updateResearchStatus, {
            projectId,
            status: "running",
          });

          try {
            const pack = await generateGroundedResearch(inputType, inputContent);
            await convex.mutation(api.contentProjects.saveResearch, {
              projectId,
              keyFindings: pack.keyFindings,
              trendingAngles: pack.trendingAngles,
              sources: pack.sources,
            });
            return { ok: true as const, pack };
          } catch (error) {
            if (isQuotaError(error)) {
              await convex.mutation(api.contentProjects.updateResearchStatus, {
                projectId,
                status: "failed",
                errorCode: "DAILY_QUOTA_EXCEEDED",
                errorMessage:
                  "Daily Gemini research quota reached. Retry later or generate without web research.",
              });
          await convex.mutation(api.contentProjects.updateProjectStatus, {
                projectId,
                status: "draft",
              });
              return { ok: false as const, quotaExceeded: true as const };
            }
            throw error;
          }
        });

        // Handle canceled during research
        if (!researchResult.ok && "canceled" in researchResult) {
          return { success: false, projectId, reason: "canceled" };
        }

        if (!researchResult.ok) {
          return {
            success: false,
            projectId,
            requiresFallback: true,
            reason: "DAILY_QUOTA_EXCEEDED",
          };
        }
        research = researchResult.pack;
      } else {
        await step.run("mark-research-skipped", async () => {
          await convex.mutation(api.contentProjects.updateResearchStatus, {
            projectId,
            status: "skipped",
          });
        });
      }

      // Step 2: Agent 1 - Generate Blog Post
      const blogPost = await step.run("generate-blog-post", async () => {
        // Guard: skip expensive AI call if already canceled
        if (await isCanceled()) return null;

        await convex.mutation(api.contentProjects.updateJobStatus, {
          projectId,
          jobName: "blogPost",
          status: "running",
        });

        const result = await generateBlogPost(step, inputType, inputContent, research);

        // Check again before saving — cancel may have arrived mid-generation
        if (await isCanceled()) return null;

        await convex.mutation(api.contentProjects.saveBlogPost, {
          projectId,
          title: result.title,
          content: result.content,
          excerpt: result.excerpt,
          readingTime: result.readingTime,
        });

        await convex.mutation(api.contentProjects.updateJobStatus, {
          projectId,
          jobName: "blogPost",
          status: "completed",
        });

        return result;
      });

      // If blog post was skipped due to cancellation, stop the pipeline
      if (!blogPost) {
        return { success: false, projectId, reason: "canceled" };
      }

      // Step 3: Run remaining agents in parallel
      // Agent 2: Social Posts
      const socialPostsPromise = step.run("generate-social-posts", async () => {
        if (await isCanceled()) return null;

        await convex.mutation(api.contentProjects.updateJobStatus, {
          projectId,
          jobName: "socialPosts",
          status: "running",
        });

        const result = await generateSocialPosts(
          step,
          blogPost.title,
          blogPost.content,
          blogPost.excerpt,
          research,
        );

        if (await isCanceled()) return null;

        await convex.mutation(api.contentProjects.saveSocialPosts, {
          projectId,
          twitter: result.twitter,
          linkedin: result.linkedin,
          facebook: result.facebook,
          instagram: result.instagram,
          medium: result.medium,
        });

        await convex.mutation(api.contentProjects.updateJobStatus, {
          projectId,
          jobName: "socialPosts",
          status: "completed",
        });

        return result;
      });

      // Agent 3: Email Newsletter
      const emailPromise = step.run("generate-email-newsletter", async () => {
        if (await isCanceled()) return null;

        await convex.mutation(api.contentProjects.updateJobStatus, {
          projectId,
          jobName: "emailNewsletter",
          status: "running",
        });

        const result = await generateEmailNewsletter(
          step,
          blogPost.title,
          blogPost.content,
          blogPost.excerpt,
          research,
        );

        if (await isCanceled()) return null;

        await convex.mutation(api.contentProjects.saveEmailNewsletter, {
          projectId,
          subjectLines: result.subjectLines,
          previewText: result.previewText,
          htmlContent: result.htmlContent,
          plainText: result.plainText,
        });

        await convex.mutation(api.contentProjects.updateJobStatus, {
          projectId,
          jobName: "emailNewsletter",
          status: "completed",
        });

        return result;
      });

      // Agent 4: SEO Metadata
      const seoPromise = step.run("generate-seo-metadata", async () => {
        if (await isCanceled()) return null;

        await convex.mutation(api.contentProjects.updateJobStatus, {
          projectId,
          jobName: "seoMetadata",
          status: "running",
        });

        const result = await generateSeoMetadata(
          step,
          blogPost.title,
          blogPost.content,
          blogPost.excerpt,
          research,
        );

        if (await isCanceled()) return null;

        await convex.mutation(api.contentProjects.saveSeoMetadata, {
          projectId,
          title: result.title,
          description: result.description,
          keywords: result.keywords,
          slug: result.slug,
        });

        await convex.mutation(api.contentProjects.updateJobStatus, {
          projectId,
          jobName: "seoMetadata",
          status: "completed",
        });

        return result;
      });

      // Wait for all parallel jobs to complete
      await Promise.allSettled([socialPostsPromise, emailPromise, seoPromise]);

      // Final guard: don't mark completed if canceled while parallel steps ran
      if (await isCanceled()) {
        return { success: false, projectId, reason: "canceled" };
      }

      // Step 4: Mark project as completed
      await step.run("update-status-completed", async () => {
        await convex.mutation(api.contentProjects.updateProjectStatus, {
          projectId,
          status: "completed",
        });
      });

      // console.log(`Content pipeline completed for project ${projectId}`);
      return { success: true, projectId };
    } catch (error) {
      // console.error("Content pipeline failed:", error);

      // Record error in Convex
      try {
        await convex.mutation(api.contentProjects.recordError, {
          projectId,
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
          step: "content-pipeline",
          details: error instanceof Error ? error.stack : String(error),
        });
      } catch (cleanupError) {
        console.error("Failed to record error:", cleanupError);
      }

      throw error;
    }
  },
);
