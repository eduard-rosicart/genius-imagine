"use client";

import { ImageSettings, VideoSettings, GeneratedImage, GeneratedVideo, AspectRatio } from "@/lib/types";
import type { Provider } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { useVideoPolling } from "./useVideoPolling";

// ─── xAI helpers (unchanged) ──────────────────────────────────────────────────

/** Generates 4 images synchronously via xAI */
export async function generateImagesXai(
  prompt: string,
  settings: ImageSettings,
  referenceImageUrl?: string
): Promise<GeneratedImage[]> {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      n: 4,
      aspect_ratio: settings.aspectRatio,
      resolution: settings.resolution,
      image: referenceImageUrl,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Image generation failed");

  return (data.urls as string[]).map((url: string) => ({
    url,
    aspectRatio: settings.aspectRatio,
  }));
}

/** Starts a video generation job via xAI, returns request_id */
export async function startVideoGenerationXai(
  prompt: string,
  settings: VideoSettings,
  imageUrl?: string,
  videoUrl?: string
): Promise<string> {
  const res = await fetch("/api/generate-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      duration: settings.duration,
      aspect_ratio: settings.aspectRatio,
      resolution: settings.resolution,
      image_url: imageUrl,
      video_url: videoUrl,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Video generation failed");
  return data.request_id as string;
}

// ─── EternalAI helpers ────────────────────────────────────────────────────────

/**
 * Launches 4 EternalAI text-to-image requests in parallel.
 * Returns an array of 4 request_ids for polling.
 */
export async function startImagesEternalAi(
  prompt: string
): Promise<string[]> {
  const requests = Array.from({ length: 4 }, () =>
    fetch("/api/eternalai/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "EternalAI image request failed");
      return data.request_id as string;
    })
  );

  // Use allSettled so one failure doesn't abort everything
  const results = await Promise.allSettled(requests);

  const ids = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map((r) => r.value);

  if (ids.length === 0) {
    throw new Error("All EternalAI image requests failed to start");
  }

  return ids;
}

/**
 * Starts an EternalAI image-to-video generation.
 * Requires at least one base image.
 * Returns request_id for polling.
 */
export async function startVideoEternalAi(
  prompt: string,
  imageUrl: string,
  duration?: number
): Promise<string> {
  const res = await fetch("/api/eternalai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      images: [imageUrl],
      prompt,
      type: "video",
      duration: duration ?? 3,
      audio: false,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "EternalAI video generation failed");

  // Fast-path: if already success
  if (data.status === "success" && data.result_url) {
    // Return a special sentinel so callers know it's already done
    return `__done__:${data.result_url}`;
  }

  return data.request_id as string;
}

/**
 * EternalAI image editing (image-to-image with prompt).
 * Returns request_id for polling.
 */
export async function startImageEditEternalAi(
  prompt: string,
  imageUrl: string
): Promise<string> {
  const res = await fetch("/api/eternalai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      images: [imageUrl],
      prompt,
      type: "image",
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "EternalAI image edit failed");

  if (data.status === "success" && data.result_url) {
    return `__done__:${data.result_url}`;
  }

  return data.request_id as string;
}

// ─── Unified entry points (used by page.tsx) ──────────────────────────────────

/**
 * Unified image generation dispatch.
 *
 * - xAI:       resolves immediately with 4 GeneratedImage[]
 * - EternalAI: resolves with { requestIds: string[] } for polling
 */
export async function generateImages(
  prompt: string,
  settings: ImageSettings,
  provider: Provider,
  referenceImageUrl?: string
): Promise<GeneratedImage[] | { requestIds: string[] }> {
  if (provider === "xai") {
    return generateImagesXai(prompt, settings, referenceImageUrl);
  }

  // EternalAI: if there's a reference image, use image-edit path (1 request → 1 result_id)
  // Otherwise, 4 parallel text-to-image requests
  if (referenceImageUrl) {
    const reqId = await startImageEditEternalAi(prompt, referenceImageUrl);
    if (reqId.startsWith("__done__:")) {
      const url = reqId.slice(9);
      return [{ url, aspectRatio: settings.aspectRatio }];
    }
    return { requestIds: [reqId] };
  }

  const requestIds = await startImagesEternalAi(prompt);
  return { requestIds };
}

/** Starts a video generation job, returns request_id */
export async function startVideoGeneration(
  prompt: string,
  settings: VideoSettings,
  provider: Provider,
  imageUrl?: string,
  videoUrl?: string
): Promise<string> {
  if (provider === "xai") {
    return startVideoGenerationXai(prompt, settings, imageUrl, videoUrl);
  }

  // EternalAI requires an image
  if (!imageUrl) {
    throw new Error(
      "EternalAI video generation requires a reference image. Select an image as Origin first."
    );
  }

  return startVideoEternalAi(prompt, imageUrl, Math.min(settings.duration, 5));
}

/** Builds a GeneratedVideo object from a completed poll */
export function buildGeneratedVideo(
  prompt: string,
  url: string,
  duration: number | null,
  settings: VideoSettings,
  aspectRatioOverride?: AspectRatio
): GeneratedVideo {
  return {
    id: generateId(),
    url,
    prompt,
    aspectRatio: aspectRatioOverride ?? settings.aspectRatio,
    resolution: settings.resolution,
    duration: duration ?? settings.duration,
    timestamp: Date.now(),
  };
}

export { useVideoPolling };
