/**
 * AI Provider Configuration
 *
 * Switch between AI providers by setting AI_PROVIDER environment variable
 * or changing the default below.
 *
 * Supported providers:
 * - 'gemini': Google Gemini (default)
 * - 'openrouter': OpenRouter (access to multiple models)
 */

// Set this to switch providers: 'gemini' | 'openrouter'
export const AI_PROVIDER: "gemini" | "openrouter" =
  (process.env.AI_PROVIDER as "gemini" | "openrouter") || "gemini";

// Provider-specific configurations
export const AI_CONFIG = {
  gemini: {
    model: "gemini-2.5-flash",
    maxOutputTokens: 8000,
    temperature: 0.7,
  },
  openrouter: {
    model: process.env.OPENROUTER_MODEL || "x-ai/grok-4.1-fast:free",
    maxTokens: 4000,
    temperature: 0.7,
    // OpenRouter base URL
    baseUrl: "https://openrouter.ai/api/v1",
  },
};
