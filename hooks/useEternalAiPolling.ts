"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Shared poll types ─────────────────────────────────────────────────────────

export type EternalAiPollStatus = "idle" | "polling" | "success" | "failed" | "error";

interface PollResult {
  status: "pending" | "success" | "failed";
  result_url: string | null;
  effect_type: string;
  progress: number;
  request_id: string;
}

async function pollOnce(id: string, type: "image" | "video"): Promise<PollResult> {
  const res = await fetch(`/api/eternalai/poll?id=${encodeURIComponent(id)}&type=${type}`);
  if (!res.ok) throw new Error(`Poll HTTP error ${res.status}`);
  return res.json();
}

// ─── Single-item polling (video) ──────────────────────────────────────────────

export interface SinglePollState {
  status: EternalAiPollStatus;
  resultUrl: string | null;
  errorMessage: string | null;
}

export function useEternalAiSinglePolling() {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [type, setType] = useState<"image" | "video">("video");
  const [status, setStatus] = useState<EternalAiPollStatus>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const poll = useCallback(async (id: string, t: "image" | "video") => {
    try {
      const data = await pollOnce(id, t);
      if (data.status === "success" && data.result_url) {
        setResultUrl(data.result_url);
        setStatus("success");
        stop();
      } else if (data.status === "failed") {
        setErrorMessage("Generation failed. Please try again.");
        setStatus("failed");
        stop();
      }
      // "pending" → keep polling
    } catch (err) {
      console.error("[useEternalAiSinglePolling] poll error:", err);
      setErrorMessage("Network error while checking status");
      setStatus("error");
      stop();
    }
  }, [stop]);

  useEffect(() => {
    if (!requestId) return;
    setStatus("polling");
    setResultUrl(null);
    setErrorMessage(null);

    poll(requestId, type);
    intervalRef.current = setInterval(() => poll(requestId, type), 3000);

    // 10-min timeout
    const timeout = setTimeout(() => {
      stop();
      setErrorMessage("Generation timed out after 10 minutes.");
      setStatus("failed");
    }, 10 * 60 * 1000);

    return () => { stop(); clearTimeout(timeout); };
  }, [requestId, type, poll, stop]);

  const start = useCallback((id: string, pollType: "image" | "video" = "video") => {
    stop();
    setType(pollType);
    setRequestId(id);
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setRequestId(null);
    setStatus("idle");
    setResultUrl(null);
    setErrorMessage(null);
  }, [stop]);

  return { status, resultUrl, errorMessage, start, reset };
}

// ─── Parallel polling (4 images) ──────────────────────────────────────────────

export interface ParallelPollItem {
  requestId: string;
  status: "pending" | "success" | "failed";
  resultUrl: string | null;
}

export type ParallelPollStatus = "idle" | "polling" | "done" | "failed" | "error";

/**
 * Polls up to N EternalAI image requests in parallel.
 * Emits individual item updates as they complete so the UI can show
 * images progressively (each slot loads independently).
 *
 * onItemUpdate(index, url) is called every time a slot resolves.
 * onAllDone(urls)          is called when every slot is settled.
 */
export function useEternalAiParallelPolling() {
  const [overallStatus, setOverallStatus] = useState<ParallelPollStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const intervalsRef = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());
  const itemsRef = useRef<ParallelPollItem[]>([]);
  const onItemUpdateRef = useRef<((index: number, url: string) => void) | null>(null);
  const onAllDoneRef = useRef<((urls: string[]) => void) | null>(null);

  const stopAll = useCallback(() => {
    intervalsRef.current.forEach((iv) => clearInterval(iv));
    intervalsRef.current.clear();
  }, []);

  const checkAllDone = useCallback(() => {
    const items = itemsRef.current;
    const allSettled = items.every((it) => it.status !== "pending");
    if (!allSettled) return;

    const allFailed = items.every((it) => it.status === "failed");
    if (allFailed) {
      setOverallStatus("failed");
      setErrorMessage("All image generations failed. Please try again.");
    } else {
      setOverallStatus("done");
      const urls = items.map((it) => it.resultUrl ?? "").filter(Boolean);
      onAllDoneRef.current?.(urls);
    }
  }, []);

  const pollItem = useCallback(async (index: number) => {
    const item = itemsRef.current[index];
    if (!item || item.status !== "pending") return;

    try {
      const data = await pollOnce(item.requestId, "image");

      if (data.status === "success" && data.result_url) {
        itemsRef.current[index] = { ...item, status: "success", resultUrl: data.result_url };
        // Stop polling this specific slot
        const iv = intervalsRef.current.get(index);
        if (iv) { clearInterval(iv); intervalsRef.current.delete(index); }
        onItemUpdateRef.current?.(index, data.result_url);
        checkAllDone();
      } else if (data.status === "failed") {
        itemsRef.current[index] = { ...item, status: "failed" };
        const iv = intervalsRef.current.get(index);
        if (iv) { clearInterval(iv); intervalsRef.current.delete(index); }
        checkAllDone();
      }
      // "pending" → keep polling this slot
    } catch (err) {
      console.error(`[useEternalAiParallelPolling] poll error slot ${index}:`, err);
      itemsRef.current[index] = { ...item, status: "failed" };
      const iv = intervalsRef.current.get(index);
      if (iv) { clearInterval(iv); intervalsRef.current.delete(index); }
      checkAllDone();
    }
  }, [checkAllDone]);

  const start = useCallback((
    requestIds: string[],
    callbacks: {
      onItemUpdate: (index: number, url: string) => void;
      onAllDone: (urls: string[]) => void;
    }
  ) => {
    stopAll();
    onItemUpdateRef.current = callbacks.onItemUpdate;
    onAllDoneRef.current = callbacks.onAllDone;

    itemsRef.current = requestIds.map((id) => ({
      requestId: id,
      status: "pending",
      resultUrl: null,
    }));

    setOverallStatus("polling");
    setErrorMessage(null);

    // Poll each slot independently, staggered by 500ms to avoid burst
    requestIds.forEach((_, index) => {
      // First poll immediately (staggered)
      setTimeout(() => pollItem(index), index * 300);
      // Then every 3s
      const iv = setInterval(() => pollItem(index), 3000);
      intervalsRef.current.set(index, iv);
    });

    // 5-min timeout for images
    setTimeout(() => {
      const stillPending = itemsRef.current.some((it) => it.status === "pending");
      if (stillPending) {
        stopAll();
        // Mark pending ones as failed
        itemsRef.current = itemsRef.current.map((it) =>
          it.status === "pending" ? { ...it, status: "failed" } : it
        );
        checkAllDone();
      }
    }, 5 * 60 * 1000);
  }, [stopAll, pollItem, checkAllDone]);

  const reset = useCallback(() => {
    stopAll();
    itemsRef.current = [];
    setOverallStatus("idle");
    setErrorMessage(null);
    onItemUpdateRef.current = null;
    onAllDoneRef.current = null;
  }, [stopAll]);

  return { overallStatus, errorMessage, start, reset };
}
