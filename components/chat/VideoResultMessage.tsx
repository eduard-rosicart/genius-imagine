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
      {/*
        Layout: video on the left, version strip on the right.
        We use inline-flex so both items shrink-wrap to their natural sizes
        instead of stretching to fill the container width.
      */}
      <div className="inline-flex items-start gap-2">
        {/* Video player */}
        <VideoPlayer
          url={activeVideo.url}
          aspectRatio={activeVideo.aspectRatio}
        />

        {/* Version nav — right strip, always shown when versions exist */}
        <VideoVersionNav
          versions={message.versions}
          activeIndex={message.activeVersionIndex}
          onSelect={(i) => onVersionChange(message.id, i)}
        />
      </div>

      {message.versions.length > 1 && (
        <p className="text-[11px] text-[#4b5563] mt-1">
          v{message.activeVersionIndex + 1} of {message.versions.length}
        </p>
      )}
    </div>
  );
}
