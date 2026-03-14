"use client";

import { Plus, Trash2, Image as ImageIcon, Film, Clock } from "lucide-react";
import { Thread } from "@/lib/types";
import { truncateText, formatTimestamp } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SidebarProps {
  threads: Thread[];
  activeThreadId?: string;
  onNewThread: () => void;
  onSelectThread: (thread: Thread) => void;
  onClearAll: () => void;
}

export function Sidebar({
  threads,
  activeThreadId,
  onNewThread,
  onSelectThread,
  onClearAll,
}: SidebarProps) {
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[#2a2b2e] bg-[#1a1b1e] overflow-hidden">
      {/* New Thread */}
      <div className="p-3 flex-shrink-0">
        <button
          onClick={onNewThread}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#2a2b2e] hover:bg-[#333438] text-[#e8e8e8] text-sm font-medium transition-colors border border-[#3a3b3e]"
        >
          <Plus size={15} className="text-purple-400" />
          New thread
        </button>
      </div>

      {/* Threads list */}
      <div className="flex-1 overflow-y-auto min-h-0">
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
        <div className="p-3 border-t border-[#2a2b2e] flex-shrink-0">
          <button
            onClick={onClearAll}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#4b5563] hover:text-red-400 hover:bg-red-500/5 text-xs transition-colors"
          >
            <Trash2 size={12} />
            Clear all
          </button>
        </div>
      )}
    </aside>
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
  // Detect last message type
  const lastMsg = thread.messages[thread.messages.length - 1];
  const hasVideo =
    lastMsg?.type === "video-result" || lastMsg?.type === "video-loading";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors group",
        isActive
          ? "bg-[#2a2b2e] text-white"
          : "text-[#9ca3af] hover:bg-[#222326] hover:text-[#e8e8e8]"
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
