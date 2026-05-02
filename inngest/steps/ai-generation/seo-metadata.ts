/**
 * Agent 4: SEO Metadata Optimizer
 *
 * Generates SEO-optimized metadata for blog content
 * - Meta title (under 60 chars)
 * - Meta description (150-160 chars)
 * - Keywords extraction
 * - URL slug generation
 */
import type { step as InngestStep } from "inngest";
import { z } from "zod";
import { getAIProvider } from "../../lib/ai-client";
import type { ResearchPack } from "../../lib/research-provider";

// Zod schema for structured output
const seoMetadataSchema = z.object({
  title: z
    .string()
    .max(60)
    .describe("SEO title under 60 characters, keyword-rich and compelling"),
  description: z
    .string()
    .describe("Meta description 150-160 characters, includes call-to-action"),
  keywords: z
    .array(z.string())
    .min(5)
    .max(10)
    .describe("5-10 relevant SEO keywords"),
  slug: z.string().describe("URL-friendly slug (kebab-case, no special chars)"),
});

const SeoMetadataResponseSchema = z.object({
  seoMetadata: seoMetadataSchema,
});

// System prompt
const SEO_SYSTEM_PROMPT = `You are an expert SEO specialist who optimizes content for search engines.

SEO Best Practices:
- Meta titles: Under 60 chars, front-load keywords, compelling
- Meta descriptions: 150-160 chars EXACTLY, include CTA, natural language
- Keywords: Mix of head terms and long-tail keywords
- Slugs: Short, descriptive, kebab-case, no stop words
- Focus on search intent and user value

IMPORTANT: Keep meta description between 150-160 characters only.`;

/**
 * Builds prompt for SEO metadata generation
 */
function buildSeoPrompt(
  blogTitle: string,
  blogContent: string,
  excerpt: string,
  research?: ResearchPack,
): string {
  const researchSection = research
    ? `\nREALTIME RESEARCH CONTEXT:\nKey Findings:\n${research.keyFindings.map((v) => `- ${v}`).join("\n")}\n\nTrending Angles:\n${research.trendingAngles.map((v) => `- ${v}`).join("\n")}\n`
    : "";

  return `Generate SEO metadata for this blog article.

BLOG TITLE: ${blogTitle}

BLOG EXCERPT: ${excerpt}

FULL CONTENT (first 1000 chars):
${blogContent.substring(0, 1000)}
${researchSection}

Generate SEO metadata:

1. META TITLE:
   - Under 60 characters (STRICT LIMIT)
   - Include primary keyword near the beginning
   - Compelling and click-worthy

2. META DESCRIPTION:
   - EXACTLY 150-160 characters (not more, not less)
   - Include primary and secondary keywords
   - Add clear call-to-action
   - Make it enticing to click

3. KEYWORDS:
   - 5-10 relevant keywords
   - Mix of broad and specific terms
   - Include long-tail keywords
   - Sorted by importance

4. URL SLUG:
   - Short and descriptive
   - Use kebab-case (hyphens between words)
   - Remove stop words (and, the, a, etc.)
   - Include primary keyword

Return as JSON with this structure:
{
  "seoMetadata": {
    "title": "Under 60 chars SEO title",
    "description": "150-160 char meta description with CTA",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "slug": "url-friendly-slug"
  }
}`;
}

/**
 * Generates SEO metadata using the configured AI provider
 */
export async function generateSeoMetadata(
  _step: typeof InngestStep,
  blogTitle: string,
  blogContent: string,
  excerpt: string,
  research?: ResearchPack,
): Promise<{
  title: string;
  description: string;
  keywords: string[];
  slug: string;
}> {
  console.log("[SEO] Generating SEO metadata");

  try {
    const ai = getAIProvider();
    console.log("[SEO] Calling AI provider...");
    const response = await ai.generateContent(
      SEO_SYSTEM_PROMPT,
      buildSeoPrompt(blogTitle, blogContent, excerpt, research),
    );
    console.log("[SEO] Raw response:", response.substring(0, 200));

    console.log("[SEO] Parsing JSON...");
    const parsed = JSON.parse(response);
    console.log("[SEO] Validating with Zod...");
    const validated = SeoMetadataResponseSchema.parse(parsed);
    console.log("[SEO] Validation passed");

    // Safety checks - truncate if needed
    const title =
      validated.seoMetadata.title.length > 60
        ? validated.seoMetadata.title.substring(0, 57)
        : validated.seoMetadata.title;

    // Truncate description to exactly 160 chars max
    const description =
      validated.seoMetadata.description.length > 160
        ? validated.seoMetadata.description.substring(0, 157).trim()
        : validated.seoMetadata.description;

    console.log("[SEO] SEO metadata generated successfully!");

    return {
      title,
      description,
      keywords: validated.seoMetadata.keywords,
      slug: validated.seoMetadata.slug,
    };
  } catch (error) {
    console.error("[SEO] Generation error:", error);
    throw error;
  }
}
