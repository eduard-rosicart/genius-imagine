"use client";

import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";

interface ImageLightboxProps {
  images: string[];
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
  const currentImage = images[currentIndex];

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = currentImage;
    a.download = `genius-imagine-${Date.now()}.jpg`;
    a.target = "_blank";
    a.click();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      className="max-w-5xl w-full mx-4 p-0 overflow-hidden"
    >
      <div className="relative">
        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage}
          alt="Generated"
          className="w-full h-auto max-h-[80vh] object-contain"
        />

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() =>
                onNavigate(Math.min(images.length - 1, currentIndex + 1))
              }
              disabled={currentIndex === images.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/70 to-transparent">
          <span className="text-sm text-white/70">
            {currentIndex + 1} / {images.length}
          </span>
          <Tooltip content="Download">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Download size={16} />
            </button>
          </Tooltip>
        </div>
      </div>
    </Modal>
  );
}
