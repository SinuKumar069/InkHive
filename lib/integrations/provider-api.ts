import type { SocialPlatform } from "@/lib/integrations/platforms";
import { getOAuthConfig } from "@/lib/integrations/platforms";

type TokenResult = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

type ConnectionIdentity = {
  accountId?: string;
  accountName?: string;
  metadata?: Record<string, string>;
  effectiveAccessToken?: string;
};

function getErrorMessage(payload: Record<string, unknown>): string | undefined {
  const error = payload.error as { message?: string } | undefined;
  if (error?.message) {
    return error.message;
  }
  if (typeof payload.error_description === "string") {
    return payload.error_description;
  }
  if (typeof payload.message === "string") {
    return payload.message;
  }
  if (typeof payload.error === "string") {
    return payload.error;
  }
  return undefined;
}

function toFormData(values: Record<string, string>): string {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => params.set(key, value));
  return params.toString();
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 200)}`);
  }
}

function inferExpiresAt(expiresIn?: unknown): number | undefined {
  if (typeof expiresIn === "number" && Number.isFinite(expiresIn)) {
    return Date.now() + expiresIn * 1000;
  }
  if (typeof expiresIn === "string") {
    const parsed = Number(expiresIn);
    if (Number.isFinite(parsed)) {
      return Date.now() + parsed * 1000;
    }
  }
  return undefined;
}

export async function exchangeOAuthCode(
  platform: SocialPlatform,
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<TokenResult> {
  const config = getOAuthConfig(platform);

  if (platform === "twitter") {
    const body = toFormData({
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      client_id: config.clientId,
      ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
    });

    const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString(
      "base64",
    );
    const res = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body,
    });

    const payload = await safeJson(res);
    if (!res.ok) {
      throw new Error(
        `Twitter token exchange failed: ${String(payload.error_description ?? payload.error ?? res.statusText)}`,
      );
    }

    return {
      accessToken: String(payload.access_token),
      refreshToken:
        typeof payload.refresh_token === "string"
          ? payload.refresh_token
          : undefined,
      expiresAt: inferExpiresAt(payload.expires_in),
    };
  }

  if (platform === "linkedin") {
    const body = toFormData({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    const res = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const payload = await safeJson(res);

    if (!res.ok) {
      throw new Error(
        `LinkedIn token exchange failed: ${String(payload.error_description ?? payload.error ?? res.statusText)}`,
      );
    }

    return {
      accessToken: String(payload.access_token),
      refreshToken:
        typeof payload.refresh_token === "string"
          ? payload.refresh_token
          : undefined,
      expiresAt: inferExpiresAt(payload.expires_in),
    };
  }

  const tokenUrl = new URL(config.tokenUrl);
  tokenUrl.searchParams.set("client_id", config.clientId);
  tokenUrl.searchParams.set("client_secret", config.clientSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const res = await fetch(tokenUrl.toString(), { method: "GET" });
  const payload = await safeJson(res);

  if (!res.ok) {
    throw new Error(
      `${platform} token exchange failed: ${String(getErrorMessage(payload) ?? res.statusText)}`,
    );
  }

  return {
    accessToken: String(payload.access_token),
    refreshToken:
      typeof payload.refresh_token === "string"
        ? payload.refresh_token
        : undefined,
    expiresAt: inferExpiresAt(payload.expires_in),
  };
}

export async function refreshAccessToken(
  platform: SocialPlatform,
  refreshToken: string,
): Promise<TokenResult> {
  const config = getOAuthConfig(platform);

  if (platform === "twitter") {
    const body = toFormData({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: config.clientId,
    });
    const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString(
      "base64",
    );

    const res = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body,
    });
    const payload = await safeJson(res);

    if (!res.ok) {
      throw new Error(
        `Twitter token refresh failed: ${String(payload.error_description ?? payload.error ?? res.statusText)}`,
      );
    }

    return {
      accessToken: String(payload.access_token),
      refreshToken:
        typeof payload.refresh_token === "string"
          ? payload.refresh_token
          : refreshToken,
      expiresAt: inferExpiresAt(payload.expires_in),
    };
  }

  if (platform === "linkedin") {
    const body = toFormData({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    const res = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const payload = await safeJson(res);

    if (!res.ok) {
      throw new Error(
        `LinkedIn token refresh failed: ${String(payload.error_description ?? payload.error ?? res.statusText)}`,
      );
    }

    return {
      accessToken: String(payload.access_token),
      refreshToken:
        typeof payload.refresh_token === "string"
          ? payload.refresh_token
          : refreshToken,
      expiresAt: inferExpiresAt(payload.expires_in),
    };
  }

  throw new Error(`${platform} does not support refresh flow in this implementation`);
}

export async function resolveConnectionIdentity(
  platform: SocialPlatform,
  accessToken: string,
): Promise<ConnectionIdentity> {
  if (platform === "twitter") {
    const meRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payload = await safeJson(meRes);
    if (!meRes.ok) {
      throw new Error(
        `Twitter profile fetch failed: ${String(payload.detail ?? payload.title ?? meRes.statusText)}`,
      );
    }
    const data = (payload.data ?? {}) as Record<string, unknown>;
    return {
      accountId: typeof data.id === "string" ? data.id : undefined,
      accountName: typeof data.username === "string" ? data.username : undefined,
    };
  }

  if (platform === "linkedin") {
    const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payload = await safeJson(meRes);
    if (!meRes.ok) {
      throw new Error(
        `LinkedIn profile fetch failed: ${String(payload.error_description ?? payload.message ?? meRes.statusText)}`,
      );
    }

    return {
      accountId: typeof payload.sub === "string" ? payload.sub : undefined,
      accountName:
        typeof payload.name === "string"
          ? payload.name
          : typeof payload.given_name === "string"
            ? payload.given_name
            : undefined,
    };
  }

  if (platform === "facebook") {
    const pagesRes = await fetch(
      "https://graph.facebook.com/v22.0/me/accounts?fields=id,name,access_token&limit=25",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const payload = await safeJson(pagesRes);
    if (!pagesRes.ok) {
      throw new Error(
        `Facebook pages fetch failed: ${String(getErrorMessage(payload) ?? pagesRes.statusText)}`,
      );
    }

    const page = Array.isArray(payload.data)
      ? (payload.data[0] as Record<string, unknown> | undefined)
      : undefined;
    if (!page || typeof page.id !== "string" || typeof page.access_token !== "string") {
      throw new Error("No Facebook page found. Connect an account with at least one page.");
    }

    return {
      accountId: page.id,
      accountName: typeof page.name === "string" ? page.name : undefined,
      effectiveAccessToken: page.access_token,
      metadata: {
        pageId: page.id,
      },
    };
  }

  const pagesRes = await fetch(
    "https://graph.facebook.com/v22.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&limit=25",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  const payload = await safeJson(pagesRes);
  if (!pagesRes.ok) {
    throw new Error(
      `Instagram pages fetch failed: ${String(getErrorMessage(payload) ?? pagesRes.statusText)}`,
    );
  }

  const pages = Array.isArray(payload.data)
    ? (payload.data as Array<Record<string, unknown>>)
    : [];
  const pageWithInstagram = pages.find((page) => {
    const ig = page.instagram_business_account as Record<string, unknown> | undefined;
    return Boolean(ig && typeof ig.id === "string");
  });

  if (!pageWithInstagram) {
    throw new Error(
      "No Instagram business account found. Connect a Facebook page linked to an Instagram business account.",
    );
  }

  const ig = pageWithInstagram.instagram_business_account as Record<string, unknown>;
  const pageId = String(pageWithInstagram.id);

  return {
    accountId: typeof ig.id === "string" ? ig.id : undefined,
    accountName:
      typeof ig.username === "string"
        ? ig.username
        : typeof pageWithInstagram.name === "string"
          ? pageWithInstagram.name
          : undefined,
    effectiveAccessToken:
      typeof pageWithInstagram.access_token === "string"
        ? pageWithInstagram.access_token
        : undefined,
    metadata: {
      pageId,
      instagramAccountId: typeof ig.id === "string" ? ig.id : "",
    },
  };
}
