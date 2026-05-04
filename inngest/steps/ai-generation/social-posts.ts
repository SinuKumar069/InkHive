/**
 * Agent 2: Social Media Posts Generator
 *
 * Generates platform-specific social media posts from blog content
 * Platforms: Twitter/X, LinkedIn, Facebook, Instagram
 * Character limits and platform best practices enforced
 */
import type { step as InngestStep } from "inngest";
import { z } from "zod";
import { getAIProvider } from "../../lib/ai-client";
import type { ResearchPack } from "../../lib/research-provider";

// Zod schema for structured output
const socialPostsSchema = z.object({
  twitter: z
    .string()
    .max(280)
    .describe("Twitter post - max 280 chars, punchy and engaging"),
  linkedin: z
    .string()
    .describe(
      "LinkedIn post - 1-2 paragraphs, professional tone, thought leadership",
    ),
  facebook: z
    .string()
    .describe(
      "Facebook post - 2-3 paragraphs, community-focused, conversational",
    ),
  instagram: z
    .string()
    .describe(
      "Instagram caption - engaging storytelling, 2-4 emojis, CTA included",
    ),
});

const SocialPostsResponseSchema = z.object({
  socialPosts: socialPostsSchema,
});

function cleanAndExtractJson(raw: string): string {
  let cleaned = raw.trim();
  const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    cleaned = fencedMatch[1].trim();
  }
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  return (jsonMatch?.[0] ?? cleaned).trim();
}

function trimToWordBoundary(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const hard = value.slice(0, maxLength - 3);
  const soft = hard.replace(/\s+\S*$/, "").trim();
  const head = soft.length >= Math.floor(maxLength * 0.6) ? soft : hard.trim();
  return `${head}...`;
}

// System prompt
const SOCIAL_SYSTEM_PROMPT = `You are a viral social media marketing expert who understands each platform's unique audience, tone, and best practices. 

Platform Guidelines:
- Twitter: Punchy, scroll-stopping, under 280 chars
- LinkedIn: Professional insights, longer form, thought leadership
- Facebook: Community-focused, conversational, shareable
- Instagram: Visual storytelling, emoji-friendly, engaging hooks`;

/**
 * Builds prompt for social posts generation
 */
function buildSocialPrompt(
  blogTitle: string,
  blogContent: string,
  excerpt: string,
  research?: ResearchPack,
): string {
  const researchSection = research
    ? `\nREALTIME RESEARCH CONTEXT:\nKey Findings:\n${research.keyFindings.map((v) => `- ${v}`).join("\n")}\n\nTrending Angles:\n${research.trendingAngles.map((v) => `- ${v}`).join("\n")}\n\nUse only claims that can be supported by these findings.\n`
    : "";

  return `Create platform-specific social media posts for this blog article.

BLOG TITLE: ${blogTitle}

BLOG EXCERPT: ${excerpt}

KEY POINTS FROM ARTICLE:
${blogContent.substring(0, 800)}...
${researchSection}

Create 4 unique posts optimized for each platform:

1. TWITTER (MAXIMUM 280 characters - STRICT LIMIT):
   - Start with a hook
   - Include main value proposition
   - Make it quotable
   - Can use 1-2 relevant emojis

2. LINKEDIN (1-2 paragraphs):
   - Professional, thought-leadership tone
   - Lead with an insight or question
   - Provide business/career value
   - End with engagement question

3. FACEBOOK (2-3 paragraphs):
   - Conversational, relatable tone
   - Community-focused
   - Shareable content
   - Discussion prompt at end

4. INSTAGRAM (caption style):
   - Engaging storytelling
   - Use 2-4 emojis strategically
   - Build community connection
   - Include clear CTA

Return as JSON with this structure:
{
  "socialPosts": {
    "twitter": "...",
    "linkedin": "...",
    "facebook": "...",
    "instagram": "..."
  }
}`;
}

/**
 * Generates social posts using the configured AI provider
 */
export async function generateSocialPosts(
  _step: typeof InngestStep,
  blogTitle: string,
  blogContent: string,
  excerpt: string,
  research?: ResearchPack,
): Promise<{
  twitter: string;
  linkedin: string;
  facebook: string;
  instagram: string;
}> {
  console.log("[SOCIAL-POSTS] Generating social posts");

  try {
    const ai = getAIProvider();
    console.log("[SOCIAL-POSTS] Calling AI provider...");
    const response = await ai.generateContent(
      SOCIAL_SYSTEM_PROMPT,
      buildSocialPrompt(blogTitle, blogContent, excerpt, research),
    );
    console.log("[SOCIAL-POSTS] Raw response:", response.substring(0, 200));

    console.log("[SOCIAL-POSTS] Parsing JSON...");
    const parsed = JSON.parse(cleanAndExtractJson(response)) as {
      socialPosts?: {
        twitter?: string;
        linkedin?: string;
        facebook?: string;
        instagram?: string;
      };
    };

    // Normalize before schema validation so hard limits don't fail the pipeline.
    if (parsed.socialPosts?.twitter && typeof parsed.socialPosts.twitter === "string") {
      parsed.socialPosts.twitter = trimToWordBoundary(parsed.socialPosts.twitter.trim(), 280);
    }

    console.log("[SOCIAL-POSTS] Validating with Zod...");
    const validated = SocialPostsResponseSchema.parse(parsed);
    console.log("[SOCIAL-POSTS] Validation passed");

    console.log("[SOCIAL-POSTS] Social posts generated successfully!");

    return {
      twitter: validated.socialPosts.twitter,
      linkedin: validated.socialPosts.linkedin,
      facebook: validated.socialPosts.facebook,
      instagram: validated.socialPosts.instagram,
    };
  } catch (error) {
    console.error("[SOCIAL-POSTS] Generation error:", error);
    throw error;
  }
}
