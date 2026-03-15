"use client";

import { useRef, KeyboardEvent, useEffect, useState } from "react";
import { ArrowUp, Loader2, Image as ImageIcon, Film, SlidersHorizontal, X } from "lucide-react";
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
import { useIsMobile } from "@/hooks/useMediaQuery";

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
        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap",
        active
          ? "bg-purple-600/25 text-purple-300 border border-purple-500/40"
          : "text-[#6b7280] hover:text-[#9ca3af] active:text-[#9ca3af] hover:bg-[#1e1f22] active:bg-[#1e1f22] border border-transparent"
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
  origin: Origin | null;
  onClearOrigin: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  rawMode: boolean;
  onRawModeChange: (value: boolean) => void;
}

// ─── Mobile Settings Sheet ─────────────────────────────────────────────────────

interface MobileSettingsSheetProps {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  imageSettings: ImageSettings;
  onImageSettingsChange: (s: ImageSettings) => void;
  videoSettings: VideoSettings;
  onVideoSettingsChange: (s: VideoSettings) => void;
  rawMode: boolean;
  onRawModeChange: (value: boolean) => void;
}

function MobileSettingsSheet({
  open,
  onClose,
  mode,
  onModeChange,
  imageSettings,
  onImageSettingsChange,
  videoSettings,
  onVideoSettingsChange,
  rawMode,
  onRawModeChange,
}: MobileSettingsSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-[#1a1b1e] border-t border-[#2a2b2e] rounded-t-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "translate-y-0" : "translate-y-full"
        )}
        style={{ paddingBottom: "max(20px, calc(var(--safe-bottom) + 8px))" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full bg-[#3a3b3e]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-semibold text-white">Settings</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[#6b7280] hover:text-white hover:bg-[#2a2b2e] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 pb-2 space-y-4">
          {/* Mode */}
          <SettingSection label="Mode">
            <div className="flex gap-2">
              <FullChip active={mode === "image"} onClick={() => { onModeChange("image"); onClose(); }}>
                <ImageIcon size={12} />
                Image
              </FullChip>
              <FullChip active={mode === "video"} onClick={() => { onModeChange("video"); onClose(); }}>
                <Film size={12} />
                Video
              </FullChip>
            </div>
          </SettingSection>

          {/* Aspect ratio */}
          <SettingSection label="Aspect Ratio">
            <div className="flex flex-wrap gap-2">
              {(mode === "image" ? IMAGE_RATIOS : VIDEO_RATIOS).map((r) => (
                <FullChip
                  key={r}
                  active={mode === "image" ? imageSettings.aspectRatio === r : videoSettings.aspectRatio === r}
                  onClick={() =>
                    mode === "image"
                      ? onImageSettingsChange({ ...imageSettings, aspectRatio: r })
                      : onVideoSettingsChange({ ...videoSettings, aspectRatio: r })
                  }
                >
                  {r}
                </FullChip>
              ))}
            </div>
          </SettingSection>

          {/* Duration (video only) */}
          {mode === "video" && (
            <SettingSection label="Duration">
              <div className="flex flex-wrap gap-2">
                {VIDEO_DURATIONS.map((d) => (
                  <FullChip
                    key={d}
                    active={videoSettings.duration === d}
                    onClick={() => onVideoSettingsChange({ ...videoSettings, duration: d })}
                  >
                    {d}s
                  </FullChip>
                ))}
              </div>
            </SettingSection>
          )}

          {/* Quality */}
          <SettingSection label="Quality">
            <div className="flex flex-wrap gap-2">
              {mode === "image"
                ? (["1k", "2k"] as ImageResolution[]).map((r) => (
                    <FullChip
                      key={r}
                      active={imageSettings.resolution === r}
                      onClick={() => onImageSettingsChange({ ...imageSettings, resolution: r })}
                    >
                      {r.toUpperCase()}
                    </FullChip>
                  ))
                : (["480p", "720p"] as VideoResolution[]).map((r) => (
                    <FullChip
                      key={r}
                      active={videoSettings.resolution === r}
                      onClick={() => onVideoSettingsChange({ ...videoSettings, resolution: r })}
                    >
                      {r}
                    </FullChip>
                  ))}
            </div>
          </SettingSection>

          {/* Raw mode */}
          <SettingSection label="Raw Mode">
            <button
              type="button"
              onClick={() => onRawModeChange(!rawMode)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                rawMode
                  ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                  : "text-[#6b7280] border-[#3a3b3e] hover:text-[#9ca3af] hover:bg-[#2a2b2e]"
              )}
            >
              <span>{rawMode ? "⚡ On" : "Off"}</span>
              <span className="text-xs opacity-60">· Rewrites prompt to bypass filters</span>
            </button>
          </SettingSection>
        </div>
      </div>
    </>
  );
}

function SettingSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">{label}</p>
      {children}
    </div>
  );
}

function FullChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
        active
          ? "bg-purple-600/25 text-purple-300 border-purple-500/40"
          : "text-[#9ca3af] border-[#3a3b3e] hover:text-white hover:bg-[#2a2b2e] active:bg-[#2a2b2e]"
      )}
    >
      {children}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

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
  rawMode,
  onRawModeChange,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
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

  // Summary of active settings for mobile display
  const activeSettingsSummary = mode === "image"
    ? `${imageSettings.aspectRatio} · ${imageSettings.resolution.toUpperCase()}`
    : `${videoSettings.aspectRatio} · ${videoSettings.duration}s · ${videoSettings.resolution}`;

  return (
    <>
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-[720px] mx-auto">
        <div className="bg-[#2a2b2e] rounded-2xl border border-[#3a3b3e] shadow-xl focus-within:border-[#4a4b4e] transition-colors">

          {/* ── Origin indicator ── */}
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
              className="flex-1 bg-transparent text-[#e8e8e8] placeholder-[#4b5563] text-[15px] leading-relaxed outline-none resize-none disabled:opacity-50 max-h-[140px] overflow-y-auto py-1"
            />

            {/* Submit */}
            <button
              type="button"
              onClick={onSubmit}
              disabled={isLoading || !prompt.trim()}
              className={cn(
                "flex-shrink-0 w-10 h-10 md:w-9 md:h-9 rounded-xl flex items-center justify-center transition-all mb-0.5",
                prompt.trim() && !isLoading
                  ? "bg-white text-[#1e1f22] hover:bg-[#e8e8e8] active:scale-95 shadow"
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

          {/* ── Settings bar ── */}
          {isMobile ? (
            /* Mobile: compact one-row bar with settings button */
            <div className="px-3 pb-3 flex items-center gap-2 border-t border-[#1e1f22] pt-2.5">
              {/* Mode toggle — left side */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onModeChange("image")}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                    mode === "image"
                      ? "bg-purple-600/25 text-purple-300"
                      : "text-[#6b7280]"
                  )}
                >
                  <ImageIcon size={11} />
                  Image
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange("video")}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                    mode === "video"
                      ? "bg-purple-600/25 text-purple-300"
                      : "text-[#6b7280]"
                  )}
                >
                  <Film size={11} />
                  Video
                </button>
              </div>

              {/* Active settings summary */}
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] text-[#6b7280] hover:text-[#9ca3af] active:bg-[#1e1f22] transition-colors min-w-0"
              >
                <span className="truncate">{activeSettingsSummary}</span>
              </button>

              {/* Settings button */}
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                  rawMode
                    ? "text-orange-300 bg-orange-500/10"
                    : "text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1e1f22]"
                )}
                title="Open settings"
              >
                <SlidersHorizontal size={13} />
                {rawMode && <span>Raw</span>}
              </button>
            </div>
          ) : (
            /* Desktop/Tablet: full inline settings bar */
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

              <Divider />

              {/* Raw mode toggle */}
              <button
                type="button"
                onClick={() => onRawModeChange(!rawMode)}
                title={
                  rawMode
                    ? "Raw mode ON — prompt will be rewritten to bypass filters"
                    : "Raw mode OFF — prompt sent as-is"
                }
                className={cn(
                  "px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap border",
                  rawMode
                    ? "bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-sm shadow-orange-900/20"
                    : "text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1e1f22] border-transparent"
                )}
              >
                {rawMode ? "⚡ Raw" : "Raw"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile settings sheet — rendered outside the input box */}
      {isMobile && (
        <MobileSettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          mode={mode}
          onModeChange={onModeChange}
          imageSettings={imageSettings}
          onImageSettingsChange={onImageSettingsChange}
          videoSettings={videoSettings}
          onVideoSettingsChange={onVideoSettingsChange}
          rawMode={rawMode}
          onRawModeChange={onRawModeChange}
        />
      )}
    </>
  );
}
