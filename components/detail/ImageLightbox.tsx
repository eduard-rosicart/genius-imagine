"use client";

import { useEffect, useCallback, useRef, useState } from "react";
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

  // ── Keyboard navigation ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, handlePrev, handleNext]);

  // ── Swipe gesture handling ────────────────────────────────────────────────────
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeDelta, setSwipeDelta] = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwipeDelta(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    // Only track horizontal swipes (allow up to 40px vertical drift)
    if (Math.abs(dx) > Math.abs(dy)) {
      setSwipeDelta(dx);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const threshold = 60;
    if (swipeDelta < -threshold) {
      handleNext();
    } else if (swipeDelta > threshold) {
      handlePrev();
    }
    setSwipeDelta(0);
    touchStartX.current = null;
    touchStartY.current = null;
  }, [swipeDelta, handleNext, handlePrev]);

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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-11 h-11 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors"
        style={{ top: "max(16px, calc(var(--safe-top) + 8px))" }}
      >
        <X size={20} />
      </button>

      {/* Counter + download top-left */}
      <div
        className="absolute left-4 z-10 flex items-center gap-2"
        style={{ top: "max(16px, calc(var(--safe-top) + 8px))" }}
      >
        <span className="text-sm text-white/60 bg-black/40 px-2 py-1 rounded-lg">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          onClick={handleDownload}
          className="w-11 h-11 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors"
        >
          <Download size={16} />
        </button>
      </div>

      {/* Prev arrow — hidden on mobile (use swipe) */}
      {images.length > 1 && (
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Image — translates with swipe */}
      <div
        className="relative z-10 max-w-[95vw] max-h-[85vh] flex items-center justify-center transition-transform duration-100"
        style={{ transform: `translateX(${swipeDelta * 0.3}px)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt="Full size"
          className="max-w-[95vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
          style={{ animation: "fadeIn 0.2s ease-out" }}
          draggable={false}
        />
      </div>

      {/* Next arrow — hidden on mobile (use swipe) */}
      {images.length > 1 && (
        <button
          onClick={handleNext}
          disabled={currentIndex === images.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Thumbnail strip bottom */}
      {images.length > 1 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10 flex gap-2"
          style={{ bottom: "max(16px, calc(var(--safe-bottom) + 12px))" }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onNavigate(i)}
              className={cn(
                "w-14 h-14 md:w-12 md:h-12 rounded-lg overflow-hidden border-2 transition-all",
                i === currentIndex
                  ? "border-white scale-110"
                  : "border-white/20 hover:border-white/50 active:border-white/50 opacity-60 hover:opacity-100 active:opacity-100"
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

      {/* Mobile swipe hint — only when multiple images and first time */}
      {images.length > 1 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 md:hidden pointer-events-none">
          <span className="text-[11px] text-white/30 bg-black/20 px-3 py-1 rounded-full">
            swipe to navigate
          </span>
        </div>
      )}
    </div>
  );
}
