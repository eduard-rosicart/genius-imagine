"use client";

import { GeneratedVideo } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VideoVersionNavProps {
  versions: GeneratedVideo[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Vertical strip on the RIGHT side of the video player.
 * Always visible when there's more than 1 version.
 * Each item shows a video snapshot thumbnail + version label.
 */
export function VideoVersionNav({ versions, activeIndex, onSelect }: VideoVersionNavProps) {
  if (versions.length <= 1) return null;

  return (
    <div className="flex flex-col gap-1.5 pl-2 overflow-y-auto max-h-full py-0.5">
      {versions.map((v, i) => (
        <button
          key={v.id}
          onClick={() => onSelect(i)}
          title={`Version ${i + 1}`}
          className={cn(
            "group relative w-11 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
            "aspect-[9/16]",           // default thumbnail shape; video scales inside
            activeIndex === i
              ? "border-purple-500 shadow-lg shadow-purple-900/50"
              : "border-[#3a3b3e] hover:border-[#6b7280] opacity-60 hover:opacity-100"
          )}
        >
          {/* Video thumbnail */}
          <video
            src={v.url}
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Overlay with version number */}
          <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/80 to-transparent pb-1">
            <span className="text-[9px] font-bold text-white leading-none">
              v{i + 1}
            </span>
          </div>
          {/* Active ring glow */}
          {activeIndex === i && (
            <div className="absolute inset-0 ring-1 ring-inset ring-purple-400/40 rounded-lg" />
          )}
        </button>
      ))}
    </div>
  );
}
