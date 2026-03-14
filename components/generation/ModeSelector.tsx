"use client";

import { Image as ImageIcon, Film } from "lucide-react";
import { Mode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ModeSelectorProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1a1b1e] border border-[#2a2b2e]">
      <button
        onClick={() => onChange("image")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
          mode === "image"
            ? "bg-[#2a2b2e] text-white shadow"
            : "text-[#6b7280] hover:text-[#9ca3af]"
        )}
      >
        <ImageIcon size={14} />
        Image
      </button>
      <button
        onClick={() => onChange("video")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
          mode === "video"
            ? "bg-[#2a2b2e] text-white shadow"
            : "text-[#6b7280] hover:text-[#9ca3af]"
        )}
      >
        <Film size={14} />
        Video
      </button>
    </div>
  );
}
