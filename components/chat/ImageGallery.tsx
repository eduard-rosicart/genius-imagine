"use client";

import { useState } from "react";
import { GeneratedImage, Origin } from "@/lib/types";
import { getAspectRatioPaddingBottom, cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/detail/ImageLightbox";

interface ImageGalleryProps {
  images: GeneratedImage[];
  /** Index highlighted with purple ring (from detail panel). -1 = none */
  selectedIndex: number;
  /** Single-click → opens detail panel AND sets as origin */
  onSelect: (index: number) => void;
  /** Called when user clicks an image to set it as origin */
  onSelectOrigin: (origin: Origin) => void;
  /** Label prefix for the origin label, e.g. "Gallery" */
  galleryLabel?: string;
}

export function ImageGallery({
  images,
  selectedIndex,
  onSelect,
  onSelectOrigin,
  galleryLabel = "Image",
}: ImageGalleryProps) {
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const aspectRatio = images[0]?.aspectRatio ?? "1:1";
  const pb = getAspectRatioPaddingBottom(aspectRatio);

  const handleClick = (i: number) => {
    // Open detail panel
    onSelect(i);
    // Also set as origin
    const img = images[i];
    if (!img) return;
    const origin: Origin = {
      type: "image",
      thumbnailUrl: img.url,
      imageUrl: img.url,
      label: `${galleryLabel} ${i + 1}`,
      aspectRatio: img.aspectRatio,
    };
    onSelectOrigin(origin);
  };

  return (
    <>
      <div className="w-full max-w-[480px]">
        <div className="grid grid-cols-2 gap-1.5">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              onDoubleClick={(e) => {
                e.preventDefault();
                setLightboxIndex(i);
              }}
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
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-150" />
                {selectedIndex === i && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 right-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] text-white/60 bg-black/40 px-1.5 py-0.5 rounded">
                    double-click to expand
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
