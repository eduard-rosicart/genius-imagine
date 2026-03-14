"use client";

import { useRef, KeyboardEvent, useEffect } from "react";
import { ArrowUp, Loader2, Image as ImageIcon, X, Film } from "lucide-react";
import { Mode, ImageSettings, VideoSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SettingsPopover } from "./SettingsPopover";

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  mode: Mode;
  imageSettings: ImageSettings;
  onImageSettingsChange: (s: ImageSettings) => void;
  videoSettings: VideoSettings;
  onVideoSettingsChange: (s: VideoSettings) => void;
  uploadedImage: string | null;
  onUploadedImageChange: (img: string | null) => void;
  onSubmit: () => void;
  isLoading: boolean;
  /** If set, shows a "video mode" pill indicating the input will generate a video from this image */
  videoFromImage?: boolean;
  onCancelVideoMode?: () => void;
}

export function PromptInput({
  prompt,
  onPromptChange,
  mode,
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [prompt]);

  // Focus on mount
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
    reader.onload = (e) => onUploadedImageChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const placeholder =
    videoFromImage
      ? "Describe how to animate this image…"
      : mode === "image"
      ? "Describe the image you want to create…"
      : "Describe the video you want to generate…";

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Video-from-image pill */}
      {videoFromImage && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2a2b2e] border border-[#3a3b3e] text-xs text-[#9ca3af]">
            <Film size={12} className="text-purple-400" />
            <span>Generating video from image</span>
            {onCancelVideoMode && (
              <button
                onClick={onCancelVideoMode}
                className="ml-1 text-[#6b7280] hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-[#2a2b2e] rounded-2xl border border-[#3a3b3e] shadow-xl focus-within:border-[#4a4b4e] transition-colors">
        {/* Uploaded image preview */}
        {uploadedImage && (
          <div className="px-4 pt-3">
            <div className="relative inline-flex items-center gap-2 px-2 py-1.5 rounded-xl bg-[#1e1f22] border border-[#3a3b3e]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedImage}
                alt="Reference"
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className="text-xs text-[#9ca3af]">Reference image</span>
              <button
                onClick={() => onUploadedImageChange(null)}
                className="ml-1 text-[#4b5563] hover:text-white transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2 px-3 py-3">
          {/* Attach image button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
            className="flex-shrink-0 p-2 rounded-xl text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1e1f22] transition-colors mb-0.5"
          >
            <ImageIcon size={18} />
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
            className="flex-1 bg-transparent text-[#e8e8e8] placeholder-[#4b5563] text-[15px] leading-relaxed outline-none resize-none disabled:opacity-50 max-h-[180px] overflow-y-auto py-1"
          />

          {/* Right actions */}
          <div className="flex items-center gap-1 flex-shrink-0 mb-0.5">
            <SettingsPopover
              mode={videoFromImage ? "video" : mode}
              imageSettings={imageSettings}
              onImageSettingsChange={onImageSettingsChange}
              videoSettings={videoSettings}
              onVideoSettingsChange={onVideoSettingsChange}
            />

            {/* Submit */}
            <button
              onClick={onSubmit}
              disabled={isLoading || !prompt.trim()}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
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
