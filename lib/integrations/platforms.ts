export const SOCIAL_PLATFORMS = [
  "twitter",
  "linkedin",
  "facebook",
  "instagram",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type SocialConnectionStatus =
  | "connected"
  | "expired"
  | "error"
  | "disconnected";

export function isSocialPlatform(value: string): value is SocialPlatform {
  return SOCIAL_PLATFORMS.includes(value as SocialPlatform);
}

export type OAuthConfig = {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  callbackPath: string;
  usePkce: boolean;
  extraAuthParams?: Record<string, string>;
};

export function getOAuthConfig(platform: SocialPlatform): OAuthConfig {
  if (platform === "twitter") {
    return {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      authorizeUrl: "https://twitter.com/i/oauth2/authorize",
      tokenUrl: "https://api.twitter.com/2/oauth2/token",
      scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
      callbackPath: "/api/integrations/twitter/callback",
      usePkce: true,
    };
  }

  if (platform === "linkedin") {
    return {
      clientId: requiredEnv("LINKEDIN_CLIENT_ID"),
      clientSecret: requiredEnv("LINKEDIN_CLIENT_SECRET"),
      authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
      tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
      scopes: ["openid", "profile", "email", "w_member_social"],
      callbackPath: "/api/integrations/linkedin/callback",
      usePkce: false,
    };
  }

  if (platform === "facebook") {
    return {
      clientId: requiredEnv("FACEBOOK_APP_ID"),
      clientSecret: requiredEnv("FACEBOOK_APP_SECRET"),
      authorizeUrl: "https://www.facebook.com/v22.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v22.0/oauth/access_token",
      scopes: ["pages_manage_posts", "pages_show_list", "pages_read_engagement"],
      callbackPath: "/api/integrations/facebook/callback",
      usePkce: false,
    };
  }

  if (platform === "instagram") {
    return {
      clientId: requiredEnv("INSTAGRAM_CLIENT_ID"),
      clientSecret: requiredEnv("INSTAGRAM_CLIENT_SECRET"),
      authorizeUrl: "https://api.instagram.com/oauth/authorize",
      tokenUrl: "https://api.instagram.com/oauth/access_token",
      scopes: [
        "instagram_basic",
        "instagram_content_publish",
        "pages_show_list",
        "pages_read_engagement",
        "business_management",
      ],
      callbackPath: "/api/integrations/instagram/callback",
      usePkce: false,
      extraAuthParams: {
        auth_type: "rerequest",
      },
    };
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}