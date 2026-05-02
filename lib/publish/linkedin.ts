interface LinkedInContent {
  text: string;
  imageUrl?: string;
}

interface LinkedInCredentials {
  accessToken: string;
  accountId?: string;
}

async function getLinkedInPersonId(accessToken: string): Promise<string> {
  const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const profilePayload = await profileResponse.json().catch(() => ({}));
  if (!profileResponse.ok || typeof profilePayload.sub !== "string") {
    throw new Error(
      `LinkedIn profile lookup failed: ${String(profilePayload.error_description || profilePayload.message || profileResponse.statusText)}`,
    );
  }

  return profilePayload.sub;
}

export async function publishToLinkedIn(
  content: LinkedInContent,
  credentials: LinkedInCredentials,
): Promise<void> {
  const personId = credentials.accountId || (await getLinkedInPersonId(credentials.accessToken));

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${personId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content.text,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      `LinkedIn publish failed: ${String(payload.message || payload.error_description || response.statusText)}`,
    );
  }
}
