"use client";

import { useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Download, Maximize } from "lucide-react";
import { AspectRatio } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  url: string;
  aspectRatio: AspectRatio;
}

/** Convert "16:9" → "16/9" for CSS aspect-ratio property */
function cssRatio(ratio: AspectRatio) {
  return ratio.replace(":", "/");
}

export function VideoPlayer({ url, aspectRatio }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  const [metaLoaded, setMetaLoaded] = useState(false);

  const hintRatio = cssRatio(aspectRatio);

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

  // ── seek (mouse) ──────────────────────────────────────────────────────────────
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  }, []);

  // ── seek (touch) ──────────────────────────────────────────────────────────────
  const handleSeekTouch = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((touch.clientX - rect.left) / rect.width) * v.duration;
  }, []);

  // ── fullscreen ────────────────────────────────────────────────────────────────
  const handleFullscreen = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (v.requestFullscreen) {
        await v.requestFullscreen();
      } else {
        const webkit = v as unknown as { webkitEnterFullscreen?: () => void };
        webkit.webkitEnterFullscreen?.();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  // ── download ──────────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `genius-imagine-${Date.now()}.mp4`;
    a.target = "_blank";
    a.click();
  }, [url]);

  // ── error fallback ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-2xl bg-[#2a2b2e] border border-[#3a3b3e] flex flex-col items-center justify-center gap-3 py-8 px-6 w-full">
        <p className="text-sm text-[#6b7280] text-center">
          Unable to play — try downloading directly
        </p>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#333438] hover:bg-[#3a3b3e] active:bg-[#444548] text-white text-sm transition-colors"
        >
          <Download size={14} />
          Download video
        </button>
      </div>
    );
  }

  return (
    /*
     * Full width on mobile, capped on tablet/desktop.
     * CSS aspect-ratio hint prevents layout shift before metadata loads.
     */
    <div
      className="relative rounded-2xl overflow-hidden bg-black w-full"
      style={{
        maxWidth: "min(100%, 520px)",
      }}
    >
      <video
        ref={videoRef}
        src={url}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        onLoadedMetadata={() => setMetaLoaded(true)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={() => setError(true)}
        className="block w-full"
        style={metaLoaded ? {} : { aspectRatio: hintRatio }}
      />

      {/* ── Big play overlay — only when paused ── */}
      {!playing && (
        <button
          type="button"
          onClick={handleTogglePlay}
          className="absolute inset-0 w-full h-full flex items-center justify-center"
          aria-label="Play"
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 active:bg-black/90 transition-colors pointer-events-none">
            <Play size={24} fill="white" className="text-white ml-1" />
          </div>
        </button>
      )}

      {/* ── Controls bar ── */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 transition-opacity duration-150",
          playing ? "opacity-0 hover:opacity-100" : "opacity-100"
        )}
      >
        {/* Progress — taller touch target on mobile */}
        <div
          className="mx-3 mb-2 h-1.5 bg-white/20 rounded-full cursor-pointer"
          onClick={handleSeek}
          onTouchMove={handleSeekTouch}
          style={{ touchAction: "none" }}
        >
          <div
            className="h-full bg-white rounded-full pointer-events-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Buttons — 40px touch targets on mobile */}
        <div className="flex items-center justify-between px-3 pb-3 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white"
            >
              {playing
                ? <Pause size={15} fill="white" />
                : <Play size={15} fill="white" className="ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={handleToggleMute}
              className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white"
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFullscreen}
              className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white"
              aria-label="Fullscreen"
            >
              <Maximize size={15} />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white"
              aria-label="Download"
            >
              <Download size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
