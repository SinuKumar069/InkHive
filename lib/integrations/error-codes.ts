import type { SocialPlatform } from "@/lib/integrations/platforms";

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
};

function platformLabel(platform: string): string {
  if (platform in PLATFORM_LABELS) {
    return PLATFORM_LABELS[platform as SocialPlatform];
  }
  return platform;
}

export function getIntegrationErrorMessage(code: string): string {
  const lower = code.toLowerCase();

  if (lower.endsWith("_config_missing")) {
    const platform = lower.replace(/_config_missing$/, "");
    return `${platformLabel(platform)} integration is not configured. Add API keys in environment variables and try again.`;
  }

  if (lower.endsWith("_oauth_denied")) {
    const platform = lower.replace(/_oauth_denied$/, "");
    return `${platformLabel(platform)} authorization was canceled or denied.`;
  }

  if (lower.endsWith("_oauth_failed")) {
    const platform = lower.replace(/_oauth_failed$/, "");
    return `Could not complete ${platformLabel(platform)} connection. Please try again.`;
  }

  const known: Record<string, string> = {
    missing_oauth_params: "OAuth callback is missing required parameters.",
    oauth_state_mismatch: "Connection session mismatch. Please reconnect and try again.",
    oauth_state_invalid: "Connection request is invalid. Please start the connection again.",
    oauth_state_expired: "Connection request expired. Please reconnect.",
    convex_token_missing: "Authentication session expired. Please refresh and try again.",
    unsupported_platform: "This social platform is not supported.",
    unauthorized: "Please sign in and try again.",
    integration_unknown_error: "Integration failed due to an unexpected error.",
  };

  return known[lower] ?? "Integration failed. Please try again.";
}

export function getIntegrationSuccessMessage(platform: string): string {
  return `${platformLabel(platform.toLowerCase())} account connected successfully.`;
}
