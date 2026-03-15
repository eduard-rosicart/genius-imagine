import { NextRequest, NextResponse } from "next/server";

const ETERNALAI_API_KEY = process.env.ETERNALAI_API_KEY;
const BASE_URL = "https://open.eternalai.org";

/**
 * GET /api/eternalai/poll?id=xxx&type=image|video
 *
 * Polls EternalAI for the result of a generation request.
 *
 * - type=image (from generate-image / creative-ai) → polls creative-ai/result/image/{id}
 * - type=video or type=base (from base/generate)   → polls poll-result/{id}
 *
 * Always returns HTTP 200. Status field signals terminal states.
 *
 * Normalized response:
 *   { status: "pending"|"success"|"failed", result_url?: string, effect_type?: string, progress?: number }
 */
export async function GET(req: NextRequest) {
  if (!ETERNALAI_API_KEY) {
    return NextResponse.json({ error: "EternalAI API key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type") ?? "image"; // "image" | "video" | "base"

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    // Choose the correct poll endpoint
    const pollUrl = type === "image"
      ? `${BASE_URL}/creative-ai/result/image?request_id=${encodeURIComponent(id)}`
      : `${BASE_URL}/poll-result/${encodeURIComponent(id)}`;

    const response = await fetch(pollUrl, {
      method: "GET",
      headers: {
        "x-api-key": ETERNALAI_API_KEY,
        Accept: "application/json",
      },
    });

    const rawText = await response.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(rawText); } catch { /* ignore */ }

    if (!response.ok) {
      console.error(`[eternalai/poll] HTTP error ${response.status}:`, rawText);
      // Treat as terminal failure
      return NextResponse.json({
        status: "failed",
        error: data.message ?? data.error ?? `Poll failed with HTTP ${response.status}`,
      });
    }

    // Normalize status
    // EternalAI returns: "pending" | "success" | "failed" | "processing"
    const rawStatus = (data.status as string ?? "").toLowerCase();
    let normalizedStatus: "pending" | "success" | "failed" = "pending";
    if (rawStatus === "success") normalizedStatus = "success";
    else if (rawStatus === "failed" || rawStatus === "error") normalizedStatus = "failed";
    else normalizedStatus = "pending"; // "pending", "processing", etc.

    return NextResponse.json({
      status: normalizedStatus,
      result_url: data.result_url ?? data.result ?? null,
      effect_type: data.effect_type ?? type,
      progress: data.progress ?? 0,
      // Pass through request_id for correlation
      request_id: data.request_id ?? id,
    });
  } catch (err) {
    console.error("[eternalai/poll] internal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
