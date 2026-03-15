"use client";

import { useState, useCallback } from "react";
import { Download, Copy, Check, Maximize2, Pin } from "lucide-react";
import { GeneratedImage, Origin } from "@/lib/types";
import { getAspectRatioPaddingBottom, cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/detail/ImageLightbox";

interface ImageGalleryProps {
  images: GeneratedImage[];
  onSelectOrigin: (origin: Origin) => void;
  activeOriginUrl?: string;
  galleryLabel?: string;
}

export function ImageGallery({
  images,
  onSelectOrigin,
  activeOriginUrl,
  galleryLabel = "Image",
}: ImageGalleryProps) {
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const aspectRatio = images[0]?.aspectRatio ?? "1:1";
  const pb = getAspectRatioPaddingBottom(aspectRatio);

  const handleSetOrigin = useCallback(
    (i: number) => {
      const img = images[i];
      if (!img) return;
      onSelectOrigin({
        type: "image",
        thumbnailUrl: img.url,
        imageUrl: img.url,
        label: `${galleryLabel} ${i + 1}`,
        aspectRatio: img.aspectRatio,
      });
    },
    [images, onSelectOrigin, galleryLabel]
  );

  const handleDownload = useCallback((e: React.MouseEvent, url: string, i: number) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = url;
    a.download = `genius-imagine-${i + 1}-${Date.now()}.jpg`;
    a.target = "_blank";
    a.click();
  }, []);

  const handleCopy = useCallback(async (e: React.MouseEvent, url: string, i: number) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(url);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleExpand = useCallback((e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    setLightboxIndex(i);
  }, []);

  return (
    <>
      {/* Gallery fills full available width, no fixed max-width */}
      <div className="w-full">
        <div className="grid grid-cols-2 gap-1.5">
          {images.map((img, i) => {
            const isOrigin = !!activeOriginUrl && img.url === activeOriginUrl;

            return (
              <div
                key={i}
                onClick={() => handleSetOrigin(i)}
                className={cn(
                  "group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-150",
                  isOrigin
                    ? "ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#1e1f22]"
                    : "ring-2 ring-transparent hover:ring-white/20 active:ring-white/30"
                )}
              >
                {/* Aspect ratio wrapper */}
                <div className="relative w-full" style={{ paddingBottom: pb }}>
                  {/* Skeleton */}
                  {!loaded[i] && (
                    <div className="absolute inset-0 shimmer rounded-xl" />
                  )}

                  {/* Image */}
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

                  {/* Hover dark overlay — on desktop hover, on mobile always slight */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-150 rounded-xl" />

                  {/* ── Action buttons ── */}
                  {/* Desktop: appear on hover. Mobile: always visible (small, bottom-left) */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150 z-20">
                    <button
                      type="button"
                      onClick={(e) => handleExpand(e, i)}
                      title="Expand"
                      className="w-8 h-8 md:w-7 md:h-7 rounded-lg bg-black/60 backdrop-blur-sm hover:bg-black/80 active:bg-black/90 flex items-center justify-center text-white transition-colors"
                    >
                      <Maximize2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, img.url, i)}
                      title="Download"
                      className="w-8 h-8 md:w-7 md:h-7 rounded-lg bg-black/60 backdrop-blur-sm hover:bg-black/80 active:bg-black/90 flex items-center justify-center text-white transition-colors"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(e, img.url, i)}
                      title={copied === i ? "Copied!" : "Copy URL"}
                      className="w-8 h-8 md:w-7 md:h-7 rounded-lg bg-black/60 backdrop-blur-sm hover:bg-black/80 active:bg-black/90 flex items-center justify-center text-white transition-colors"
                    >
                      {copied === i
                        ? <Check size={13} className="text-green-400" />
                        : <Copy size={13} />
                      }
                    </button>
                  </div>

                  {/* ── Origin badge ── */}
                  {isOrigin && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/90 backdrop-blur-sm z-10 pointer-events-none">
                      <Pin size={9} className="text-white" />
                      <span className="text-[9px] font-bold text-white uppercase tracking-wide">
                        Origin
                      </span>
                    </div>
                  )}

                  {/* ── Click-to-set-origin hint — desktop only ── */}
                  {!isOrigin && (
                    <div className="absolute bottom-2 left-0 right-0 hidden md:flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                      <span className="text-[9px] text-white/80 bg-black/50 px-2 py-0.5 rounded-full">
                        tap to set as origin
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen lightbox */}
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
