"use client";

import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={cn(
            "absolute z-50 px-2 py-1 text-xs rounded-lg bg-[#1a1b1e] border border-[#3a3b3e] text-[#e8e8e8] whitespace-nowrap pointer-events-none shadow-xl",
            {
              top: "bottom-full left-1/2 -translate-x-1/2 mb-1",
              bottom: "top-full left-1/2 -translate-x-1/2 mt-1",
              left: "right-full top-1/2 -translate-y-1/2 mr-1",
              right: "left-full top-1/2 -translate-y-1/2 ml-1",
            }[side]
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
