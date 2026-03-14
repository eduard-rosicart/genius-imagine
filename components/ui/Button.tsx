"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            primary:
              "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20",
            secondary:
              "bg-[#2a2b2e] hover:bg-[#333438] text-[#e8e8e8] border border-[#3a3b3e]",
            ghost:
              "hover:bg-[#2a2b2e] text-[#9ca3af] hover:text-[#e8e8e8]",
            danger:
              "bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-600/20",
          }[variant],
          {
            sm: "px-3 py-1.5 text-xs",
            md: "px-4 py-2 text-sm",
            lg: "px-6 py-3 text-base",
          }[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
