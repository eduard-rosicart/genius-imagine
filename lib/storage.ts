import { Thread } from "./types";

const STORAGE_KEY = "genius-imagine-threads";
const MAX_THREADS = 50;

export function getThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Thread[];
  } catch {
    return [];
  }
}

export function saveThread(thread: Thread): void {
  if (typeof window === "undefined") return;
  try {
    const threads = getThreads();
    const idx = threads.findIndex((t) => t.id === thread.id);
    if (idx >= 0) {
      threads[idx] = thread;
    } else {
      threads.unshift(thread);
    }
    const trimmed = threads.slice(0, MAX_THREADS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export function deleteThread(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const threads = getThreads().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {
    // ignore
  }
}

export function clearAllThreads(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
