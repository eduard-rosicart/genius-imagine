"use client";

import { useState, useRef, useEffect } from "react";
import { Settings2, X } from "lucide-react";
import { ImageSettings, VideoSettings, AspectRatio, ImageResolution, VideoResolution, Mode } from "@/lib/types";
import { cn } from "@/lib/utils";

const IMAGE_RATIOS: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"];
const VIDEO_RATIOS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:3", "3:4"];
const VIDEO_DURATIONS = [3, 5, 8, 10, 15];

interface SettingsPopoverProps {
  mode: Mode;
  imageSettings: ImageSettings;
  onImageSettingsChange: (s: ImageSettings) => void;
  videoSettings: VideoSettings;
  onVideoSettingsChange: (s: VideoSettings) => void;
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
        active
          ? "bg-purple-600/20 text-purple-300 border border-purple-600/30"
          : "text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2b2e] border border-transparent"
      )}
    >
      {children}
    </button>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-[#4b5563] uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

export function SettingsPopover({
  mode,
  imageSettings,
  onImageSettingsChange,
  videoSettings,
  onVideoSettingsChange,
}: SettingsPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const updateImg = (p: Partial<ImageSettings>) =>
    onImageSettingsChange({ ...imageSettings, ...p });
  const updateVid = (p: Partial<VideoSettings>) =>
    onVideoSettingsChange({ ...videoSettings, ...p });

  // Count active non-default settings for badge
  const activeCount = mode === "image"
    ? (imageSettings.aspectRatio !== "1:1" ? 1 : 0) + (imageSettings.resolution !== "1k" ? 1 : 0)
    : (videoSettings.aspectRatio !== "16:9" ? 1 : 0) + (videoSettings.duration !== 5 ? 1 : 0) + (videoSettings.resolution !== "480p" ? 1 : 0);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "relative p-2 rounded-xl transition-colors",
          open
            ? "bg-[#2a2b2e] text-white"
            : "text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2b2e]"
        )}
        title="Settings"
      >
        <Settings2 size={18} />
        {activeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-purple-500 text-[9px] font-bold text-white flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-[#1a1b1e] border border-[#2a2b2e] rounded-2xl shadow-2xl p-4 space-y-4 z-50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">
              {mode === "image" ? "Image" : "Video"} Settings
            </p>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg text-[#6b7280] hover:text-white hover:bg-[#2a2b2e] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {mode === "image" ? (
            <>
              <Section label="Aspect Ratio">
                {IMAGE_RATIOS.map((r) => (
                  <OptionButton
                    key={r}
                    active={imageSettings.aspectRatio === r}
                    onClick={() => updateImg({ aspectRatio: r })}
                  >
                    {r}
                  </OptionButton>
                ))}
              </Section>
              <Section label="Resolution">
                {(["1k", "2k"] as ImageResolution[]).map((r) => (
                  <OptionButton
                    key={r}
                    active={imageSettings.resolution === r}
                    onClick={() => updateImg({ resolution: r })}
                  >
                    {r.toUpperCase()}
                  </OptionButton>
                ))}
              </Section>
            </>
          ) : (
            <>
              <Section label="Aspect Ratio">
                {VIDEO_RATIOS.map((r) => (
                  <OptionButton
                    key={r}
                    active={videoSettings.aspectRatio === r}
                    onClick={() => updateVid({ aspectRatio: r })}
                  >
                    {r}
                  </OptionButton>
                ))}
              </Section>
              <Section label="Duration">
                {VIDEO_DURATIONS.map((d) => (
                  <OptionButton
                    key={d}
                    active={videoSettings.duration === d}
                    onClick={() => updateVid({ duration: d })}
                  >
                    {d}s
                  </OptionButton>
                ))}
              </Section>
              <Section label="Resolution">
                {(["480p", "720p"] as VideoResolution[]).map((r) => (
                  <OptionButton
                    key={r}
                    active={videoSettings.resolution === r}
                    onClick={() => updateVid({ resolution: r })}
                  >
                    {r}
                  </OptionButton>
                ))}
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
