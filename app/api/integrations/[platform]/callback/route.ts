import { auth } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { api } from "@/convex/_generated/api";
import { encryptSecret } from "@/lib/integrations/crypto";
import {
  OAUTH_STATE_TTL_SECONDS,
  decodeOAuthState,
  getOAuthStateCookieName,
  getOAuthVerifierCookieName,
} from "@/lib/integrations/oauth";
import {
  exchangeOAuthCode,
  resolveConnectionIdentity,
} from "@/lib/integrations/provider-api";
import {
  getOAuthConfig,
  isSocialPlatform,
} from "@/lib/integrations/platforms";

function redirectWithError(request: NextRequest, path: string, message: string) {
  const url = new URL(path, request.url);
  url.searchParams.set("integration_error", message);
  return Response.redirect(url.toString());
}

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

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const providerError = request.nextUrl.searchParams.get("error");

  if (providerError) {
    return redirectWithError(
      request,
      "/dashboard",
      `${platformParam}_oauth_denied`,
    );
  }

  if (!code || !state) {
    return redirectWithError(request, "/dashboard", "missing_oauth_params");
  }

  const cookieStore = await cookies();
  const stateCookieName = getOAuthStateCookieName(platformParam);
  const verifierCookieName = getOAuthVerifierCookieName(platformParam);

  const stateCookieValue = cookieStore.get(stateCookieName)?.value;
  const codeVerifier = cookieStore.get(verifierCookieName)?.value;

  cookieStore.delete(stateCookieName);
  cookieStore.delete(verifierCookieName);

  if (!stateCookieValue || stateCookieValue !== state) {
    return redirectWithError(request, "/dashboard", "oauth_state_mismatch");
  }

  const decodedState = decodeOAuthState(stateCookieValue);
  if (
    decodedState.platform !== platformParam ||
    decodedState.userId !== authData.userId
  ) {
    return redirectWithError(request, "/dashboard", "oauth_state_invalid");
  }

  if (Date.now() - decodedState.issuedAt > OAUTH_STATE_TTL_SECONDS * 1000) {
    return redirectWithError(request, "/dashboard", "oauth_state_expired");
  }

  const convexToken = await authData.getToken({ template: "convex" });
  if (!convexToken) {
    return redirectWithError(request, "/dashboard", "convex_token_missing");
  }

  const config = getOAuthConfig(platformParam);
  const redirectUri = `${request.nextUrl.origin}${config.callbackPath}`;

  try {
    const tokenResult = await exchangeOAuthCode(
      platformParam,
      code,
      redirectUri,
      codeVerifier,
    );
    const identity = await resolveConnectionIdentity(
      platformParam,
      tokenResult.accessToken,
    );

    const accessTokenToStore =
      identity.effectiveAccessToken ?? tokenResult.accessToken;

    const upsertPayload: {
      platform: typeof platformParam;
      status: "connected";
      scopes: string[];
      accountName?: string;
      accountId?: string;
      encryptedAccessToken?: string;
      encryptedRefreshToken?: string;
      tokenExpiresAt?: number;
      metadata?: string;
      lastError?: string;
    } = {
      platform: platformParam,
      status: "connected",
      scopes: config.scopes,
      encryptedAccessToken: await encryptSecret(accessTokenToStore),
    };

    if (identity.accountName) {
      upsertPayload.accountName = identity.accountName;
    }
    if (identity.accountId) {
      upsertPayload.accountId = identity.accountId;
    }
    if (tokenResult.refreshToken) {
      upsertPayload.encryptedRefreshToken = await encryptSecret(
        tokenResult.refreshToken,
      );
    }
    if (tokenResult.expiresAt) {
      upsertPayload.tokenExpiresAt = tokenResult.expiresAt;
    }
    if (identity.metadata) {
      upsertPayload.metadata = JSON.stringify(identity.metadata);
    }

    await fetchMutation(api.connectedAccounts.upsertConnectionFromOAuth, upsertPayload, {
      token: convexToken,
    });

    const destination = decodedState.returnTo || "/dashboard";
    const successUrl = new URL(destination, request.url);
    successUrl.searchParams.set("integration_connected", platformParam);
    return Response.redirect(successUrl.toString());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    await fetchMutation(
      api.connectedAccounts.upsertConnectionFromOAuth,
      {
        platform: platformParam,
        status: "error",
        scopes: config.scopes,
        lastError: message,
      },
      { token: convexToken },
    );

    return redirectWithError(request, "/dashboard", `${platformParam}_oauth_failed`);
  }
}
