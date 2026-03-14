"use client";

import { Image as ImageIcon, Film } from "lucide-react";
import { Mode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

/**
 * Floating pill button in the top-right of the chat area.
 * Lets the user switch between Image and Video generation flows.
 */
export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-0.5 p-1 rounded-xl bg-[#1a1b1e]/90 backdrop-blur-sm border border-[#2a2b2e] shadow-lg">
      <button
        onClick={() => onChange("image")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          mode === "image"
            ? "bg-[#2a2b2e] text-white shadow-sm"
            : "text-[#6b7280] hover:text-[#9ca3af]"
        )}
      >
        <ImageIcon size={13} />
        Image
      </button>
      <button
        onClick={() => onChange("video")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          mode === "video"
            ? "bg-[#2a2b2e] text-white shadow-sm"
            : "text-[#6b7280] hover:text-[#9ca3af]"
        )}
      >
        <Film size={13} />
        Video
      </button>
    </div>
  );
}
