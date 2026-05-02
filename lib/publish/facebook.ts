interface FacebookContent {
  text: string;
  imageUrl?: string;
}

interface FacebookCredentials {
  accessToken: string;
  metadata?: Record<string, string>;
  accountId?: string;
}

export async function publishToFacebook(
  content: FacebookContent,
  credentials: FacebookCredentials,
): Promise<void> {
  const pageId =
    credentials.metadata?.pageId ||
    credentials.accountId;

  if (!pageId) {
    throw new Error("Facebook page ID missing in connected account metadata");
  }

  const endpoint = new URL(`https://graph.facebook.com/v22.0/${pageId}/feed`);
  endpoint.searchParams.set("message", content.text);

  const response = await fetch(endpoint.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = (payload as { error?: { message?: string } }).error;
    throw new Error(
      `Facebook publish failed: ${error?.message || response.statusText}`,
    );
  }
}
