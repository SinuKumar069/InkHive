import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { inngest } from "@/inngest/client";
import { isSocialPlatform } from "@/lib/integrations/platforms";

const requestSchema = z.object({
  projectId: z.string(),
  platforms: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  try {
    const authData = await auth();
    if (!authData.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const convexToken = await authData.getToken({ template: "convex" });
    if (!convexToken) {
      return Response.json({ error: "Missing Convex auth token" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const requestedPlatforms = parsed.data.platforms.filter(isSocialPlatform);
    if (requestedPlatforms.length === 0) {
      return Response.json(
        { error: "No supported social platforms selected" },
        { status: 400 },
      );
    }

    const project = await fetchQuery(
      api.contentProjects.getProject,
      { projectId: parsed.data.projectId as Id<"contentProjects"> },
      { token: convexToken },
    );

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const connections = await fetchQuery(
      api.connectedAccounts.listMyConnections,
      {},
      { token: convexToken },
    );

    const connected = new Set(
      connections
        .filter(
          (connection: Doc<"connectedAccounts">) =>
            connection.status === "connected",
        )
        .map((connection: Doc<"connectedAccounts">) => connection.platform),
    );

    const disconnected = requestedPlatforms.filter(
      (platform) => !connected.has(platform),
    );

    if (disconnected.length > 0) {
      return Response.json(
        {
          error: "Some platforms are not connected",
          disconnected,
        },
        { status: 400 },
      );
    }

    await inngest.send({
      name: "content/publish",
      data: {
        projectId: parsed.data.projectId,
        platforms: requestedPlatforms,
        userId: authData.userId,
      },
    });

    return Response.json({
      success: true,
      projectId: parsed.data.projectId,
      platforms: requestedPlatforms,
    });
  } catch (error) {
    console.error("Error triggering publish workflow:", error);
    return Response.json(
      { error: "Failed to trigger publish workflow" },
      { status: 500 },
    );
  }
}
