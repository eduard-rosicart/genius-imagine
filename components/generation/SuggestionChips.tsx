"use client";

import { Mode } from "@/lib/types";

const IMAGE_SUGGESTIONS = [
  "A serene Japanese garden at golden hour",
  "Futuristic city skyline at night, neon lights",
  "A majestic dragon flying over mountains",
  "Minimalist portrait with dramatic lighting",
  "Abstract watercolor with vibrant colors",
  "An astronaut floating in a colorful nebula",
  "Cozy cabin in a snowy forest",
  "A cat wearing a space suit on Mars",
];

const VIDEO_SUGGESTIONS = [
  "Ocean waves crashing on a rocky shore",
  "Time-lapse of clouds moving over mountains",
  "A flower blooming in slow motion",
  "City traffic at night, long exposure",
  "Northern lights dancing in the sky",
  "A butterfly landing on a flower",
];

interface SuggestionChipsProps {
  mode: Mode;
  onSelect: (prompt: string) => void;
}

export function SuggestionChips({ mode, onSelect }: SuggestionChipsProps) {
  const suggestions = mode === "image" ? IMAGE_SUGGESTIONS : VIDEO_SUGGESTIONS;

  return (
    <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="px-3 py-1.5 rounded-full text-xs text-[#9ca3af] hover:text-white bg-[#2a2b2e] hover:bg-[#333438] border border-[#3a3b3e] transition-all"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
