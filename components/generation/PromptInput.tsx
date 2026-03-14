"use client";

import { useRef, KeyboardEvent, useEffect } from "react";
import { ArrowUp, Loader2, Image as ImageIcon, X, Film } from "lucide-react";
import {
  Mode,
  ImageSettings,
  VideoSettings,
  AspectRatio,
  ImageResolution,
  VideoResolution,
} from "@/lib/types";
import { cn } from "@/lib/utils";

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

// ─── Main component ────────────────────────────────────────────────────────────

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  imageSettings: ImageSettings;
  onImageSettingsChange: (s: ImageSettings) => void;
  videoSettings: VideoSettings;
  onVideoSettingsChange: (s: VideoSettings) => void;
  uploadedImage: string | null;
  onUploadedImageChange: (img: string | null) => void;
  onSubmit: () => void;
  isLoading: boolean;
  /** When true, the input is locked to video-from-image mode */
  videoFromImage?: boolean;
  onCancelVideoMode?: () => void;
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
  uploadedImage,
  onUploadedImageChange,
  onSubmit,
  isLoading,
  videoFromImage,
  onCancelVideoMode,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUploadedImageChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const effectiveMode = videoFromImage ? "video" : mode;

  const placeholder =
    videoFromImage
      ? "Describe how to animate this image…"
      : mode === "image"
      ? "Describe the image you want to create…"
      : "Describe the video you want to generate…";

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Video-from-image context pill */}
      {videoFromImage && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2a2b2e] border border-[#3a3b3e] text-xs text-[#9ca3af]">
            <Film size={11} className="text-purple-400" />
            <span>Animating from image</span>
            {onCancelVideoMode && (
              <button
                onClick={onCancelVideoMode}
                className="ml-1 text-[#6b7280] hover:text-white transition-colors"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-[#2a2b2e] rounded-2xl border border-[#3a3b3e] shadow-xl focus-within:border-[#4a4b4e] transition-colors">

        {/* Uploaded image preview */}
        {uploadedImage && (
          <div className="px-3 pt-3">
            <div className="relative inline-flex items-center gap-2 px-2 py-1.5 rounded-xl bg-[#1e1f22] border border-[#3a3b3e]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedImage}
                alt="Reference"
                className="w-7 h-7 rounded-lg object-cover"
              />
              <span className="text-xs text-[#9ca3af]">Reference image</span>
              <button
                onClick={() => onUploadedImageChange(null)}
                className="ml-1 text-[#4b5563] hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Textarea + send row */}
        <div className="flex items-end gap-2 px-3 py-3">
          {/* Attach image */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
            className="flex-shrink-0 p-2 rounded-xl text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1e1f22] transition-colors mb-0.5"
          >
            <ImageIcon size={17} />
          </button>

          {/* Textarea */}
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
        <div className="px-3 pb-3 pt-0 flex items-center gap-1.5 flex-wrap border-t border-[#1e1f22] pt-2.5">

          {/* Mode selector — only if not locked to video-from-image */}
          {!videoFromImage && (
            <>
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
            </>
          )}

          {/* Aspect ratio */}
          {(effectiveMode === "image" ? IMAGE_RATIOS : VIDEO_RATIOS).map((r) => (
            <SettingChip
              key={r}
              active={
                effectiveMode === "image"
                  ? imageSettings.aspectRatio === r
                  : videoSettings.aspectRatio === r
              }
              onClick={() =>
                effectiveMode === "image"
                  ? onImageSettingsChange({ ...imageSettings, aspectRatio: r })
                  : onVideoSettingsChange({ ...videoSettings, aspectRatio: r })
              }
            >
              {r}
            </SettingChip>
          ))}

          <Divider />

          {/* Video: duration */}
          {effectiveMode === "video" && (
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

          {/* Quality / resolution */}
          {effectiveMode === "image"
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
