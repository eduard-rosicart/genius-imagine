import type { Provider } from "./types";

// ─── Provider metadata ─────────────────────────────────────────────────────────

export interface ProviderInfo {
  id: Provider;
  /** Short display name */
  name: string;
  /** Longer description shown in tooltips / mobile sheet */
  description: string;
  /** Supports text-to-image */
  image: boolean;
  /** Supports text-to-video (without needing a base image) */
  textToVideo: boolean;
  /** Supports image-to-video (animating an existing image) */
  imageToVideo: boolean;
}

export const PROVIDERS: Record<Provider, ProviderInfo> = {
  xai: {
    id: "xai",
    name: "xAI",
    description: "Grok Imagine — fast, high quality. Supports text-to-video.",
    image: true,
    textToVideo: true,
    imageToVideo: true,
  },
  eternalai: {
    id: "eternalai",
    name: "EternalAI",
    description: "Uncensored generation. Video requires a reference image.",
    image: true,
    textToVideo: false,   // requires a base image for video
    imageToVideo: true,
  },
};

export const PROVIDER_LIST: ProviderInfo[] = Object.values(PROVIDERS);

/** Returns true if the given provider supports the requested mode/origin combo */
export function canGenerateVideo(provider: Provider, hasOriginImage: boolean): boolean {
  const p = PROVIDERS[provider];
  if (p.textToVideo) return true;       // can always do video
  if (p.imageToVideo && hasOriginImage) return true;  // needs image but has one
  return false;
}
