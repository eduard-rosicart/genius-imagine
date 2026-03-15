"use client";

import { Sparkles, Menu, Plus, X } from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewThread: () => void;
  sidebarOpen?: boolean;
}

export function Header({ onToggleSidebar, onNewThread, sidebarOpen }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-3 border-b border-[#2a2b2e] flex-shrink-0 bg-[#1e1f22] z-30"
      style={{
        height: "calc(var(--header-height) + var(--safe-top))",
        paddingTop: "var(--safe-top)",
      }}
    >
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleSidebar}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2b2e] active:bg-[#333438] transition-colors"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen
            ? <X size={18} />
            : <Menu size={18} />
          }
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-900/30 flex-shrink-0">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold text-white tracking-tight hidden xs:inline sm:inline">
            Genius <span className="text-purple-400 font-medium">Imagine</span>
          </span>
        </div>
      </div>

      {/* Right: new thread */}
      <button
        onClick={onNewThread}
        className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-[#9ca3af] hover:text-white hover:bg-[#2a2b2e] active:bg-[#333438] text-sm transition-colors border border-transparent hover:border-[#3a3b3e]"
        aria-label="New thread"
      >
        <Plus size={15} />
        <span className="hidden sm:inline">New</span>
      </button>
    </header>
  );
}
