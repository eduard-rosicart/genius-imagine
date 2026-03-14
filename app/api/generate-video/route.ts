import { NextRequest, NextResponse } from "next/server";

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = "https://api.x.ai/v1";

export async function POST(req: NextRequest) {
  if (!XAI_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { prompt, duration, aspect_ratio, resolution, image_url, video_url } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const genBody: Record<string, unknown> = {
      model: "grok-imagine-video",
      prompt,
    };

    if (duration) genBody.duration = duration;
    if (aspect_ratio) genBody.aspect_ratio = aspect_ratio;
    if (resolution) genBody.resolution = resolution;
    if (image_url) genBody.image = { url: image_url, type: "image_url" };
    if (video_url) genBody.video = { url: video_url, type: "video_url" };

    const response = await fetch(`${XAI_BASE_URL}/videos/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify(genBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("xAI video generation error:", error);
      return NextResponse.json(
        { error: "Video generation failed", details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ request_id: data.request_id });
  } catch (err) {
    console.error("Generate video error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
