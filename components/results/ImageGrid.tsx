"use client";

import { useState } from "react";
import { ImageCard } from "./ImageCard";
import { ImageLightbox } from "./ImageLightbox";
import { AspectRatio } from "@/lib/types";

interface ImageGridProps {
  urls: string[];
  aspectRatio: AspectRatio;
}

export function ImageGrid({ urls, aspectRatio }: ImageGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const gridClass =
    urls.length === 1
      ? "grid-cols-1 max-w-xl mx-auto"
      : urls.length === 2
      ? "grid-cols-2"
      : urls.length === 3
      ? "grid-cols-3"
      : "grid-cols-2";

  return (
    <>
      <div className={`grid gap-3 ${gridClass}`}>
        {urls.map((url, i) => (
          <ImageCard
            key={url}
            url={url}
            aspectRatio={aspectRatio}
            index={i}
            onExpand={() => setLightboxIndex(i)}
          />
        ))}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={urls}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
