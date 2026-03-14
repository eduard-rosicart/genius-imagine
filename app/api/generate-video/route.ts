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

    // xAI only accepts ONE of: image OR video — never both.
    // Priority: if a video URL is provided, use video editing mode.
    // Otherwise, if an image URL is provided, use image-to-video mode.
    if (video_url) {
      genBody.video = { url: video_url, type: "video_url" };
    } else if (image_url) {
      genBody.image = { url: image_url, type: "image_url" };
    }
    // If neither: pure text-to-video

    console.log("[generate-video] body keys:", Object.keys(genBody));

    const response = await fetch(`${XAI_BASE_URL}/videos/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify(genBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generate-video] xAI error:", response.status, errorText);
      let errorMsg = "Video generation failed";
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error?.message ?? errorJson.message ?? errorJson.error ?? errorMsg;
      } catch {
        errorMsg = errorText || errorMsg;
      }
      return NextResponse.json(
        { error: errorMsg, status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ request_id: data.request_id });
  } catch (err) {
    console.error("[generate-video] internal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
