"use client";

import { Sparkles, Clock } from "lucide-react";
import { Mode } from "@/lib/types";

interface GeneratingStateProps {
  mode: Mode;
  isPolling?: boolean;
  count?: number;
  aspectRatio?: string;
}

export function GeneratingState({
  mode,
  isPolling = false,
  count = 1,
  aspectRatio = "1:1",
}: GeneratingStateProps) {
  const [w, h] = aspectRatio.split(":").map(Number);
  const paddingBottom = `${(h / w) * 100}%`;

  if (mode === "video" || isPolling) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-2 border-purple-600/30 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-2 border-purple-600/50 flex items-center justify-center">
              <Sparkles size={24} className="text-purple-400 pulse-soft" />
            </div>
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-white font-medium">Generating your video</p>
          <p className="text-sm text-[#6b7280]">
            This may take a few minutes...
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#4b5563]">
            <Clock size={12} />
            <span>Usually 2–5 minutes</span>
          </div>
        </div>

        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-purple-500"
              style={{
                animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Image skeleton
  return (
    <div
      className={`grid gap-3 ${
        count === 1
          ? "grid-cols-1 max-w-lg mx-auto"
          : count === 2
          ? "grid-cols-2"
          : count === 3
          ? "grid-cols-3"
          : "grid-cols-2"
      }`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden">
          <div className="relative" style={{ paddingBottom }}>
            <div className="absolute inset-0 shimmer rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
