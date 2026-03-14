"use client";

import { useRef, KeyboardEvent, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Mode, ImageSettings, VideoSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ModeSelector } from "./ModeSelector";
import { ImageSettingsPanel } from "./ImageSettings";
import { VideoSettingsPanel } from "./VideoSettings";
import { ImageUpload } from "./ImageUpload";

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
  isPolling: boolean;
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
  isPolling,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isBusy = isLoading || isPolling;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 200)}px`;
    }
  }, [prompt]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isBusy && prompt.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-[#2a2b2e] rounded-2xl border border-[#3a3b3e] shadow-2xl overflow-hidden focus-within:border-purple-600/50 transition-colors">
        {/* Textarea */}
        <div className="px-4 pt-4 pb-2">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "image"
                ? "Describe the image you want to create..."
                : "Describe the video you want to generate..."
            }
            disabled={isBusy}
            rows={1}
            className="w-full bg-transparent text-[#e8e8e8] placeholder-[#4b5563] text-[15px] leading-relaxed outline-none resize-none disabled:opacity-50 max-h-[200px] overflow-y-auto"
          />
        </div>

        {/* Uploaded image preview */}
        {uploadedImage && (
          <div className="px-4 pb-2">
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedImage}
                alt="Reference"
                className="h-16 w-auto rounded-lg border border-[#3a3b3e] object-cover"
              />
              <button
                onClick={() => onUploadedImageChange(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1e1f22] border border-[#3a3b3e] flex items-center justify-center text-[#9ca3af] hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
          {/* Left: Mode + Upload */}
          <div className="flex items-center gap-2 flex-wrap">
            <ModeSelector mode={mode} onChange={onModeChange} />
            <ImageUpload
              value={uploadedImage}
              onChange={onUploadedImageChange}
            />
          </div>

          {/* Submit */}
          <button
            onClick={onSubmit}
            disabled={isBusy || !prompt.trim()}
            className={cn(
              "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              prompt.trim() && !isBusy
                ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30"
                : "bg-[#1e1f22] text-[#4b5563] cursor-not-allowed"
            )}
          >
            {isBusy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowUp size={16} />
            )}
          </button>
        </div>

        {/* Settings bar */}
        <div className="px-4 pb-3 border-t border-[#1e1f22] pt-2.5">
          {mode === "image" ? (
            <ImageSettingsPanel
              settings={imageSettings}
              onChange={onImageSettingsChange}
            />
          ) : (
            <VideoSettingsPanel
              settings={videoSettings}
              onChange={onVideoSettingsChange}
            />
          )}
        </div>
      </div>

      {/* Hint */}
      <p className="text-center text-xs text-[#4b5563] mt-2">
        Press Enter to generate · Shift+Enter for new line
      </p>
    </div>
  );
}
