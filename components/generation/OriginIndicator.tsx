"use client";

import { X, Image as ImageIcon, Film, Pin } from "lucide-react";
import { Origin } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OriginIndicatorProps {
  origin: Origin;
  onClear: () => void;
}

function isVideoUrl(url: string): boolean {
  if (!url) return true;
  return (
    url.includes("vidgen.x.ai") ||
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.endsWith(".mov") ||
    (!url.startsWith("data:") && !url.startsWith("https://imgen") && url.includes(".x.ai/") && !url.includes("imgen"))
  );
}

export function OriginIndicator({ origin, onClear }: OriginIndicatorProps) {
  const isVideo = origin.type === "video-frame";
  const showImgFallback = isVideo && (!origin.thumbnailUrl || isVideoUrl(origin.thumbnailUrl));

  return (
    <div className="flex items-center gap-2 px-3 pt-2.5">
      <div className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-xl border min-w-0 flex-1",
        isVideo
          ? "bg-cyan-500/5 border-cyan-500/30"
          : "bg-blue-500/5 border-blue-500/20"
      )}>
        {/* Pin icon */}
        <Pin size={11} className={cn("flex-shrink-0", isVideo ? "text-cyan-400" : "text-blue-400")} />

        {/* Thumbnail */}
        <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-[#2a2b2e] flex items-center justify-center">
          {showImgFallback ? (
            <Film size={14} className="text-cyan-400" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={origin.thumbnailUrl}
              alt="Origin"
              className="w-full h-full object-cover"
            />
          )}
          {/* Type badge */}
          <div className={cn(
            "absolute bottom-0 right-0 w-3 h-3 rounded-tl-md flex items-center justify-center",
            isVideo ? "bg-cyan-900/80" : "bg-blue-900/80"
          )}>
            {isVideo
              ? <Film size={6} className="text-cyan-300" />
              : <ImageIcon size={6} className="text-blue-300" />
            }
          </div>
        </div>

        {/* Label */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className={cn(
            "text-[9px] font-semibold uppercase tracking-wider leading-none mb-0.5",
            isVideo ? "text-cyan-500" : "text-blue-500"
          )}>
            Origin · {isVideo ? "video" : "image"}
          </span>
          <span className="text-[11px] md:text-xs text-[#d0d0d0] truncate leading-snug font-medium">
            {origin.label}
          </span>
        </div>

        {/* Clear — large touch target */}
        <button
          onClick={onClear}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-[#4b5563] hover:text-[#9ca3af] active:text-[#9ca3af] hover:bg-[#2a2b2e] active:bg-[#2a2b2e] transition-colors"
          title="Clear origin"
          aria-label="Clear origin"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
