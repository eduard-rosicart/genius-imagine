"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface PollResult {
  status: "pending" | "done" | "expired";
  video_url: string | null;
  duration: number | null;
}

export function useVideoPolling() {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "polling" | "done" | "expired" | "error">("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
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
      if (!res.ok) {
        setStatus("error");
        stopPolling();
        return;
      }
      const data: PollResult = await res.json();

      if (data.status === "done") {
        setVideoUrl(data.video_url);
        setVideoDuration(data.duration);
        setStatus("done");
        stopPolling();
      } else if (data.status === "expired") {
        setStatus("expired");
        stopPolling();
      }
    } catch {
      setStatus("error");
      stopPolling();
    }
  }, [stopPolling]);

  useEffect(() => {
    if (!requestId) return;

    setStatus("polling");
    setVideoUrl(null);
    setVideoDuration(null);

    // Poll immediately, then every 5 seconds
    poll(requestId);
    intervalRef.current = setInterval(() => poll(requestId), 5000);

    // Timeout after 10 minutes
    const timeout = setTimeout(() => {
      stopPolling();
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
  }, [stopPolling]);

  return { status, videoUrl, videoDuration, startPolling, reset };
}
