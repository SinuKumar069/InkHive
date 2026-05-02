import { inngest } from "@/inngest/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      projectId,
      inputType,
      inputContent,
      generationMode = "grounded",
      researchEnabled = true,
    } = body;

    // Send event to Inngest
    await inngest.send({
      name: "content/generate",
      data: {
        projectId,
        inputType,
        inputContent,
        generationMode,
        researchEnabled,
      },
    });

    return Response.json({ success: true, projectId });
  } catch (error) {
    console.error("Error triggering Inngest:", error);
    return Response.json(
      { error: "Failed to trigger content generation" },
      { status: 500 },
    );
  }
}
