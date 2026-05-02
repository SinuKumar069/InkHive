import type { SocialPlatform } from "@/lib/integrations/platforms";

export const OAUTH_STATE_TTL_SECONDS = 60 * 10;

function toBase64Url(input: Uint8Array): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return new Uint8Array(Buffer.from(base64, "base64"));
}

export function randomBase64Url(bytes = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return toBase64Url(new Uint8Array(digest));
}

export type OAuthStatePayload = {
  nonce: string;
  userId: string;
  platform: SocialPlatform;
  issuedAt: number;
  returnTo?: string;
};

export function encodeOAuthState(payload: OAuthStatePayload): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

export function decodeOAuthState(state: string): OAuthStatePayload {
  const json = new TextDecoder().decode(fromBase64Url(state));
  return JSON.parse(json) as OAuthStatePayload;
}

export function getOAuthStateCookieName(platform: SocialPlatform): string {
  return `oauth_state_${platform}`;
}

export function getOAuthVerifierCookieName(platform: SocialPlatform): string {
  return `oauth_pkce_${platform}`;
}
