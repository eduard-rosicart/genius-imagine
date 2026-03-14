"use client";

import { AspectRatio, ImageResolution, ImageSettings as ISettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: "1:1", label: "1:1", icon: "■" },
  { value: "16:9", label: "16:9", icon: "▬" },
  { value: "9:16", label: "9:16", icon: "▮" },
  { value: "4:3", label: "4:3", icon: "▭" },
  { value: "3:4", label: "3:4", icon: "▯" },
  { value: "3:2", label: "3:2", icon: "▬" },
  { value: "2:3", label: "2:3", icon: "▮" },
];

const COUNTS = [1, 2, 3, 4];

interface ImageSettingsProps {
  settings: ISettings;
  onChange: (settings: ISettings) => void;
}

export function ImageSettingsPanel({ settings, onChange }: ImageSettingsProps) {
  const update = (partial: Partial<ISettings>) =>
    onChange({ ...settings, ...partial });

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Aspect Ratio */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[#6b7280] font-medium">Ratio</span>
        <div className="flex items-center gap-0.5">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r.value}
              onClick={() => update({ aspectRatio: r.value })}
              title={r.label}
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

      {/* Count */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[#6b7280] font-medium">Count</span>
        <div className="flex items-center gap-0.5">
          {COUNTS.map((n) => (
            <button
              key={n}
              onClick={() => update({ n })}
              className={cn(
                "w-7 h-7 rounded-lg text-xs font-medium transition-all",
                settings.n === n
                  ? "bg-purple-600/20 text-purple-300 border border-purple-600/30"
                  : "text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2b2e]"
              )}
            >
              {n}
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
          {(["1k", "2k"] as ImageResolution[]).map((res) => (
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
              {res.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
