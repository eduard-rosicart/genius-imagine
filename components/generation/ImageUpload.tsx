"use client";

import { useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (value) {
    return (
      <div className="relative inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-[#2a2b2e] border border-[#3a3b3e]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Uploaded"
          className="w-6 h-6 rounded object-cover"
        />
        <span className="text-xs text-[#9ca3af]">Image attached</span>
        <button
          onClick={() => onChange(null)}
          className="text-[#6b7280] hover:text-white transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        title="Attach image for editing"
        className={cn(
          "p-2 rounded-xl text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2b2e] transition-colors"
        )}
      >
        <ImageIcon size={18} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </>
  );
}
