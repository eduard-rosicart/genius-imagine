import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function getAspectRatioDimensions(ratio: string): {
  width: number;
  height: number;
} {
  const [w, h] = ratio.split(":").map(Number);
  const base = 400;
  if (w >= h) {
    return { width: base, height: Math.round((base * h) / w) };
  }
  return { width: Math.round((base * w) / h), height: base };
}

export function getAspectRatioPaddingBottom(ratio: string): string {
  const [w, h] = ratio.split(":").map(Number);
  return `${(h / w) * 100}%`;
}
