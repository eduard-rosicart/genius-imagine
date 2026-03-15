"use client";

import { useState } from "react";
import { X, Download, Copy, Check, RefreshCw, Film, Maximize2 } from "lucide-react";
import { GeneratedImage } from "@/lib/types";
import { cn, getAspectRatioPaddingBottom } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";
import { ImageLightbox } from "./ImageLightbox";

interface ImageDetailPanelProps {
  images: GeneratedImage[];
  selectedIndex: number;
  onSelectIndex: (i: number) => void;
  onClose: () => void;
  /** Called with the image URL AND its real aspect ratio */
  onRemix: (imageUrl: string, aspectRatio: GeneratedImage["aspectRatio"]) => void;
  /** Called with the image URL AND its real aspect ratio */
  onGenerateVideo: (imageUrl: string, aspectRatio: GeneratedImage["aspectRatio"]) => void;
}

export function ImageDetailPanel({
  images,
  selectedIndex,
  onSelectIndex,
  onClose,
  onRemix,
  onGenerateVideo,
}: ImageDetailPanelProps) {
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(selectedIndex);

  const current = images[selectedIndex];
  if (!current) return null;

  const pb = getAspectRatioPaddingBottom(current.aspectRatio);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(current.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = current.url;
    a.download = `genius-imagine-${Date.now()}.jpg`;
    a.target = "_blank";
    a.click();
  };

  const openLightbox = (idx = selectedIndex) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-[#1a1b1e] border-l border-[#2a2b2e] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2b2e] flex-shrink-0">
          <span className="text-sm font-medium text-[#9ca3af]">
            {selectedIndex + 1} / {images.length}
          </span>
          <div className="flex items-center gap-1">
            <Tooltip content="Expand" side="bottom">
              <button
                onClick={() => openLightbox()}
                className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-[#2a2b2e] transition-colors"
              >
                <Maximize2 size={14} />
              </button>
            </Tooltip>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6b7280] hover:text-white hover:bg-[#2a2b2e] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Main image — clickable to open lightbox */}
          <button
            className="w-full relative rounded-xl overflow-hidden bg-[#2a2b2e] cursor-zoom-in group"
            onClick={() => openLightbox()}
          >
            <div className="relative" style={{ paddingBottom: pb }}>
              {!imgLoaded && <div className="absolute inset-0 shimmer" />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={current.url}
                src={current.url}
                alt="Selected generation"
                onLoad={() => setImgLoaded(true)}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                  imgLoaded ? "opacity-100" : "opacity-0"
                )}
              />
              {/* Expand hint on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <Maximize2
                  size={20}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </button>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-1.5">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setImgLoaded(false); onSelectIndex(i); }}
                  className={cn(
                    "relative flex-1 rounded-lg overflow-hidden aspect-square border-2 transition-all",
                    i === selectedIndex
                      ? "border-purple-500"
                      : "border-transparent hover:border-[#3a3b3e]"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Primary actions */}
          <div className="space-y-2">
            <button
              onClick={() => onRemix(current.url, current.aspectRatio)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/20 hover:border-purple-600/40 text-purple-300 transition-all"
            >
              <RefreshCw size={15} />
              <div className="text-left">
                <p className="text-sm font-medium">Remix</p>
                <p className="text-xs text-purple-400/70">Generate variations from this image</p>
              </div>
            </button>

            <button
              onClick={() => onGenerateVideo(current.url, current.aspectRatio)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#2a2b2e] hover:bg-[#333438] border border-[#3a3b3e] hover:border-[#4a4b4e] text-[#e8e8e8] transition-all"
            >
              <Film size={15} className="text-[#9ca3af]" />
              <div className="text-left">
                <p className="text-sm font-medium">Generate Video</p>
                <p className="text-xs text-[#6b7280]">Animate this image</p>
              </div>
            </button>
          </div>

          {/* Secondary actions */}
          <div className="flex gap-2">
            <Tooltip content={copied ? "Copied!" : "Copy URL"} side="top">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#2a2b2e] hover:bg-[#333438] border border-[#3a3b3e] text-[#9ca3af] hover:text-white text-xs transition-all"
              >
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </Tooltip>
            <Tooltip content="Download" side="top">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#2a2b2e] hover:bg-[#333438] border border-[#3a3b3e] text-[#9ca3af] hover:text-white text-xs transition-all"
              >
                <Download size={13} />
                Download
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Lightbox — rendered outside the panel */}
      {lightboxOpen && (
        <ImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
