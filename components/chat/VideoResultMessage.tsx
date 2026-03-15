"use client";

import { useRef, useState, useCallback } from "react";
import { VideoResultMessageData, Origin } from "@/lib/types";
import { VideoPlayer } from "@/components/results/VideoPlayer";
import { captureVideoFrame, FramePosition } from "@/lib/video-utils";
import { cn } from "@/lib/utils";
import { Pin } from "lucide-react";

interface VideoResultMessageProps {
  message: VideoResultMessageData;
  onVersionChange: (messageId: string, versionIndex: number) => void;
  onSelectOrigin: (origin: Origin) => void;
  /** If this video is the current origin, highlight it */
  isOrigin?: boolean;
  originFramePos?: FramePosition;
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
  isOrigin = false,
  originFramePos,
}: VideoResultMessageProps) {
  const [capturingPos, setCapturingPos] = useState<FramePosition | null>(null);
  const [activeFramePos, setActiveFramePos] = useState<FramePosition>(originFramePos ?? "end");

  const activeVideo = message.versions[message.activeVersionIndex];
  if (!activeVideo) return null;

  const hasMultiple = message.versions.length > 1;

  const handleSelectFrame = useCallback(
    async (pos: FramePosition) => {
      const versionLabel = `Video v${message.activeVersionIndex + 1}`;
      setCapturingPos(pos);

      // Fix: query the <video> element *inside* the data-video-id container
      const container = document.querySelector(`[data-video-id="${activeVideo.id}"]`);
      const videoEl = container?.querySelector<HTMLVideoElement>("video") ?? null;

      let thumbnailUrl: string | undefined;
      let imageUrl: string | undefined;

      if (videoEl) {
        try {
          const frame = await captureVideoFrame(videoEl, pos);
          thumbnailUrl = frame;
          imageUrl = frame;
        } catch {
          // CORS blocked — no frame capture, will fall back to video_url in submit
        }
      }

      const origin: Origin = {
        type: "video-frame",
        // thumbnailUrl: use captured frame if available; otherwise leave undefined
        // so OriginIndicator renders the fallback video icon
        thumbnailUrl: thumbnailUrl ?? "",
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
      {/* Video player wrapper — data-video-id here so querySelector finds the <video> inside */}
      <div
        data-video-id={activeVideo.id}
        className={cn(
          "relative rounded-2xl transition-all duration-200",
          isOrigin && "ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#1e1f22]"
        )}
      >
        <VideoPlayer url={activeVideo.url} aspectRatio={activeVideo.aspectRatio} />

        {/* Origin badge */}
        {isOrigin && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/90 backdrop-blur-sm z-10">
            <Pin size={9} className="text-white" />
            <span className="text-[9px] font-bold text-white uppercase tracking-wide">Origin</span>
          </div>
        )}
      </div>

      {/* ── Frame selector ── */}
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
                isOrigin && activeFramePos === pos
                  ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40"
                  : activeFramePos === pos
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
