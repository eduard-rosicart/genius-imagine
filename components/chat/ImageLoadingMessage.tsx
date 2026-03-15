"use client";

import { AspectRatio } from "@/lib/types";
import { getAspectRatioPaddingBottom } from "@/lib/utils";

interface ImageLoadingMessageProps {
  aspectRatio: AspectRatio;
}

export function ImageLoadingMessage({ aspectRatio }: ImageLoadingMessageProps) {
  const pb = getAspectRatioPaddingBottom(aspectRatio);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-1.5 w-full">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl overflow-hidden">
            <div className="relative" style={{ paddingBottom: pb }}>
              <div className="absolute inset-0 shimmer rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#6b7280] mt-2 ml-0.5">Generating images…</p>
    </div>
  );
}
