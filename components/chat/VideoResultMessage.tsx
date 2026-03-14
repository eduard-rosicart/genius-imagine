"use client";

import { useRef, useState, useCallback } from "react";
import { VideoResultMessageData, Origin } from "@/lib/types";
import { VideoPlayer } from "@/components/results/VideoPlayer";
import { captureVideoFrame, FramePosition } from "@/lib/video-utils";
import { cn } from "@/lib/utils";

interface VideoResultMessageProps {
  message: VideoResultMessageData;
  onVersionChange: (messageId: string, versionIndex: number) => void;
  onSelectOrigin: (origin: Origin) => void;
}

const FRAME_POSITIONS: { pos: FramePosition; label: string }[] = [
  { pos: "start", label: "Start" },
  { pos: "middle", label: "Middle" },
  { pos: "end", label: "End" },
];

export function VideoResultMessage({
  message,
  onVersionChange,
  onSelectOrigin,
}: VideoResultMessageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturingPos, setCapturingPos] = useState<FramePosition | null>(null);
  const [activeFramePos, setActiveFramePos] = useState<FramePosition>("end");

  const activeVideo = message.versions[message.activeVersionIndex];
  if (!activeVideo) return null;

  const hasMultiple = message.versions.length > 1;

  const handleSelectFrame = useCallback(
    async (pos: FramePosition) => {
      const versionLabel = `Video v${message.activeVersionIndex + 1}`;
      setCapturingPos(pos);

      // Find the actual <video> element rendered by VideoPlayer in the DOM.
      // We query within our container using a ref on the wrapper div.
      // Fallback: if no video element is found just use the video URL directly.
      const videoEl = document.querySelector<HTMLVideoElement>(
        `[data-video-id="${activeVideo.id}"]`
      );

      let thumbnailUrl = activeVideo.url; // fallback thumbnail = video URL itself
      let imageUrl: string | undefined;

      if (videoEl) {
        try {
          const frame = await captureVideoFrame(videoEl, pos);
          thumbnailUrl = frame;
          imageUrl = frame;
        } catch {
          // CORS or other error — fall back to video URL as source
          imageUrl = undefined;
        }
      }

      const origin: Origin = {
        type: "video-frame",
        thumbnailUrl,
        imageUrl,
        videoUrl: activeVideo.url,
        label: `${versionLabel} · ${pos}`,
        aspectRatio: activeVideo.aspectRatio,
        framePosition: pos,
      };

      setActiveFramePos(pos);
      setCapturingPos(null);
      onSelectOrigin(origin);
    },
    [activeVideo, message.activeVersionIndex, onSelectOrigin]
  );

  return (
    <div className="w-full space-y-2">
      {/* Video player — we pass the video id so we can query it for frame capture */}
      <div data-video-id={activeVideo.id}>
        <VideoPlayer url={activeVideo.url} aspectRatio={activeVideo.aspectRatio} />
      </div>

      {/* ── Frame origin selector ── */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[#4b5563] font-medium">Use as origin:</span>
        <div className="flex items-center gap-1">
          {FRAME_POSITIONS.map(({ pos, label }) => (
            <button
              key={pos}
              onClick={() => handleSelectFrame(pos)}
              disabled={capturingPos !== null}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all",
                activeFramePos === pos
                  ? "bg-purple-600/25 text-purple-300 border border-purple-500/40"
                  : "text-[#6b7280] hover:text-[#9ca3af] bg-[#2a2b2e] border border-[#3a3b3e] hover:border-[#4a4b4e]",
                capturingPos !== null && "opacity-50 cursor-not-allowed"
              )}
            >
              {capturingPos === pos ? "…" : label}
            </button>
          ))}
        </div>
      </div>

      {/* Version pills */}
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
