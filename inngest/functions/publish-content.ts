/**
 * Content Publishing Workflow
 *
 * Publishes content to multiple platforms in parallel.
 */
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { decryptSecret, encryptSecret } from "@/lib/integrations/crypto";
import type { SocialPlatform } from "@/lib/integrations/platforms";
import { refreshAccessToken } from "@/lib/integrations/provider-api";
import { sendEmail } from "@/lib/publish/email";
import { publishToFacebook } from "@/lib/publish/facebook";
import { publishToInstagram } from "@/lib/publish/instagram";
import { publishToLinkedIn } from "@/lib/publish/linkedin";
import { publishToTwitter } from "@/lib/publish/twitter";
import { publishToMedium } from "@/lib/publish/medium";
import { inngest } from "../client";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type SocialPublishContent = { text: string; imageUrl?: string };

type PublishCredentials = {
  accessToken: string;
  accountId?: string;
  metadata?: Record<string, string>;
};

type SupportedPublishPlatform = SocialPlatform | "medium";

const PLATFORM_PUBLISHERS: Record<
  SupportedPublishPlatform,
  (content: SocialPublishContent, credentials: PublishCredentials) => Promise<void>
> = {
  twitter: publishToTwitter,
  linkedin: publishToLinkedIn,
  facebook: publishToFacebook,
  instagram: publishToInstagram,
  medium: publishToMedium,
};

function normalizeConnectionError(message: string): "expired" | "error" {
  const lower = message.toLowerCase();
  if (
    lower.includes("expired") ||
    lower.includes("invalid token") ||
    lower.includes("unauthorized") ||
    lower.includes("oauth")
  ) {
    return "expired";
  }
  return "error";
}

function parseConnectionMetadata(raw?: string): Record<string, string> | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed;
  } catch {
    return undefined;
  }
}

async function getPublishCredentials(
  userId: string,
  platform: SocialPlatform,
): Promise<PublishCredentials> {
  const connection = await convex.query(
    api.connectedAccounts.getConnectionByUserAndPlatform,
    {
      userId,
      platform,
    },
  );

  if (!connection || connection.status !== "connected") {
    throw new Error(`${platform} account is not connected`);
  }

  if (!connection.encryptedAccessToken) {
    throw new Error(`${platform} access token missing`);
  }

  const metadata = parseConnectionMetadata(connection.metadata);
  let accessToken = await decryptSecret(connection.encryptedAccessToken);

  const expiresSoon =
    connection.tokenExpiresAt !== undefined && connection.tokenExpiresAt <= Date.now() + 60_000;

  if (expiresSoon) {
    if (!connection.encryptedRefreshToken) {
      throw new Error(`${platform} access token expired. Reconnect your account.`);
    }

    const refreshToken = await decryptSecret(connection.encryptedRefreshToken);
    const refreshed = await refreshAccessToken(platform, refreshToken);

    accessToken = refreshed.accessToken;

    const payload: {
      userId: string;
      platform: SocialPlatform;
      status: "connected";
      encryptedAccessToken?: string;
      encryptedRefreshToken?: string;
      tokenExpiresAt?: number;
      lastError?: string;
    } = {
      userId,
      platform,
      status: "connected",
      encryptedAccessToken: await encryptSecret(refreshed.accessToken),
      lastError: "",
    };

    if (refreshed.refreshToken) {
      payload.encryptedRefreshToken = await encryptSecret(refreshed.refreshToken);
    }
    if (refreshed.expiresAt) {
      payload.tokenExpiresAt = refreshed.expiresAt;
    }

    await convex.mutation(api.connectedAccounts.upsertConnectionTokensByUserAndPlatform, payload);
  }

  return {
    accessToken,
    accountId: connection.accountId,
    metadata,
  };
}

async function markConnectionFailure(
  userId: string,
  platform: SocialPlatform,
  message: string,
) {
  await convex.mutation(api.connectedAccounts.upsertConnectionTokensByUserAndPlatform, {
    userId,
    platform,
    status: normalizeConnectionError(message),
    lastError: message,
  });
}

export const publishContent = inngest.createFunction(
  {
    id: "publish-content",
    retries: 3,
    triggers: [{ event: "content/publish" }],
    onFailure: async ({ event: failureEvent }) => {
      const original = failureEvent.data.event;
      const data = original.data as {
        projectId: string;
        platforms: string[];
      };
      console.error(
        `Publishing exhausted retries for project ${data.projectId}; platforms: ${data.platforms.join(", ")}`,
      );
    },
  },
  async ({ event, step }) => {
    const { projectId, platforms, userEmail, userId } = event.data;
    const typedProjectId = projectId as Id<"contentProjects">;

    const project = await step.run("get-project-data", async () => {
      return await convex.query(api.contentProjects.getProjectById, {
        projectId: typedProjectId,
      });
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const results: Record<string, { success: boolean; error?: string }> = {};

    const publishPromises = platforms.map(async (platform: string) => {
      try {
        await step.run(`publish-to-${platform}`, async () => {
          await convex.mutation(api.contentProjects.updatePublishStatus, {
            projectId: typedProjectId,
            platform,
            status: "draft",
          });

          if (platform === "email") {
            if (!project.emailNewsletter) {
              throw new Error("Email newsletter not generated");
            }
            if (!userEmail) {
              throw new Error("Missing recipient email for email publishing");
            }
            await sendEmail({
              to: userEmail,
              subject:
                project.emailNewsletter.subjectLines[
                project.emailNewsletter.selectedSubjectLine || 0
                ],
              html: project.emailNewsletter.htmlContent,
              text: project.emailNewsletter.plainText,
            });
          } else {
            if (!project.socialPosts) {
              throw new Error("Social posts not generated");
            }

            const typedPlatform = platform as SocialPlatform;
            const post = project.socialPosts[typedPlatform];
            if (!post) {
              throw new Error(`No content for ${platform}`);
            }

            const socialContent: SocialPublishContent = {
              text: post.text,
              imageUrl: post.imageUrl,
            };

            const publisher = PLATFORM_PUBLISHERS[typedPlatform];
            if (!publisher) {
              throw new Error(`Unknown platform: ${platform}`);
            }

            const credentials = await getPublishCredentials(userId, typedPlatform);
            await publisher(socialContent, credentials);
          }

          await convex.mutation(api.contentProjects.updatePublishStatus, {
            projectId: typedProjectId,
            platform,
            status: "published",
          });

          results[platform] = { success: true };
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`Failed to publish to ${platform}:`, errorMessage);

        if (
          platform === "twitter" ||
          platform === "linkedin" ||
          platform === "facebook" ||
          platform === "instagram"
        ) {
          await markConnectionFailure(userId, platform, errorMessage);
        }

        await convex.mutation(api.contentProjects.updatePublishStatus, {
          projectId: typedProjectId,
          platform,
          status: "draft",
          error: errorMessage,
        });

        results[platform] = { success: false, error: errorMessage };
      }
    });

    await Promise.allSettled(publishPromises);

    const successes = Object.values(results).filter((r) => r.success).length;
    const failures = Object.values(results).filter((r) => !r.success).length;

    console.log(`Publishing complete: ${successes} succeeded, ${failures} failed`);

    return {
      success: true,
      projectId,
      results,
      summary: {
        succeeded: successes,
        failed: failures,
      },
    };
  },
);
