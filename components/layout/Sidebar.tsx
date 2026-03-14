"use client";

import { Plus, Trash2, Image as ImageIcon, Film, Clock } from "lucide-react";
import { HistoryItem } from "@/lib/types";
import { formatTimestamp, truncateText } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SidebarProps {
  history: HistoryItem[];
  onNewGeneration: () => void;
  onSelectHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
  selectedId?: string;
}

export function Sidebar({
  history,
  onNewGeneration,
  onSelectHistory,
  onClearHistory,
  selectedId,
}: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-[#2a2b2e] bg-[#1a1b1e]">
      {/* New Generation Button */}
      <div className="p-3">
        <button
          onClick={onNewGeneration}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#2a2b2e] hover:bg-[#333438] text-[#e8e8e8] text-sm font-medium transition-colors border border-[#3a3b3e]"
        >
          <Plus size={16} className="text-purple-400" />
          New generation
        </button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 px-4">
            <Clock size={20} className="text-[#4a4b4e]" />
            <p className="text-xs text-[#6b7280] text-center">
              Your generations will appear here
            </p>
          </div>
        ) : (
          <div className="px-2 pb-2 space-y-0.5">
            <p className="px-2 py-2 text-xs font-medium text-[#6b7280] uppercase tracking-wider">
              History
            </p>
            {history.map((item) => (
              <HistoryItemRow
                key={item.id}
                item={item}
                isSelected={item.id === selectedId}
                onClick={() => onSelectHistory(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Clear History */}
      {history.length > 0 && (
        <div className="p-3 border-t border-[#2a2b2e]">
          <button
            onClick={onClearHistory}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#6b7280] hover:text-red-400 hover:bg-red-500/5 text-xs transition-colors"
          >
            <Trash2 size={13} />
            Clear history
          </button>
        </div>
      )}
    </aside>
  );
}

function HistoryItemRow({
  item,
  isSelected,
  onClick,
}: {
  item: HistoryItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors group",
        isSelected
          ? "bg-purple-600/15 text-white"
          : "text-[#9ca3af] hover:bg-[#2a2b2e] hover:text-[#e8e8e8]"
      )}
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden bg-[#2a2b2e] flex items-center justify-center">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : item.mode === "video" ? (
          <Film size={16} className="text-[#6b7280]" />
        ) : (
          <ImageIcon size={16} className="text-[#6b7280]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate leading-tight">
          {truncateText(item.prompt, 40)}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {item.mode === "video" ? (
            <Film size={10} className="text-purple-400 flex-shrink-0" />
          ) : (
            <ImageIcon size={10} className="text-blue-400 flex-shrink-0" />
          )}
          <span className="text-[10px] text-[#6b7280]">
            {formatTimestamp(item.timestamp)}
          </span>
        </div>
      </div>
    </button>
  );
}
