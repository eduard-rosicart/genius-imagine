"use client";

import { Sparkles, Menu, Plus } from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewThread: () => void;
}

export function Header({ onToggleSidebar, onNewThread }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-3 border-b border-[#2a2b2e] flex-shrink-0 bg-[#1e1f22]">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2b2e] transition-colors"
          title="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold text-white tracking-tight">
            Genius <span className="text-purple-400 font-medium">Imagine</span>
          </span>
        </div>
      </div>

      <button
        onClick={onNewThread}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[#9ca3af] hover:text-white hover:bg-[#2a2b2e] text-sm transition-colors border border-transparent hover:border-[#3a3b3e]"
        title="New thread"
      >
        <Plus size={15} />
        <span className="hidden sm:inline">New</span>
      </button>
    </header>
  );
}
