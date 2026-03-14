"use client";

import { useRef, KeyboardEvent, useEffect } from "react";
import { ArrowUp, Loader2, Image as ImageIcon, Film } from "lucide-react";
import {
  Mode,
  Origin,
  ImageSettings,
  VideoSettings,
  AspectRatio,
  ImageResolution,
  VideoResolution,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { OriginIndicator } from "./OriginIndicator";

// ─── Inline settings options ───────────────────────────────────────────────────

const IMAGE_RATIOS: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4", "2:3"];
const VIDEO_RATIOS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:3"];
const VIDEO_DURATIONS = [3, 5, 8, 10, 15];

function SettingChip({
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
      type="button"
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap",
        active
          ? "bg-purple-600/25 text-purple-300 border border-purple-500/40"
          : "text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1e1f22] border border-transparent"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-3 bg-[#3a3b3e] flex-shrink-0" />;
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  imageSettings: ImageSettings;
  onImageSettingsChange: (s: ImageSettings) => void;
  videoSettings: VideoSettings;
  onVideoSettingsChange: (s: VideoSettings) => void;
  /** The active origin for the next generation (image or video frame) */
  origin: Origin | null;
  onClearOrigin: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function PromptInput({
  prompt,
  onPromptChange,
  mode,
  onModeChange,
  imageSettings,
  onImageSettingsChange,
  videoSettings,
  onVideoSettingsChange,
  origin,
  onClearOrigin,
  onSubmit,
  isLoading,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [prompt]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && prompt.trim()) onSubmit();
    }
  };

  const placeholder =
    mode === "image"
      ? "Describe the image you want to create…"
      : "Describe the video you want to generate…";

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-[#2a2b2e] rounded-2xl border border-[#3a3b3e] shadow-xl focus-within:border-[#4a4b4e] transition-colors">

        {/* ── Origin indicator (shown when there's an active source asset) ── */}
        {origin && (
          <OriginIndicator origin={origin} onClear={onClearOrigin} />
        )}

        {/* ── Textarea + send ── */}
        <div className="flex items-end gap-2 px-3 py-3">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent text-[#e8e8e8] placeholder-[#4b5563] text-[15px] leading-relaxed outline-none resize-none disabled:opacity-50 max-h-[160px] overflow-y-auto py-1"
          />

          {/* Submit */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading || !prompt.trim()}
            className={cn(
              "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all mb-0.5",
              prompt.trim() && !isLoading
                ? "bg-white text-[#1e1f22] hover:bg-[#e8e8e8] shadow"
                : "bg-[#1e1f22] text-[#4b5563] cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowUp size={16} />
            )}
          </button>
        </div>

        {/* ── Inline settings bar ── */}
        <div className="px-3 pb-3 flex items-center gap-1.5 flex-wrap border-t border-[#1e1f22] pt-2.5">
          {/* Mode */}
          <SettingChip active={mode === "image"} onClick={() => onModeChange("image")}>
            <span className="flex items-center gap-1">
              <ImageIcon size={10} />
              Image
            </span>
          </SettingChip>
          <SettingChip active={mode === "video"} onClick={() => onModeChange("video")}>
            <span className="flex items-center gap-1">
              <Film size={10} />
              Video
            </span>
          </SettingChip>

          <Divider />

          {/* Aspect ratio */}
          {(mode === "image" ? IMAGE_RATIOS : VIDEO_RATIOS).map((r) => (
            <SettingChip
              key={r}
              active={mode === "image" ? imageSettings.aspectRatio === r : videoSettings.aspectRatio === r}
              onClick={() =>
                mode === "image"
                  ? onImageSettingsChange({ ...imageSettings, aspectRatio: r })
                  : onVideoSettingsChange({ ...videoSettings, aspectRatio: r })
              }
            >
              {r}
            </SettingChip>
          ))}

          <Divider />

          {/* Video: duration */}
          {mode === "video" && (
            <>
              {VIDEO_DURATIONS.map((d) => (
                <SettingChip
                  key={d}
                  active={videoSettings.duration === d}
                  onClick={() => onVideoSettingsChange({ ...videoSettings, duration: d })}
                >
                  {d}s
                </SettingChip>
              ))}
              <Divider />
            </>
          )}

          {/* Quality */}
          {mode === "image"
            ? (["1k", "2k"] as ImageResolution[]).map((r) => (
                <SettingChip
                  key={r}
                  active={imageSettings.resolution === r}
                  onClick={() => onImageSettingsChange({ ...imageSettings, resolution: r })}
                >
                  {r.toUpperCase()}
                </SettingChip>
              ))
            : (["480p", "720p"] as VideoResolution[]).map((r) => (
                <SettingChip
                  key={r}
                  active={videoSettings.resolution === r}
                  onClick={() => onVideoSettingsChange({ ...videoSettings, resolution: r })}
                >
                  {r}
                </SettingChip>
              ))}
        </div>
      </div>
    </div>
  );
}
