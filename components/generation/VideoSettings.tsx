"use client";

import { AspectRatio, VideoResolution, VideoSettings as VSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const VIDEO_ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
];

const DURATIONS = [3, 5, 8, 10, 15];

interface VideoSettingsProps {
  settings: VSettings;
  onChange: (settings: VSettings) => void;
}

export function VideoSettingsPanel({ settings, onChange }: VideoSettingsProps) {
  const update = (partial: Partial<VSettings>) =>
    onChange({ ...settings, ...partial });

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Aspect Ratio */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[#6b7280] font-medium">Ratio</span>
        <div className="flex items-center gap-0.5">
          {VIDEO_ASPECT_RATIOS.map((r) => (
            <button
              key={r.value}
              onClick={() => update({ aspectRatio: r.value })}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                settings.aspectRatio === r.value
                  ? "bg-purple-600/20 text-purple-300 border border-purple-600/30"
                  : "text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2b2e]"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-[#2a2b2e]" />

      {/* Duration */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[#6b7280] font-medium">Duration</span>
        <div className="flex items-center gap-0.5">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => update({ duration: d })}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                settings.duration === d
                  ? "bg-purple-600/20 text-purple-300 border border-purple-600/30"
                  : "text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2b2e]"
              )}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-[#2a2b2e]" />

      {/* Resolution */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[#6b7280] font-medium">Quality</span>
        <div className="flex items-center gap-0.5">
          {(["480p", "720p"] as VideoResolution[]).map((res) => (
            <button
              key={res}
              onClick={() => update({ resolution: res })}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                settings.resolution === res
                  ? "bg-purple-600/20 text-purple-300 border border-purple-600/30"
                  : "text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2b2e]"
              )}
            >
              {res}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
