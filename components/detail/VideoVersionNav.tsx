"use client";

import { useState } from "react";
import { GeneratedVideo } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VideoVersionNavProps {
  versions: GeneratedVideo[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function VideoVersionNav({ versions, activeIndex, onSelect }: VideoVersionNavProps) {
  const [hovered, setHovered] = useState(false);

  if (versions.length <= 1) return null;

  return (
    <div
      className="absolute left-0 top-0 bottom-0 flex items-center z-10"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover trigger zone */}
      <div className="w-10 h-full" />

      {/* Nav panel */}
      <div
        className={cn(
          "absolute left-2 flex flex-col gap-1.5 transition-all duration-200",
          hovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
        )}
      >
        {versions.map((v, i) => (
          <button
            key={v.id}
            onClick={() => onSelect(i)}
            title={`Version ${i + 1}`}
            className={cn(
              "group relative w-9 h-9 rounded-lg overflow-hidden border-2 transition-all",
              activeIndex === i
                ? "border-purple-500 shadow-lg shadow-purple-900/40"
                : "border-[#3a3b3e] hover:border-[#6b7280]"
            )}
          >
            <video
              src={v.url}
              muted
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
            />
            <div className={cn(
              "absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white",
              "bg-black/60 group-hover:bg-black/40 transition-colors"
            )}>
              v{i + 1}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
