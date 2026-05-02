/**
 * AI Client Abstraction
 *
 * Provides a unified interface for different AI providers.
 * Use getAIProvider() to get the configured provider instance.
 */

// AI Provider Interface - all providers implement this
export interface AIProvider {
  generateContent(systemPrompt: string, userPrompt: string): Promise<string>;
}

// Helper function to calculate reading time
export function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / 200); // 200 words per minute average
}

// Import providers
import { getGeminiProvider } from "./gemini-provider";
import { getOpenRouterProvider } from "./openrouter-provider";
import { AI_PROVIDER } from "./ai-config";

class ResilientAIProvider implements AIProvider {
  constructor(
    private primary: AIProvider,
    private fallback: AIProvider,
  ) {}

  async generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      return await this.primary.generateContent(systemPrompt, userPrompt);
    } catch (error) {
      const message =
        error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const shouldFallback =
        message.includes("http 500") ||
        message.includes("internal server error") ||
        message.includes("http 502") ||
        message.includes("http 503") ||
        message.includes("http 504");

      if (!shouldFallback) {
        throw error;
      }

      console.warn("[AI-CLIENT] Primary provider failed; retrying with fallback provider");
      return await this.fallback.generateContent(systemPrompt, userPrompt);
    }
  }
}

/**
 * Factory function - returns the configured AI provider (sync)
 */
export function getAIProvider(): AIProvider {
  if (AI_PROVIDER === "openrouter") {
    return new ResilientAIProvider(
      getOpenRouterProvider(),
      getGeminiProvider(),
    );
  }
  // Default to Gemini
  return getGeminiProvider();
}
