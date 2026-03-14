"use client";

import { useState } from "react";
import { Download, Maximize2, Copy, Check } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

interface ImageCardProps {
  url: string;
  aspectRatio: string;
  onExpand: () => void;
  index: number;
}

export function ImageCard({ url, aspectRatio, onExpand, index }: ImageCardProps) {
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [w, h] = aspectRatio.split(":").map(Number);
  const paddingBottom = `${(h / w) * 100}%`;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = url;
    a.download = `genius-imagine-${Date.now()}-${index + 1}.jpg`;
    a.target = "_blank";
    a.click();
  };

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-pointer bg-[#2a2b2e]"
      onClick={onExpand}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative" style={{ paddingBottom }}>
        {/* Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 shimmer" />
        )}

        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={`Generated image ${index + 1}`}
          onLoad={() => setImageLoaded(true)}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />

        {/* Actions */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Tooltip content="Copy URL" side="top">
            <button
              onClick={handleCopyUrl}
              className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur hover:bg-black/80 flex items-center justify-center text-white transition-colors"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </Tooltip>
          <Tooltip content="Download" side="top">
            <button
              onClick={handleDownload}
              className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur hover:bg-black/80 flex items-center justify-center text-white transition-colors"
            >
              <Download size={14} />
            </button>
          </Tooltip>
          <Tooltip content="Expand" side="top">
            <button
              onClick={(e) => { e.stopPropagation(); onExpand(); }}
              className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur hover:bg-black/80 flex items-center justify-center text-white transition-colors"
            >
              <Maximize2 size={14} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
