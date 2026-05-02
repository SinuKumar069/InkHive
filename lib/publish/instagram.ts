interface InstagramContent {
  text: string;
  imageUrl?: string;
}

interface InstagramCredentials {
  accessToken: string;
  metadata?: Record<string, string>;
  accountId?: string;
}

type GraphResponse = {
  id?: string;
  error?: {
    message?: string;
  };
};

export async function publishToInstagram(
  content: InstagramContent,
  credentials: InstagramCredentials,
): Promise<void> {
  const instagramAccountId =
    credentials.metadata?.instagramAccountId || credentials.accountId;

  if (!instagramAccountId) {
    throw new Error(
      "Instagram account ID missing in connected account metadata",
    );
  }

  if (!content.imageUrl) {
    throw new Error(
      "Instagram publishing requires imageUrl. Add an image to the Instagram post before publishing.",
    );
  }

  const createMediaEndpoint = new URL(
    `https://graph.facebook.com/v22.0/${instagramAccountId}/media`,
  );
  createMediaEndpoint.searchParams.set("image_url", content.imageUrl);
  createMediaEndpoint.searchParams.set("caption", content.text);

  const mediaResponse = await fetch(createMediaEndpoint.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
    },
  });

  const mediaPayload = (await mediaResponse.json().catch(() => ({}))) as GraphResponse;
  if (!mediaResponse.ok || !mediaPayload.id) {
    throw new Error(
      `Instagram media creation failed: ${mediaPayload.error?.message || mediaResponse.statusText}`,
    );
  }

  const publishEndpoint = new URL(
    `https://graph.facebook.com/v22.0/${instagramAccountId}/media_publish`,
  );
  publishEndpoint.searchParams.set("creation_id", mediaPayload.id);

  const publishResponse = await fetch(publishEndpoint.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
    },
  });

  const publishPayload = (await publishResponse.json().catch(() => ({}))) as GraphResponse;
  if (!publishResponse.ok) {
    throw new Error(
      `Instagram publish failed: ${publishPayload.error?.message || publishResponse.statusText}`,
    );
  }
}
