interface TwitterContent {
  text: string;
  imageUrl?: string;
}

interface TwitterCredentials {
  accessToken: string;
}

export async function publishToTwitter(
  content: TwitterContent,
  credentials: TwitterCredentials,
): Promise<void> {
  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: content.text,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      (payload as { detail?: string }).detail ||
      (payload as { title?: string }).title ||
      response.statusText;
    throw new Error(`Twitter publish failed: ${detail}`);
  }
}
