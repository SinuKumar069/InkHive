/**
 * Inngest Client Configuration
 *
 * Inngest is a durable execution engine for background jobs and workflows.
 * It provides:
 * - Durable execution: Steps are retried on failure
 * - Parallel execution: Run multiple steps simultaneously
 * - Observability: Built-in logging and metrics
 * - Type safety: Full TypeScript support
 * 
 * NOTE: We don't use step.ai.wrap() because it requires additional Inngest AI middleware.
 * Instead, we wrap AI calls in step.run() for observability.
 */
import { Inngest } from "inngest";

// Initialize Inngest client
export const inngest = new Inngest({
  id: "ai-content-marketing-pipeline",
});

// Event types
export type ContentPipelineEvent = {
  name: "content/generate";
  data: {
    projectId: string;
    inputType: "topic" | "article";
    inputContent: string;
    generationMode?: "grounded" | "classic";
    researchEnabled?: boolean;
  };
};

export type ContentCancelEvent = {
  name: "content/cancel";
  data: {
    projectId: string;
  };
};

export type PublishContentEvent = {
  name: "content/publish";
  data: {
    projectId: string;
    platforms: string[];
    userId: string;
    userEmail?: string;
  };
};
