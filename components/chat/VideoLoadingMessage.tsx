"use client";

import { Sparkles } from "lucide-react";

export function VideoLoadingMessage() {
  return (
    <div className="flex items-center gap-4 py-4 px-1">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full border border-purple-500/30 flex items-center justify-center">
          <Sparkles size={16} className="text-purple-400 pulse-soft" />
        </div>
        <div className="absolute inset-0 rounded-full border border-purple-500 border-t-transparent animate-spin" />
      </div>
      <div>
        <p className="text-sm text-white font-medium">Generating video</p>
        <p className="text-xs text-[#6b7280] mt-0.5">This usually takes 2–5 minutes…</p>
      </div>
    </div>
  );
}
