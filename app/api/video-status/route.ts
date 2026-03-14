import { NextRequest, NextResponse } from "next/server";

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = "https://api.x.ai/v1";

export async function GET(req: NextRequest) {
  if (!XAI_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get("id");

  if (!requestId) {
    return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`${XAI_BASE_URL}/videos/${requestId}`, {
      headers: { Authorization: `Bearer ${XAI_API_KEY}` },
    });

    // Parse body regardless of status code so we can extract error details
    const rawText = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      // not JSON — use raw text as error detail
    }

    if (!response.ok) {
      console.error("[video-status] xAI error:", response.status, rawText);

      // Extract a human-readable error message
      const detail =
        (data.error as Record<string, unknown>)?.message as string ??
        data.message as string ??
        data.error as string ??
        rawText ??
        "Unknown error";

      // Treat 400 / 404 as a terminal failure so the client stops polling
      return NextResponse.json(
        {
          status: "failed",
          error: detail,
          http_status: response.status,
        },
        { status: 200 } // Return 200 so the polling client reads the body
      );
    }

    const videoStatus = data.status as string;
    const videoUrl = (data.video as Record<string, unknown>)?.url as string ?? null;
    const duration = (data.video as Record<string, unknown>)?.duration as number ?? null;
    const moderated = (data.video as Record<string, unknown>)?.respect_moderation as boolean ?? true;

    return NextResponse.json({
      status: videoStatus,         // "pending" | "done" | "expired" | "failed"
      video_url: videoUrl,
      duration,
      moderated,
    });
  } catch (err) {
    console.error("[video-status] internal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
