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
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("xAI video status error:", error);
      return NextResponse.json(
        { error: "Failed to get video status", details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      status: data.status,
      video_url: data.video?.url ?? null,
      duration: data.video?.duration ?? null,
    });
  } catch (err) {
    console.error("Video status error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
