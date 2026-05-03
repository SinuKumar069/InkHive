import { inngest } from "@/inngest/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return Response.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    // Send cancel event to Inngest — this triggers cancelOn in the content pipeline
    await inngest.send({
      name: "content/cancel",
      data: { projectId },
    });

    return Response.json({ success: true, projectId });
  } catch (error) {
    console.error("Error sending cancel event:", error);
    return Response.json(
      { error: "Failed to cancel content generation" },
      { status: 500 },
    );
  }
}
