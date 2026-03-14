"use client";

import { useRef, useState } from "react";
import { Play, Pause, Download, Volume2, VolumeX } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/lib/types";

interface VideoPlayerProps {
  url: string;
  aspectRatio: AspectRatio;
}

function getMaxWidth(ratio: AspectRatio): string {
  const [w, h] = ratio.split(":").map(Number);
  return h > w ? "280px" : "520px";
}

export function VideoPlayer({ url, aspectRatio }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const [w, h] = aspectRatio.split(":").map(Number);
  const maxWidth = getMaxWidth(aspectRatio);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const play = () => {
    videoRef.current?.play();
    setPlaying(true);
  };

  const pause = () => {
    videoRef.current?.pause();
    setPlaying(false);
  };

  const togglePlay = () => (playing ? pause() : play());

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    videoRef.current.currentTime =
      ((e.clientX - rect.left) / rect.width) * videoRef.current.duration;
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = url;
    a.download = `genius-imagine-${Date.now()}.mp4`;
    a.target = "_blank";
    a.click();
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="group relative rounded-2xl overflow-hidden bg-black select-none"
      style={{ width: "100%", maxWidth }}
    >
      {/*
        Use a block-level wrapper that establishes the aspect ratio via
        padding-bottom so both the video AND the overlay controls sit
        inside a container with defined height.
      */}
      <div
        className="relative w-full"
        style={{ paddingBottom: `${(h / w) * 100}%` }}
      >
        {/* ── Video element ── */}
        <video
          ref={videoRef}
          src={url}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="absolute inset-0 w-full h-full object-contain cursor-pointer"
          // Single source of truth for click: the video element itself
          onClick={togglePlay}
        />

        {/* ── Centre play overlay (only shown when paused) ── */}
        {!playing && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Play size={24} className="text-white ml-1" fill="white" />
            </div>
          </div>
        )}

        {/* ── Controls bar ── */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 transition-opacity duration-200",
            playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          )}
          // Stop clicks on the controls bar from toggling play/pause
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div
            className="mx-3 mb-2 h-1 bg-white/20 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${progress}%`, transition: "none" }}
            />
          </div>

          {/* Buttons row */}
          <div className="flex items-center justify-between px-3 pb-3 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                {playing ? (
                  <Pause size={13} fill="white" />
                ) : (
                  <Play size={13} className="ml-0.5" fill="white" />
                )}
              </button>
              <button
                onClick={toggleMute}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
            </div>

            <Tooltip content="Download" side="top">
              <button
                onClick={handleDownload}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <Download size={13} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
