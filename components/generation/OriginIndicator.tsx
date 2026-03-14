"use client";

import { X, Image as ImageIcon, Film } from "lucide-react";
import { Origin } from "@/lib/types";

interface OriginIndicatorProps {
  origin: Origin;
  onClear: () => void;
}

/**
 * Shows the currently active origin (source asset) above the prompt textarea.
 * Displays a thumbnail + label + clear button.
 */
export function OriginIndicator({ origin, onClear }: OriginIndicatorProps) {
  const isVideo = origin.type === "video-frame";
  const Icon = isVideo ? Film : ImageIcon;
  const iconColor = isVideo ? "text-purple-400" : "text-blue-400";

  return (
    <div className="flex items-center gap-2 px-3 pt-3">
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#1e1f22] border border-[#3a3b3e] min-w-0">
        {/* Thumbnail */}
        <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-[#2a2b2e]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={origin.thumbnailUrl}
            alt="Origin"
            className="w-full h-full object-cover"
          />
          {/* Type badge overlay */}
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-tl-md bg-[#1e1f22] flex items-center justify-center">
            <Icon size={8} className={iconColor} />
          </div>
        </div>

        {/* Label */}
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-medium text-[#6b7280] uppercase tracking-wider leading-none mb-0.5">
            Origin
          </span>
          <span className="text-xs text-[#c9caca] truncate leading-none">
            {origin.label}
          </span>
        </div>

        {/* Clear */}
        <button
          onClick={onClear}
          className="ml-1 flex-shrink-0 text-[#4b5563] hover:text-[#9ca3af] transition-colors"
          title="Clear origin"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
