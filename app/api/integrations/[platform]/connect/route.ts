import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import {
  OAUTH_STATE_TTL_SECONDS,
  encodeOAuthState,
  getOAuthStateCookieName,
  getOAuthVerifierCookieName,
  randomBase64Url,
  sha256Base64Url,
} from "@/lib/integrations/oauth";
import {
  getOAuthConfig,
  isSocialPlatform,
} from "@/lib/integrations/platforms";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ platform: string }> },
) {
  const { platform: platformParam } = await context.params;
  if (!isSocialPlatform(platformParam)) {
    return Response.json({ error: "Unsupported platform" }, { status: 400 });
  }

  const authData = await auth();
  if (!authData.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getOAuthConfig(platformParam);
  const redirectUri = `${request.nextUrl.origin}${config.callbackPath}`;

  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/dashboard";
  const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/dashboard";

  const state = encodeOAuthState({
    nonce: randomBase64Url(24),
    userId: authData.userId,
    platform: platformParam,
    issuedAt: Date.now(),
    returnTo: safeReturnTo,
  });

  const cookieStore = await cookies();
  cookieStore.set(getOAuthStateCookieName(platformParam), state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OAUTH_STATE_TTL_SECONDS,
    path: "/",
  });

  const authUrl = new URL(config.authorizeUrl);
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", config.scopes.join(" "));

  if (config.usePkce) {
    const verifier = randomBase64Url(48);
    const challenge = await sha256Base64Url(verifier);

    cookieStore.set(getOAuthVerifierCookieName(platformParam), verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: OAUTH_STATE_TTL_SECONDS,
      path: "/",
    });

    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
  }

  if (config.extraAuthParams) {
    Object.entries(config.extraAuthParams).forEach(([key, value]) => {
      authUrl.searchParams.set(key, value);
    });
  }

  return Response.redirect(authUrl.toString());
}
