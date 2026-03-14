"use client";

import { useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Download } from "lucide-react";
import { AspectRatio } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  url: string;
  aspectRatio: AspectRatio;
}

function paddingBottom(ratio: AspectRatio) {
  const [w, h] = ratio.split(":").map(Number);
  return `${(h / w) * 100}%`;
}

function maxWidth(ratio: AspectRatio) {
  const [w, h] = ratio.split(":").map(Number);
  // portrait → narrow, landscape / square → wider
  if (h > w) return "300px";
  if (h === w) return "400px";
  return "520px";
}

export function VideoPlayer({ url, aspectRatio }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);

  // ── play / pause ─────────────────────────────────────────────────────────────
  const handleTogglePlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (playing) {
        v.pause();
        setPlaying(false);
      } else {
        await v.play();
        setPlaying(true);
      }
    } catch (err) {
      console.error("VideoPlayer play error:", err);
      setError(true);
    }
  }, [playing]);

  // ── mute ─────────────────────────────────────────────────────────────────────
  const handleToggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  // ── progress ─────────────────────────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    setProgress(0);
  }, []);

  // ── seek ─────────────────────────────────────────────────────────────────────
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  }, []);

  // ── download ─────────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `genius-imagine-${Date.now()}.mp4`;
    a.target = "_blank";
    a.click();
  }, [url]);

  const pb = paddingBottom(aspectRatio);
  const mw = maxWidth(aspectRatio);

  // ── fallback if video errors ─────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="rounded-2xl bg-[#2a2b2e] border border-[#3a3b3e] flex flex-col items-center justify-center gap-3 py-8 px-4"
        style={{ maxWidth: mw }}
      >
        <p className="text-sm text-[#6b7280]">Video unavailable — try downloading directly</p>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#333438] hover:bg-[#3a3b3e] text-white text-sm transition-colors"
        >
          <Download size={14} />
          Download video
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden bg-black"
      style={{ width: "100%", maxWidth: mw }}
    >
      {/* Aspect-ratio wrapper */}
      <div className="relative w-full" style={{ paddingBottom: pb }}>

        {/* ── The video itself ── */}
        <video
          ref={videoRef}
          src={url}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={() => setError(true)}
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* ── Big play button — sits on top, only when paused ── */}
        {!playing && (
          <button
            type="button"
            onClick={handleTogglePlay}
            className="absolute inset-0 w-full h-full flex items-center justify-center z-10 cursor-pointer"
            aria-label="Play"
          >
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors pointer-events-none">
              <Play size={26} fill="white" className="text-white ml-1" />
            </div>
          </button>
        )}

        {/* ── Controls bar — only shown on hover when playing, always when paused ── */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-150",
            playing ? "opacity-0 hover:opacity-100" : "opacity-100"
          )}
        >
          {/* Progress */}
          <div
            className="mx-3 mb-2 h-1.5 bg-white/20 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-white rounded-full pointer-events-none"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between px-3 pb-3 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing
                  ? <Pause size={14} fill="white" />
                  : <Play size={14} fill="white" className="ml-0.5" />
                }
              </button>
              <button
                type="button"
                onClick={handleToggleMute}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              aria-label="Download"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
