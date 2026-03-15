"use client";

import { X, Image as ImageIcon, Film, Pin } from "lucide-react";
import { Origin } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OriginIndicatorProps {
  origin: Origin;
  onClear: () => void;
}

/** Returns true if the URL is a video source (not a previewable image) */
function isVideoUrl(url: string): boolean {
  if (!url) return true; // empty URL = treat as video fallback
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
    <div className="flex items-center gap-2 px-3 pt-3">
      <div className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-xl border min-w-0 flex-1",
        isVideo
          ? "bg-cyan-500/5 border-cyan-500/30"
          : "bg-blue-500/5 border-blue-500/20"
      )}>
        {/* Pin icon */}
        <Pin size={12} className={cn("flex-shrink-0", isVideo ? "text-cyan-400" : "text-blue-400")} />

        {/* Thumbnail */}
        <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-[#2a2b2e] flex items-center justify-center">
          {showImgFallback ? (
            /* Video origin without a captured frame — show icon */
            <Film size={16} className="text-cyan-400" />
          ) : (
            /* Image origin or captured frame */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={origin.thumbnailUrl}
              alt="Origin"
              className="w-full h-full object-cover"
            />
          )}
          {/* Type badge */}
          <div className={cn(
            "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-tl-md flex items-center justify-center",
            isVideo ? "bg-cyan-900/80" : "bg-blue-900/80"
          )}>
            {isVideo
              ? <Film size={7} className="text-cyan-300" />
              : <ImageIcon size={7} className="text-blue-300" />
            }
          </div>
        </div>

        {/* Label */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className={cn(
            "text-[10px] font-semibold uppercase tracking-wider leading-none mb-0.5",
            isVideo ? "text-cyan-500" : "text-blue-500"
          )}>
            Origin · {isVideo ? "video" : "image"}
          </span>
          <span className="text-xs text-[#d0d0d0] truncate leading-snug font-medium">
            {origin.label}
          </span>
        </div>

        {/* Clear */}
        <button
          onClick={onClear}
          className="flex-shrink-0 p-1 rounded-lg text-[#4b5563] hover:text-[#9ca3af] hover:bg-[#2a2b2e] transition-colors"
          title="Clear origin (will generate without reference)"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
