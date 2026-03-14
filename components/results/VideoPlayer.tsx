"use client";

import { useRef, useState } from "react";
import { Play, Pause, Download, Volume2, VolumeX } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/lib/types";

interface VideoPlayerProps {
  url: string;
  aspectRatio: AspectRatio;
  /** Max width override (px). Defaults to auto based on ratio. */
  maxWidth?: number;
}

/** Returns the right CSS max-width and aspect-ratio style for a given ratio string */
function getVideoStyle(ratio: AspectRatio): { maxWidth: string; aspectRatio: string } {
  const [w, h] = ratio.split(":").map(Number);
  const isPortrait = h > w;
  // Portrait: keep narrow so it doesn't stretch; Landscape: wider
  const maxW = isPortrait ? "min(280px, 100%)" : "min(520px, 100%)";
  return { maxWidth: maxW, aspectRatio: `${w}/${h}` };
}

export function VideoPlayer({ url, aspectRatio }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const { maxWidth, aspectRatio: cssRatio } = getVideoStyle(aspectRatio);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration) setProgress((currentTime / duration) * 100);
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * videoRef.current.duration;
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `genius-imagine-video-${Date.now()}.mp4`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div
      className="group relative rounded-2xl overflow-hidden bg-black"
      style={{ maxWidth, width: "100%" }}
    >
      {/* Native aspect-ratio container — no padding-bottom hack needed */}
      <div className="relative w-full" style={{ aspectRatio: cssRatio }}>
        <video
          ref={videoRef}
          src={url}
          muted={muted}
          loop
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onClick={togglePlay}
          className="absolute inset-0 w-full h-full object-contain cursor-pointer"
        />

        {/* Center play button */}
        {!playing && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors">
              <Play size={24} className="text-white ml-1" fill="white" />
            </div>
          </button>
        )}

        {/* Controls overlay */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 transition-opacity duration-200",
            playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          )}
        >
          {/* Progress bar */}
          <div
            className="mx-3 mb-2 h-1 bg-white/20 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls row */}
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

            <Tooltip content="Download video" side="top">
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
