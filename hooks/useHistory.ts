"use client";

import { useState, useEffect, useCallback } from "react";
import { HistoryItem } from "@/lib/types";
import {
  getHistory,
  addToHistory,
  clearHistory,
  removeFromHistory,
} from "@/lib/storage";

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const add = useCallback((item: HistoryItem) => {
    addToHistory(item);
    setHistory(getHistory());
  }, []);

  const remove = useCallback((id: string) => {
    removeFromHistory(id);
    setHistory(getHistory());
  }, []);

  const clear = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  return { history, add, remove, clear };
}
