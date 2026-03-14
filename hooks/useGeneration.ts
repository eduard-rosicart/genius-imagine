"use client";

import { useCallback } from "react";
import { ImageSettings, VideoSettings, GeneratedImage, GeneratedVideo, AspectRatio } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { useVideoPolling } from "./useVideoPolling";

/** Generates 4 images via the API */
export async function generateImages(
  prompt: string,
  settings: ImageSettings,
  uploadedImage?: string
): Promise<GeneratedImage[]> {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      n: 4,
      aspect_ratio: settings.aspectRatio,
      resolution: settings.resolution,
      image: uploadedImage,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Image generation failed");

  return (data.urls as string[]).map((url: string) => ({
    url,
    aspectRatio: settings.aspectRatio,
  }));
}

/** Starts a video generation job, returns request_id */
export async function startVideoGeneration(
  prompt: string,
  settings: VideoSettings,
  uploadedImage?: string,
  sourceVideoUrl?: string
): Promise<string> {
  const res = await fetch("/api/generate-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      duration: settings.duration,
      aspect_ratio: settings.aspectRatio,
      resolution: settings.resolution,
      image_url: uploadedImage,
      video_url: sourceVideoUrl,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Video generation failed");
  return data.request_id as string;
}

/** Builds a GeneratedVideo object from a completed poll */
export function buildGeneratedVideo(
  prompt: string,
  url: string,
  duration: number | null,
  settings: VideoSettings
): GeneratedVideo {
  return {
    id: generateId(),
    url,
    prompt,
    aspectRatio: settings.aspectRatio,
    resolution: settings.resolution,
    duration: duration ?? settings.duration,
    timestamp: Date.now(),
  };
}

export { useVideoPolling };
