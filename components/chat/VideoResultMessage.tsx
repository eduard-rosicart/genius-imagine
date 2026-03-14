"use client";

import { VideoResultMessageData } from "@/lib/types";
import { VideoPlayer } from "@/components/results/VideoPlayer";
import { cn } from "@/lib/utils";

interface VideoResultMessageProps {
  message: VideoResultMessageData;
  onVersionChange: (messageId: string, versionIndex: number) => void;
}

export function VideoResultMessage({ message, onVersionChange }: VideoResultMessageProps) {
  const activeVideo = message.versions[message.activeVersionIndex];
  if (!activeVideo) return null;

  const hasMultiple = message.versions.length > 1;

  return (
    <div className="w-full space-y-2">
      {/* Active video player */}
      <VideoPlayer url={activeVideo.url} aspectRatio={activeVideo.aspectRatio} />

      {/* Version pills — shown below the player when there are multiple versions */}
      {hasMultiple && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {message.versions.map((v, i) => (
            <button
              key={v.id}
              onClick={() => onVersionChange(message.id, i)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                i === message.activeVersionIndex
                  ? "bg-purple-600/25 text-purple-300 border border-purple-500/40"
                  : "text-[#6b7280] hover:text-[#9ca3af] bg-[#2a2b2e] border border-[#3a3b3e] hover:border-[#4a4b4e]"
              )}
            >
              v{i + 1}
            </button>
          ))}
          <span className="text-[11px] text-[#4b5563] ml-1">
            {message.versions.length} versions
          </span>
        </div>
      )}
    </div>
  );
}
