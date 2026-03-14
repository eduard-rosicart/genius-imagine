"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface PollResult {
  status: "pending" | "done" | "expired" | "failed";
  video_url: string | null;
  duration: number | null;
  moderated?: boolean;
  error?: string;
}

export type PollingStatus = "idle" | "polling" | "done" | "expired" | "failed" | "error";

export function useVideoPolling() {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<PollingStatus>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/video-status?id=${id}`);

      // video-status now always returns 200 — check the body for errors
      if (!res.ok) {
        // Only hit if our own route has a server error (5xx)
        setErrorMessage("Server error while checking video status");
        setStatus("error");
        stopPolling();
        return;
      }

      const data: PollResult = await res.json();

      if (data.status === "done") {
        setVideoUrl(data.video_url);
        setVideoDuration(data.duration ?? null);
        setStatus("done");
        stopPolling();
      } else if (data.status === "failed") {
        // Terminal failure from xAI (moderation, bad request, etc.)
        const msg = data.error ?? "Video generation failed";
        const isModerationError =
          msg.toLowerCase().includes("moderat") ||
          msg.toLowerCase().includes("policy") ||
          msg.toLowerCase().includes("content") ||
          data.moderated === false;

        setErrorMessage(
          isModerationError
            ? "Content blocked by moderation. Try adjusting your prompt."
            : `Generation failed: ${msg}`
        );
        setStatus("failed");
        stopPolling();
      } else if (data.status === "expired") {
        setErrorMessage("Video generation expired. Please try again.");
        setStatus("expired");
        stopPolling();
      }
      // "pending" → keep polling
    } catch (err) {
      console.error("[useVideoPolling] poll error:", err);
      setErrorMessage("Network error while checking video status");
      setStatus("error");
      stopPolling();
    }
  }, [stopPolling]);

  useEffect(() => {
    if (!requestId) return;

    setStatus("polling");
    setVideoUrl(null);
    setVideoDuration(null);
    setErrorMessage(null);

    // Poll immediately, then every 5 seconds
    poll(requestId);
    intervalRef.current = setInterval(() => poll(requestId), 5000);

    // Hard timeout at 10 minutes
    const timeout = setTimeout(() => {
      stopPolling();
      setErrorMessage("Video generation timed out after 10 minutes.");
      setStatus("expired");
    }, 10 * 60 * 1000);

    return () => {
      stopPolling();
      clearTimeout(timeout);
    };
  }, [requestId, poll, stopPolling]);

  const startPolling = useCallback((id: string) => {
    stopPolling();
    setRequestId(id);
  }, [stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setRequestId(null);
    setStatus("idle");
    setVideoUrl(null);
    setVideoDuration(null);
    setErrorMessage(null);
  }, [stopPolling]);

  return { status, videoUrl, videoDuration, errorMessage, startPolling, reset };
}
