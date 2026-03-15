"use client";

import { useEffect } from "react";
import { Plus, Trash2, Image as ImageIcon, Film, Clock, X } from "lucide-react";
import { Thread } from "@/lib/types";
import { truncateText, formatTimestamp } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";

interface SidebarProps {
  threads: Thread[];
  activeThreadId?: string;
  isOpen: boolean;
  onNewThread: () => void;
  onSelectThread: (thread: Thread) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function Sidebar({
  threads,
  activeThreadId,
  isOpen,
  onNewThread,
  onSelectThread,
  onClearAll,
  onClose,
}: SidebarProps) {
  const isMobile = useIsMobile();

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer */}
        <aside
          className={cn(
            "fixed top-0 left-0 z-50 h-full flex flex-col bg-[#1a1b1e] border-r border-[#2a2b2e] overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden",
            "w-[280px]",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
          style={{ paddingTop: "var(--safe-top)" }}
        >
          <SidebarContent
            threads={threads}
            activeThreadId={activeThreadId}
            onNewThread={() => { onNewThread(); onClose(); }}
            onSelectThread={(t) => { onSelectThread(t); onClose(); }}
            onClearAll={onClearAll}
            showCloseButton
            onClose={onClose}
          />
        </aside>
      </>
    );
  }

  // Tablet / Desktop: inline sidebar with smooth width transition
  return (
    <aside
      className={cn(
        "flex-shrink-0 flex flex-col border-r border-[#2a2b2e] bg-[#1a1b1e] overflow-hidden",
        "transition-[width,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isOpen
          ? "w-[var(--sidebar-width-tablet)] lg:w-[var(--sidebar-width-desktop)] opacity-100"
          : "w-0 opacity-0"
      )}
    >
      <SidebarContent
        threads={threads}
        activeThreadId={activeThreadId}
        onNewThread={onNewThread}
        onSelectThread={onSelectThread}
        onClearAll={onClearAll}
      />
    </aside>
  );
}

// ── Inner content (shared between drawer and inline) ─────────────────────────

interface SidebarContentProps {
  threads: Thread[];
  activeThreadId?: string;
  onNewThread: () => void;
  onSelectThread: (thread: Thread) => void;
  onClearAll: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}

function SidebarContent({
  threads,
  activeThreadId,
  onNewThread,
  onSelectThread,
  onClearAll,
  showCloseButton,
  onClose,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header row (mobile drawer only: shows close button) */}
      {showCloseButton && (
        <div className="flex items-center justify-between px-3 pt-3 pb-1 flex-shrink-0">
          <span className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
            Threads
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#e8e8e8] hover:bg-[#2a2b2e] transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* New Thread */}
      <div className="p-3 flex-shrink-0">
        <button
          onClick={onNewThread}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#2a2b2e] hover:bg-[#333438] active:bg-[#3a3b3e] text-[#e8e8e8] text-sm font-medium transition-colors border border-[#3a3b3e]"
        >
          <Plus size={15} className="text-purple-400 flex-shrink-0" />
          New thread
        </button>
      </div>

      {/* Threads list */}
      <div className="flex-1 overflow-y-auto min-h-0 scroll-contain">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 px-4">
            <Clock size={18} className="text-[#3a3b3e]" />
            <p className="text-xs text-[#4b5563] text-center">No threads yet</p>
          </div>
        ) : (
          <div className="px-2 pb-2 space-y-0.5">
            {threads.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                isActive={thread.id === activeThreadId}
                onClick={() => onSelectThread(thread)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Clear */}
      {threads.length > 0 && (
        <div
          className="p-3 border-t border-[#2a2b2e] flex-shrink-0"
          style={{ paddingBottom: "max(12px, calc(var(--safe-bottom) + 4px))" }}
        >
          <button
            onClick={onClearAll}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[#4b5563] hover:text-red-400 hover:bg-red-500/5 active:bg-red-500/10 text-xs transition-colors"
          >
            <Trash2 size={12} />
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function ThreadRow({
  thread,
  isActive,
  onClick,
}: {
  thread: Thread;
  isActive: boolean;
  onClick: () => void;
}) {
  const lastMsg = thread.messages[thread.messages.length - 1];
  const hasVideo =
    lastMsg?.type === "video-result" || lastMsg?.type === "video-loading";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-colors group",
        isActive
          ? "bg-[#2a2b2e] text-white"
          : "text-[#9ca3af] hover:bg-[#222326] active:bg-[#2a2b2e] hover:text-[#e8e8e8]"
      )}
    >
      {/* Thumbnail */}
      <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden bg-[#2a2b2e] flex items-center justify-center border border-[#3a3b3e]">
        {thread.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thread.thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : hasVideo ? (
          <Film size={14} className="text-[#4b5563]" />
        ) : (
          <ImageIcon size={14} className="text-[#4b5563]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate leading-snug">
          {truncateText(thread.title, 32)}
        </p>
        <p className="text-[10px] text-[#4b5563] mt-0.5">
          {formatTimestamp(thread.updatedAt)}
        </p>
      </div>
    </button>
  );
}
