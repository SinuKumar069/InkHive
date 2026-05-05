/**
 * Agent 1: Blog Post Generator
 *
 * Generates comprehensive long-form blog posts from topics or articles
 * - 1000+ words
 * - Professional structure with headers
 * - SEO-optimized
 * - Reading time calculation
 */
import type { step as InngestStep } from "inngest";
import { z } from "zod";
import { getAIProvider, calculateReadingTime } from "../../lib/ai-client";
import type { ResearchPack } from "../../lib/research-provider";

// Zod schema for structured output
const blogPostSchema = z.object({
  title: z
    .string()
    .describe("SEO-optimized title, engaging and under 60 characters"),
  content: z
    .string()
    .describe(
      "Full markdown content with H2 headers, 1000+ words, comprehensive and engaging",
    ),
  excerpt: z
    .string()
    .describe("150 character summary that entices readers to click"),
});

const BlogPostResponseSchema = z.object({
  blogPost: blogPostSchema,
});

// System prompt establishes GPT's expertise
const BLOG_SYSTEM_PROMPT = `You are an expert content writer specializing in long-form blog posts. 
You create engaging, informative, and SEO-optimized content that resonates with readers.

Writing Guidelines:
- Hook readers in the first paragraph
- Use clear H2 headers for structure
- Include actionable insights and examples
- End with a compelling conclusion and CTA
- Write in a professional yet accessible tone
- Aim for 1000-1500 words
- Do not use emojis anywhere in the response`;

/**
 * Builds prompt for blog post generation
 */
function buildBlogPostPrompt(
  inputType: "topic" | "article",
  inputContent: string,
  research?: ResearchPack,
): string {
  const researchSection = research
    ? `\nREALTIME RESEARCH CONTEXT:\nKey Findings:\n${research.keyFindings.map((v) => `- ${v}`).join("\n")}\n\nTrending Angles:\n${research.trendingAngles.map((v) => `- ${v}`).join("\n")}\n\nSources:\n${research.sources.map((v) => `- ${v.title} (${v.domain}): ${v.url}`).join("\n")}\n`
    : "";

  if (inputType === "topic") {
    return `Write a comprehensive blog post about: "${inputContent}"${researchSection}

Requirements:
- 1000-1500 words
- Engaging introduction that hooks readers
- 3-5 main sections with descriptive H2 headers
- Actionable insights and practical examples
- Professional conclusion with clear CTA
- SEO-optimized throughout
- Do not use emojis

Return as JSON with this structure:
{
  "blogPost": {
    "title": "SEO-optimized title under 60 chars",
    "content": "Full markdown content with headers",
    "excerpt": "150 char engaging summary"
  }
}`;
  } else {
    return `Repurpose this article into a fresh, comprehensive blog post:

ORIGINAL ARTICLE:
${inputContent}

Requirements:
- Rewrite and expand to 1000-1500 words
- Add new insights and perspectives
- Use engaging headers and structure
- Make it unique and valuable
- Include actionable takeaways
- Do not use emojis

Return as JSON with this structure:
{
  "blogPost": {
    "title": "SEO-optimized title under 60 chars",
    "content": "Full markdown content with headers",
    "excerpt": "150 char engaging summary"
  }
}`;
  }
}

/**
 * Generates blog post using the configured AI provider
 */
export async function generateBlogPost(
  _step: typeof InngestStep,
  inputType: "topic" | "article",
  inputContent: string,
  research?: ResearchPack,
): Promise<{
  title: string;
  content: string;
  excerpt: string;
  readingTime: number;
}> {
  console.log("[BLOG-POST] Starting blog post generation...");
  console.log("[BLOG-POST] Input type:", inputType);
  console.log("[BLOG-POST] Input content preview:", inputContent.substring(0, 100));

  try {
    const ai = getAIProvider();
    console.log("[BLOG-POST] Calling AI provider...");
    const response = await ai.generateContent(
      BLOG_SYSTEM_PROMPT,
      buildBlogPostPrompt(inputType, inputContent, research),
    );

    console.log("[BLOG-POST] Raw response:", response.substring(0, 200));

    let parsed;
    try {
      parsed = JSON.parse(response);
      console.log("[BLOG-POST] Parsed JSON successfully");
    } catch (parseError) {
      console.error("[BLOG-POST] JSON parse error:", parseError);
      console.error("[BLOG-POST] Raw response:", response);
      throw new Error(`Failed to parse AI response as JSON: ${response.substring(0, 200)}`);
    }

    console.log("[BLOG-POST] Validating with Zod schema...");
    let validated;
    try {
      validated = BlogPostResponseSchema.parse(parsed);
      console.log("[BLOG-POST] Zod validation passed");
    } catch (validationError) {
      console.error("[BLOG-POST] Zod validation error:", validationError);
      console.error("[BLOG-POST] Parsed data:", JSON.stringify(parsed, null, 2));
      throw validationError;
    }

    // Calculate reading time
    const readingTime = calculateReadingTime(validated.blogPost.content);
    console.log("[BLOG-POST] Calculated reading time:", readingTime, "minutes");

    console.log("[BLOG-POST] Blog post generated successfully!");
    console.log("[BLOG-POST] Title:", validated.blogPost.title);

    return {
      title: validated.blogPost.title,
      content: validated.blogPost.content,
      excerpt: validated.blogPost.excerpt,
      readingTime,
    };
  } catch (error) {
    console.error("[BLOG-POST] Generation error:", error);
    throw error;
  }
}
