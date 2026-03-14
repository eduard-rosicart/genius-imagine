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

  return (
    <div className="w-full">
      <div className="relative max-w-[520px]">
        <VideoVersionNav
          versions={message.versions}
          activeIndex={message.activeVersionIndex}
          onSelect={(i) => onVersionChange(message.id, i)}
        />
        <VideoPlayer
          url={activeVideo.url}
          aspectRatio={activeVideo.aspectRatio}
        />
      </div>
      {message.versions.length > 1 && (
        <p className="text-xs text-[#6b7280] mt-1.5 ml-0.5">
          Version {message.activeVersionIndex + 1} of {message.versions.length} · hover left edge to switch
        </p>
      )}
    </div>
  );
}
