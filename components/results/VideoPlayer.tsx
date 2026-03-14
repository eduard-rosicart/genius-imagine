"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Download, Maximize } from "lucide-react";
import { AspectRatio } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  url: string;
  /** Hint used as initial CSS aspect-ratio. The video's real dimensions take over on load. */
  aspectRatio: AspectRatio;
}

/** Convert "16:9" → "16/9" for CSS aspect-ratio property */
function cssRatio(ratio: AspectRatio) {
  return ratio.replace(":", "/");
}

function maxWidth(ratio: AspectRatio) {
  const [w, h] = ratio.split(":").map(Number);
  if (h > w) return "300px";   // portrait
  if (h === w) return "400px"; // square
  return "520px";              // landscape
}

export function VideoPlayer({ url, aspectRatio }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  // Once the video loads its real dimensions we drop the hint ratio
  const [metaLoaded, setMetaLoaded] = useState(false);

  const hintRatio = cssRatio(aspectRatio);
  const mw = maxWidth(aspectRatio);

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

  // ── seek ─────────────────────────────────────────────────────────────────────
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  }, []);

  // ── fullscreen ────────────────────────────────────────────────────────────────
  const handleFullscreen = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (v.requestFullscreen) {
        await v.requestFullscreen();
      } else {
        // Safari iOS
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
      <div
        className="rounded-2xl bg-[#2a2b2e] border border-[#3a3b3e] flex flex-col items-center justify-center gap-3 py-8 px-6"
        style={{ maxWidth: mw }}
      >
        <p className="text-sm text-[#6b7280] text-center">
          Unable to play — try downloading directly
        </p>
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
    /*
     * Key insight: instead of a fixed paddingBottom container that forces a
     * predetermined height, we let the <video> element be a normal block with
     * width:100%. The browser respects the video's intrinsic dimensions and
     * sizes the element correctly as soon as metadata loads.
     *
     * We supply a CSS `aspect-ratio` hint (from the prop) so the space is
     * reserved before metadata arrives, preventing layout shift. Once
     * loadedmetadata fires we clear the hint so the real ratio takes over.
     */
    <div
      className="relative rounded-2xl overflow-hidden bg-black"
      style={{ width: "100%", maxWidth: mw }}
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
        /*
         * Before metadata: use the settings-derived hint ratio so layout
         * doesn't collapse to 0 height.
         * After metadata: remove it — the browser uses the real video
         * dimensions (videoWidth / videoHeight) automatically.
         */
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
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors pointer-events-none">
            <Play size={26} fill="white" className="text-white ml-1" />
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
            >
              {playing
                ? <Pause size={14} fill="white" />
                : <Play size={14} fill="white" className="ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={handleToggleMute}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFullscreen}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              aria-label="Fullscreen"
            >
              <Maximize size={14} />
            </button>
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
