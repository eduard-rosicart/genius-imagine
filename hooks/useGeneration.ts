"use client";

import { useState, useCallback } from "react";
import {
  Mode,
  GenerationStatus,
  ImageSettings,
  VideoSettings,
  HistoryItem,
} from "@/lib/types";
import { generateId } from "@/lib/utils";
import { useVideoPolling } from "./useVideoPolling";

interface UseGenerationReturn {
  status: GenerationStatus;
  imageUrls: string[];
  videoUrl: string | null;
  videoPollingStatus: string;
  error: string | null;
  currentPrompt: string;
  currentMode: Mode;
  generateImages: (
    prompt: string,
    settings: ImageSettings,
    uploadedImage?: string
  ) => Promise<HistoryItem | null>;
  generateVideo: (
    prompt: string,
    settings: VideoSettings,
    uploadedImage?: string
  ) => Promise<void>;
  reset: () => void;
}

export function useGeneration(): UseGenerationReturn {
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentMode, setCurrentMode] = useState<Mode>("image");

  const {
    status: pollingStatus,
    videoUrl,
    startPolling,
    reset: resetPolling,
  } = useVideoPolling();

  const reset = useCallback(() => {
    setStatus("idle");
    setImageUrls([]);
    setError(null);
    setCurrentPrompt("");
    resetPolling();
  }, [resetPolling]);

  const generateImages = useCallback(
    async (
      prompt: string,
      settings: ImageSettings,
      uploadedImage?: string
    ): Promise<HistoryItem | null> => {
      setStatus("loading");
      setImageUrls([]);
      setError(null);
      setCurrentPrompt(prompt);
      setCurrentMode("image");

      try {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            n: settings.n,
            aspect_ratio: settings.aspectRatio,
            resolution: settings.resolution,
            image: uploadedImage,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Image generation failed");
        }

        setImageUrls(data.urls);
        setStatus("done");

        const historyItem: HistoryItem = {
          id: generateId(),
          mode: "image",
          prompt,
          timestamp: Date.now(),
          thumbnail: data.urls[0],
          images: data.urls.map((url: string) => ({
            url,
            prompt,
            timestamp: Date.now(),
            aspectRatio: settings.aspectRatio,
          })),
        };

        return historyItem;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        setStatus("error");
        return null;
      }
    },
    []
  );

  const generateVideo = useCallback(
    async (
      prompt: string,
      settings: VideoSettings,
      uploadedImage?: string
    ): Promise<void> => {
      setStatus("loading");
      setError(null);
      setCurrentPrompt(prompt);
      setCurrentMode("video");

      try {
        const res = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            duration: settings.duration,
            aspect_ratio: settings.aspectRatio,
            resolution: settings.resolution,
            image_url: uploadedImage,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Video generation failed");
        }

        setStatus("polling");
        startPolling(data.request_id);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        setStatus("error");
      }
    },
    [startPolling]
  );

  // Sync polling status to main status
  const finalStatus =
    status === "polling"
      ? pollingStatus === "done"
        ? "done"
        : pollingStatus === "expired" || pollingStatus === "error"
        ? "error"
        : "polling"
      : status;

  return {
    status: finalStatus as GenerationStatus,
    imageUrls,
    videoUrl,
    videoPollingStatus: pollingStatus,
    error,
    currentPrompt,
    currentMode,
    generateImages,
    generateVideo,
    reset,
  };
}
