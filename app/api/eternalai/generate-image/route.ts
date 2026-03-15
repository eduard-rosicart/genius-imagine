import { NextRequest, NextResponse } from "next/server";

const ETERNALAI_API_KEY = process.env.ETERNALAI_API_KEY;
const BASE_URL = "https://open.eternalai.org";

/**
 * POST /api/eternalai/generate-image
 *
 * Text-to-image via EternalAI Legacy API.
 * Launches one async request and returns { request_id }.
 * Client polls /api/eternalai/poll?id=xxx&type=image for the result.
 *
 * Body: { prompt: string, lora_config?: Record<string,number> }
 */
export async function POST(req: NextRequest) {
  if (!ETERNALAI_API_KEY) {
    return NextResponse.json({ error: "EternalAI API key not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { prompt, lora_config } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
      type: "new",
    };

    if (lora_config && Object.keys(lora_config).length > 0) {
      payload.lora_config = lora_config;
    }

    const response = await fetch(`${BASE_URL}/creative-ai/image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": ETERNALAI_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(rawText); } catch { /* ignore */ }

    if (!response.ok) {
      console.error("[eternalai/generate-image] error:", response.status, rawText);
      return NextResponse.json(
        { error: data.message ?? data.error ?? "EternalAI image generation failed", details: rawText },
        { status: response.status }
      );
    }

    // Response: { request_id, status: "pending", result: "", progress: 0 }
    return NextResponse.json({ request_id: data.request_id });
  } catch (err) {
    console.error("[eternalai/generate-image] internal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
