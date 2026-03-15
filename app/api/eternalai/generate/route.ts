import { NextRequest, NextResponse } from "next/server";

const ETERNALAI_API_KEY = process.env.ETERNALAI_API_KEY;
const BASE_URL = "https://open.eternalai.org";

/**
 * POST /api/eternalai/generate
 *
 * Image editing and image-to-video via EternalAI "Generation with Advanced Custom" API.
 * Always requires at least one input image.
 * Returns { request_id } — client polls /api/eternalai/poll?id=xxx&type=image|video.
 *
 * Body:
 *   {
 *     images: string[],          // array of URLs or base64 data URIs
 *     prompt: string,
 *     type: "image" | "video",
 *     duration?: number,         // 1-5 (video only)
 *     audio?: boolean,           // video only, default true
 *   }
 */
export async function POST(req: NextRequest) {
  if (!ETERNALAI_API_KEY) {
    return NextResponse.json({ error: "EternalAI API key not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { images, prompt, type, duration, audio } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "At least one input image is required" }, { status: 400 });
    }
    if (!type || (type !== "image" && type !== "video")) {
      return NextResponse.json({ error: "type must be 'image' or 'video'" }, { status: 400 });
    }

    const payload: Record<string, unknown> = { images, prompt, type };

    if (type === "video") {
      if (duration !== undefined) payload.duration = duration;
      payload.audio = audio ?? false;
    }

    const response = await fetch(`${BASE_URL}/base/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ETERNALAI_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(rawText); } catch { /* ignore */ }

    if (!response.ok) {
      console.error("[eternalai/generate] error:", response.status, rawText);
      return NextResponse.json(
        { error: data.message ?? data.error ?? "EternalAI generation failed", details: rawText },
        { status: response.status }
      );
    }

    // If response already has status=success with result_url (sync fast path)
    if (data.status === "success" && data.result_url) {
      return NextResponse.json({
        request_id: data.request_id,
        status: "success",
        result_url: data.result_url,
        effect_type: data.effect_type ?? type,
      });
    }

    return NextResponse.json({ request_id: data.request_id });
  } catch (err) {
    console.error("[eternalai/generate] internal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
