interface MediumContent {
  text: string;
  imageUrl?: string;
}

interface MediumCredentials {
  accessToken: string;
}

export async function publishToMedium(
  content: MediumContent,
  credentials: MediumCredentials,
): Promise<void> {
  void content;
  void credentials;
  throw new Error(
    "Medium publishing is not part of Phase 1. Implement in Phase 2.",
  );
}
