"use client";

import { useState, useEffect, useCallback } from "react";
import { Thread, ChatMessage } from "@/lib/types";
import { getThreads, saveThread, deleteThread, clearAllThreads } from "@/lib/storage";

export function useThreads() {
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    setThreads(getThreads());
  }, []);

  const refresh = useCallback(() => {
    setThreads(getThreads());
  }, []);

  const upsertThread = useCallback((thread: Thread) => {
    saveThread(thread);
    setThreads(getThreads());
  }, []);

  const removeThread = useCallback((id: string) => {
    deleteThread(id);
    setThreads(getThreads());
  }, []);

  const clearAll = useCallback(() => {
    clearAllThreads();
    setThreads([]);
  }, []);

  /** Append a message to an existing thread */
  const addMessage = useCallback(
    (threadId: string, message: ChatMessage) => {
      const all = getThreads();
      const idx = all.findIndex((t) => t.id === threadId);
      if (idx < 0) return;
      const updated: Thread = {
        ...all[idx],
        messages: [...all[idx].messages, message],
        updatedAt: Date.now(),
      };
      saveThread(updated);
      setThreads(getThreads());
      return updated;
    },
    []
  );

  /** Replace a message (e.g. loading -> result) */
  const replaceMessage = useCallback(
    (threadId: string, messageId: string, message: ChatMessage) => {
      const all = getThreads();
      const idx = all.findIndex((t) => t.id === threadId);
      if (idx < 0) return;
      const updated: Thread = {
        ...all[idx],
        messages: all[idx].messages.map((m) =>
          m.id === messageId ? message : m
        ),
        updatedAt: Date.now(),
      };
      // Update thumbnail from first image result
      if (message.type === "image-result" && !updated.thumbnail) {
        updated.thumbnail = message.images[0]?.url;
      }
      saveThread(updated);
      setThreads(getThreads());
      return updated;
    },
    []
  );

  return {
    threads,
    refresh,
    upsertThread,
    removeThread,
    clearAll,
    addMessage,
    replaceMessage,
  };
}
