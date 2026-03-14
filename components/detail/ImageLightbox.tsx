"use client";

import { useEffect, useCallback } from "react";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { GeneratedImage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  images: GeneratedImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const current = images[currentIndex];

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, images.length, onNavigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, handlePrev, handleNext]);

  if (!current) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = current.url;
    a.download = `genius-imagine-${Date.now()}.jpg`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: "fadeIn 0.15s ease-out" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={20} />
      </button>

      {/* Counter + download top-left */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className="text-sm text-white/60 bg-black/40 px-2 py-1 rounded-lg">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          onClick={handleDownload}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <Download size={16} />
        </button>
      </div>

      {/* Prev arrow */}
      {images.length > 1 && (
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Image */}
      <div className="relative z-10 max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt="Full size"
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
          style={{ animation: "fadeIn 0.2s ease-out" }}
        />
      </div>

      {/* Next arrow */}
      {images.length > 1 && (
        <button
          onClick={handleNext}
          disabled={currentIndex === images.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Thumbnail strip bottom */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={cn(
                "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                i === currentIndex
                  ? "border-white scale-110"
                  : "border-white/20 hover:border-white/50 opacity-60 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
