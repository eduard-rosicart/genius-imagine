"use client";

import { GeneratedVideo } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VideoVersionNavProps {
  versions: GeneratedVideo[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Vertical strip shown to the RIGHT of the video player.
 * Visible whenever there is at least 1 version.
 * Shows each version as a video-thumbnail button with a version label.
 */
export function VideoVersionNav({ versions, activeIndex, onSelect }: VideoVersionNavProps) {
  // Always show when we have versions (even just 1 — it's the reference snap)
  if (!versions.length) return null;

  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto shrink-0" style={{ maxHeight: 400 }}>
      {versions.map((v, i) => (
        <button
          key={v.id}
          onClick={() => onSelect(i)}
          title={`Version ${i + 1}`}
          disabled={versions.length === 1}
          className={cn(
            "relative w-10 rounded-lg overflow-hidden border-2 transition-all shrink-0",
            // Aspect ratio comes from the video's own ratio stored in metadata
            activeIndex === i
              ? "border-purple-500 shadow-lg shadow-purple-900/50"
              : "border-[#3a3b3e] hover:border-[#6b7280]",
            versions.length === 1 && "cursor-default opacity-80"
          )}
          style={{ aspectRatio: "9/16" }}
        >
          {/* Video frame — preload metadata so browser grabs the first frame */}
          <video
            src={v.url}
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Dark gradient + version label at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-0.5">
            <span className="text-[8px] font-bold text-white leading-none tracking-wide">
              v{i + 1}
            </span>
          </div>

          {/* Active ring */}
          {activeIndex === i && (
            <div className="absolute inset-0 ring-1 ring-inset ring-purple-400/50 rounded-lg pointer-events-none" />
          )}
        </button>
      ))}
    </div>
  );
}
