"use client";

import { Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center h-14 px-4 border-b border-[#2a2b2e] flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-900/30">
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold text-white tracking-tight">
            Genius
          </span>
          <span className="text-[11px] text-purple-400 font-medium -mt-0.5">
            Imagine
          </span>
        </div>
      </div>
    </header>
  );
}
