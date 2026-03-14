"use client";

import { VideoResultMessageData } from "@/lib/types";
import { VideoPlayer } from "@/components/results/VideoPlayer";
import { VideoVersionNav } from "@/components/detail/VideoVersionNav";

interface VideoResultMessageProps {
  message: VideoResultMessageData;
  onVersionChange: (messageId: string, versionIndex: number) => void;
}

export function VideoResultMessage({ message, onVersionChange }: VideoResultMessageProps) {
  const activeVideo = message.versions[message.activeVersionIndex];
  if (!activeVideo) return null;

  const hasMultiple = message.versions.length > 1;

  return (
    <div className="w-full">
      {/* Player + version strip side by side */}
      <div className="flex items-start gap-2">
        {/* Video player — grows to fit aspect ratio */}
        <div className="flex-shrink-0">
          <VideoPlayer
            url={activeVideo.url}
            aspectRatio={activeVideo.aspectRatio}
          />
        </div>

        {/* Version nav — right side, always visible */}
        {hasMultiple && (
          <VideoVersionNav
            versions={message.versions}
            activeIndex={message.activeVersionIndex}
            onSelect={(i) => onVersionChange(message.id, i)}
          />
        )}
      </div>

      {hasMultiple && (
        <p className="text-[11px] text-[#4b5563] mt-1.5 ml-0.5">
          v{message.activeVersionIndex + 1} of {message.versions.length}
        </p>
      )}
    </div>
  );
}
