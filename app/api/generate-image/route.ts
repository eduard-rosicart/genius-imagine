import { NextRequest, NextResponse } from "next/server";

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = "https://api.x.ai/v1";

export async function POST(req: NextRequest) {
  if (!XAI_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { prompt, n = 4, aspect_ratio, resolution, image } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // If image is provided, use the edits endpoint
    if (image) {
      const editBody: Record<string, unknown> = {
        model: "grok-imagine-image",
        prompt,
        image: {
          url: image,
          type: "image_url",
        },
      };

      if (aspect_ratio) editBody.aspect_ratio = aspect_ratio;
      if (resolution) editBody.resolution = resolution;

      const response = await fetch(`${XAI_BASE_URL}/images/edits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify(editBody),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("xAI image edit error:", error);
        return NextResponse.json(
          { error: "Image generation failed", details: error },
          { status: response.status }
        );
      }

      const data = await response.json();
      const urls = data.data?.map((img: { url?: string; b64_json?: string }) =>
        img.url || (img.b64_json ? `data:image/jpeg;base64,${img.b64_json}` : null)
      ).filter(Boolean) || [];

      return NextResponse.json({ urls });
    }

    // Text-to-image generation
    const genBody: Record<string, unknown> = {
      model: "grok-imagine-image",
      prompt,
      n,
    };

    if (aspect_ratio) genBody.aspect_ratio = aspect_ratio;
    if (resolution) genBody.resolution = resolution;

    const response = await fetch(`${XAI_BASE_URL}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify(genBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("xAI image generation error:", error);
      return NextResponse.json(
        { error: "Image generation failed", details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    const urls = data.data?.map((img: { url?: string; b64_json?: string }) =>
      img.url || (img.b64_json ? `data:image/jpeg;base64,${img.b64_json}` : null)
    ).filter(Boolean) || [];

    return NextResponse.json({ urls });
  } catch (err) {
    console.error("Generate image error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
