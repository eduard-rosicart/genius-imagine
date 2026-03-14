"use client";

import { useState } from "react";
import { GeneratedImage } from "@/lib/types";
import { getAspectRatioPaddingBottom, cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: GeneratedImage[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function ImageGallery({ images, selectedIndex, onSelect }: ImageGalleryProps) {
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const aspectRatio = images[0]?.aspectRatio ?? "1:1";
  const pb = getAspectRatioPaddingBottom(aspectRatio);

  return (
    <div className="w-full max-w-[480px]">
      <div className="grid grid-cols-2 gap-1.5">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={cn(
              "group relative rounded-xl overflow-hidden cursor-pointer focus:outline-none",
              "ring-2 ring-transparent transition-all duration-150",
              selectedIndex === i
                ? "ring-purple-500 ring-offset-2 ring-offset-[#1e1f22]"
                : "hover:ring-white/20"
            )}
          >
            <div className="relative" style={{ paddingBottom: pb }}>
              {!loaded[i] && (
                <div className="absolute inset-0 shimmer rounded-xl" />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`Generated ${i + 1}`}
                onLoad={() => setLoaded((p) => ({ ...p, [i]: true }))}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                  loaded[i] ? "opacity-100" : "opacity-0"
                )}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-150" />
              {/* Selection indicator */}
              {selectedIndex === i && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
