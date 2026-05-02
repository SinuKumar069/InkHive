/**
 * Agent 3: Email Newsletter Generator
 *
 * Generates professional HTML email newsletters from blog content
 * - 5 subject line variations
 * - Preview text
 * - Full HTML email with inline CSS
 * - Plain text fallback
 */
import type { step as InngestStep } from "inngest";
import { z } from "zod";
import { getAIProvider } from "../../lib/ai-client";
import type { ResearchPack } from "../../lib/research-provider";

// Zod schema for structured output
const emailNewsletterSchema = z.object({
  subjectLines: z
    .array(z.string())
    .length(5)
    .describe("5 compelling subject lines, varied styles"),
  previewText: z
    .string()
    .max(100)
    .describe("Preview text under 100 characters"),
  htmlContent: z.string().describe("Full HTML email body with inline CSS"),
  plainText: z.string().describe("Plain text version for email clients"),
});

const EmailNewsletterResponseSchema = z.object({
  emailNewsletter: emailNewsletterSchema,
});

// System prompt
const EMAIL_SYSTEM_PROMPT = `You are an expert email marketing copywriter specializing in newsletters.

Email Best Practices:
- Subject lines should create curiosity, urgency, or value
- Preview text complements subject line
- HTML should be email-client friendly (Gmail, Outlook, Apple Mail)
- Use inline CSS only
- Mobile-responsive design
- Clear call-to-action
- Keep paragraphs short and scannable

IMPORTANT: Return valid JSON only, with proper escaping.`;

/**
 * Builds prompt for email newsletter generation
 */
function buildEmailPrompt(
  blogTitle: string,
  blogContent: string,
  excerpt: string,
  research?: ResearchPack,
): string {
  // Limit content length to prevent token overflow
  const truncatedContent = blogContent.substring(0, 3000);
  const researchSection = research
    ? `\nREALTIME RESEARCH CONTEXT:\nKey Findings:\n${research.keyFindings.map((v) => `- ${v}`).join("\n")}\n\nTrending Angles:\n${research.trendingAngles.map((v) => `- ${v}`).join("\n")}\n`
    : "";

  return `Create a professional email newsletter based on this blog article.

BLOG TITLE: ${blogTitle}

BLOG EXCERPT: ${excerpt}

FULL ARTICLE (truncated):
${truncatedContent}
${researchSection}

Create an email newsletter with:

1. 5 SUBJECT LINE VARIATIONS:
   - Style 1: Curiosity-driven
   - Style 2: Benefit-focused
   - Style 3: Question-based
   - Style 4: Urgency/FOMO
   - Style 5: Personal/Relatable

2. PREVIEW TEXT (under 100 characters):
   - Complements the subject line
   - Entices readers to open

3. HTML EMAIL CONTENT:
   - Professional header with title
   - Brief intro paragraph
   - Key takeaways (bullet points)
   - Link to full article
   - Clear CTA button
   - Professional footer
   - Use inline CSS styling
   - Mobile-friendly

4. PLAIN TEXT VERSION:
   - Same content without HTML tags
   - Clear formatting with line breaks

IMPORTANT:
- Return VALID JSON only
- Escape all quotes properly
- Keep HTML content under 5000 characters
- Do not include markdown code blocks in JSON values

Return as JSON with this structure:
{
  "emailNewsletter": {
    "subjectLines": ["Line 1", "Line 2", "Line 3", "Line 4", "Line 5"],
    "previewText": "Brief preview text",
    "htmlContent": "<html>...</html>",
    "plainText": "Plain text version..."
  }
}`;
}

/**
 * Generates email newsletter using the configured AI provider
 */
export async function generateEmailNewsletter(
  _step: typeof InngestStep,
  blogTitle: string,
  blogContent: string,
  excerpt: string,
  research?: ResearchPack,
): Promise<{
  subjectLines: string[];
  previewText: string;
  htmlContent: string;
  plainText: string;
}> {
  console.log("[EMAIL] Generating email newsletter");

  try {
    const ai = getAIProvider();
    console.log("[EMAIL] Calling AI provider...");
    const response = await ai.generateContent(
      EMAIL_SYSTEM_PROMPT,
      buildEmailPrompt(blogTitle, blogContent, excerpt, research),
    );
    console.log("[EMAIL] Raw response:", response.substring(0, 200));

    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = response;
    if (response.includes('```json')) {
      cleanedResponse = response.replace(/```json\n?/, '').replace(/```$/, '');
    } else if (response.includes('```')) {
      cleanedResponse = response.replace(/```\n?/, '').replace(/```$/, '');
    }

    console.log("[EMAIL] Parsing JSON...");
    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("[EMAIL] JSON parse error:", parseError);
      console.error("[EMAIL] Attempting to fix JSON...");
      // Try to extract JSON if there's extra text
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw parseError;
      }
    }

    console.log("[EMAIL] Validating with Zod...");
    if (
      parsed?.emailNewsletter?.previewText &&
      typeof parsed.emailNewsletter.previewText === "string" &&
      parsed.emailNewsletter.previewText.length > 100
    ) {
      parsed.emailNewsletter.previewText = parsed.emailNewsletter.previewText
        .slice(0, 100)
        .trim();
    }

    const validated = EmailNewsletterResponseSchema.parse(parsed);
    console.log("[EMAIL] Validation passed");

    console.log("[EMAIL] Email newsletter generated successfully!");

    return {
      subjectLines: validated.emailNewsletter.subjectLines,
      previewText: validated.emailNewsletter.previewText,
      htmlContent: validated.emailNewsletter.htmlContent,
      plainText: validated.emailNewsletter.plainText,
    };
  } catch (error) {
    console.error("[EMAIL] Generation error:", error);
    throw error;
  }
}
