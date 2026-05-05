import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_CONFIG } from "./ai-config";

export type ResearchSource = {
  title: string;
  url: string;
  domain: string;
  publishedAt?: string;
};

export type ResearchPack = {
  keyFindings: string[];
  trendingAngles: string[];
  sources: ResearchSource[];
  researchedAt: number;
};

const RESEARCH_SYSTEM_PROMPT = `You are a realtime research analyst for social media marketing.
Use Google Search grounding to gather current, verifiable information.
Return only JSON.

Output rules:
- keyFindings: 5-8 concise factual bullets from current sources.
- trendingAngles: 3-5 short trend angles suitable for social campaigns.
- sources: 3-8 reputable sources with title, url, domain, publishedAt (if known).
- Do not include claims that cannot be tied to a source.
- Do not use emojis anywhere in the response.`;

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

const trustedDomains = new Set([
  "reuters.com",
  "apnews.com",
  "bloomberg.com",
  "forbes.com",
  "wsj.com",
  "nytimes.com",
  "techcrunch.com",
  "theverge.com",
  "blog.google",
  "openai.com",
  "x.com",
  "linkedin.com",
  "meta.com",
  "youtube.com",
]);

function isTrustedDomain(domain: string): boolean {
  if (!domain) return false;
  for (const trusted of trustedDomains) {
    if (domain === trusted || domain.endsWith(`.${trusted}`)) {
      return true;
    }
  }
  return false;
}

type RawResearchResponse = {
  research?: {
    keyFindings?: string[];
    trendingAngles?: string[];
    sources?: Array<{
      title?: string;
      url?: string;
      domain?: string;
      publishedAt?: string;
    }>;
  };
};

type RawResearchContent = NonNullable<RawResearchResponse["research"]>;

function sanitizeJsonCandidate(value: string): string {
  // Remove wrapping markdown fences if present.
  let sanitized = value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Remove BOM and normalize smart quotes that can break JSON parsing.
  sanitized = sanitized
    .replace(/^\uFEFF/, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  // Sanitize common LLM JSON errors (e.g., trailing commas).
  sanitized = sanitized.replace(/,\s*([}\]])/g, "$1");

  // Sanitize unescaped control characters within string literals.
  sanitized = sanitized.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
    return match
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")
      .replace(/[\b]/g, "\\b")
      .replace(/[\f]/g, "\\f")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  });

  return sanitized;
}

function buildJsonCandidates(rawText: string): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();
  const push = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    candidates.push(trimmed);
  };

  // Prefer explicit fenced JSON blocks first.
  const fencedMatches = rawText.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi);
  for (const match of fencedMatches) {
    if (match[1]) push(match[1]);
  }

  // Fallback: extract largest brace-delimited JSON-looking payload.
  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    push(rawText.slice(firstBrace, lastBrace + 1));
  }

  // Final fallback: full text.
  push(rawText);

  return candidates;
}

function normalizeResearchPayload(parsed: unknown): RawResearchContent | null {
  if (!parsed || typeof parsed !== "object") return null;
  const objectValue = parsed as Record<string, unknown>;

  const researchCandidate = objectValue.research;
  if (researchCandidate && typeof researchCandidate === "object") {
    return researchCandidate as RawResearchContent;
  }

  // Some model responses omit the wrapper and return top-level keys directly.
  const looksLikeTopLevelResearch =
    Array.isArray(objectValue.keyFindings) ||
    Array.isArray(objectValue.trendingAngles) ||
    Array.isArray(objectValue.sources);
  if (looksLikeTopLevelResearch) {
    return objectValue as RawResearchContent;
  }

  return null;
}

function buildFallbackResearch(rawText: string): ResearchPack {
  const cleaned = rawText
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((value) => value.trim())
    .filter(Boolean);

  const keyFindings = sentences.slice(0, 5);
  const trendingAngles = sentences.slice(0, 3);

  return {
    keyFindings,
    trendingAngles,
    sources: [],
    researchedAt: Date.now(),
  };
}

export function isQuotaError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("resource_exhausted") ||
    message.includes("quota") ||
    message.includes("rate limit")
  );
}

export async function generateGroundedResearch(
  inputType: "topic" | "article",
  inputContent: string,
): Promise<ResearchPack> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: AI_CONFIG.gemini.model });
  const prompt = `Input type: ${inputType}
Input:
${inputContent}

Build current research summary for this marketing topic and return:
{
  "research": {
    "keyFindings": ["..."],
    "trendingAngles": ["..."],
    "sources": [
      { "title": "...", "url": "...", "domain": "...", "publishedAt": "..." }
    ]
  }
}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `${RESEARCH_SYSTEM_PROMPT}\n\n${prompt}` }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 3000,
    },
    tools: [{ googleSearch: {} }] as unknown as object[],
  });

  const rawText = result.response.text();
  if (!rawText) {
    throw new Error("No research response generated");
  }

  const parseErrors: string[] = [];
  let research: RawResearchContent | null = null;
  let finalPayloadAttempt = "";

  for (const candidate of buildJsonCandidates(rawText)) {
    const payload = sanitizeJsonCandidate(candidate);
    finalPayloadAttempt = payload;
    try {
      const parsed = JSON.parse(payload) as unknown;
      research = normalizeResearchPayload(parsed);
      if (research) break;
      parseErrors.push("Parsed JSON did not contain expected research fields");
    } catch (error) {
      parseErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (!research) {
    console.error("Failed to parse Gemini research payload");
    console.error("Raw response:", rawText);
    console.error("Final payload attempt:", finalPayloadAttempt);
    console.error("Parse errors:", parseErrors);
    return buildFallbackResearch(rawText);
  }

  const sources = (research.sources || [])
    .map((source) => {
      const url = source.url || "";
      const domain = source.domain || extractDomain(url);
      return {
        title: source.title || "Untitled source",
        url,
        domain,
        publishedAt: source.publishedAt,
      };
    })
    .filter((source) => source.url && source.domain && isTrustedDomain(source.domain));

  return {
    keyFindings: (research.keyFindings || []).slice(0, 8),
    trendingAngles: (research.trendingAngles || []).slice(0, 5),
    sources: sources.slice(0, 8),
    researchedAt: Date.now(),
  };
}
