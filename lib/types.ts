export type Mode = "image" | "video";

export type AspectRatio =
  | "1:1"
  | "16:9"
  | "9:16"
  | "4:3"
  | "3:4"
  | "3:2"
  | "2:3"
  | "2:1"
  | "1:2";

export type ImageResolution = "1k" | "2k";
export type VideoResolution = "480p" | "720p";

// ─── Generation Settings ──────────────────────────────────────────────────────

export interface ImageSettings {
  aspectRatio: AspectRatio;
  resolution: ImageResolution;
}

export interface VideoSettings {
  aspectRatio: AspectRatio;
  resolution: VideoResolution;
  duration: number;
}

// ─── Generated Media ──────────────────────────────────────────────────────────

export interface GeneratedImage {
  url: string;
  aspectRatio: AspectRatio;
}

export interface GeneratedVideo {
  id: string;            // version id
  url: string;
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: VideoResolution;
  duration: number;
  timestamp: number;
}

// ─── Thread / Message model ───────────────────────────────────────────────────

export type MessageType =
  | "prompt"
  | "image-result"
  | "image-loading"
  | "video-result"
  | "video-loading";

export interface PromptMessageData {
  id: string;
  type: "prompt";
  text: string;
  timestamp: number;
}

export interface ImageLoadingMessageData {
  id: string;
  type: "image-loading";
  prompt: string;
  aspectRatio: AspectRatio;
  timestamp: number;
}

export interface ImageResultMessageData {
  id: string;
  type: "image-result";
  prompt: string;
  images: GeneratedImage[];          // always 4
  selectedIndex: number;             // which image is highlighted in the detail panel
  aspectRatio: AspectRatio;
  timestamp: number;
}

export interface VideoLoadingMessageData {
  id: string;
  type: "video-loading";
  prompt: string;
  sourceImageUrl?: string;
  aspectRatio: AspectRatio;
  timestamp: number;
}

export interface VideoResultMessageData {
  id: string;
  type: "video-result";
  prompt: string;
  versions: GeneratedVideo[];        // each iteration adds a version
  activeVersionIndex: number;
  sourceImageUrl?: string;
  timestamp: number;
}

export type ChatMessage =
  | PromptMessageData
  | ImageLoadingMessageData
  | ImageResultMessageData
  | VideoLoadingMessageData
  | VideoResultMessageData;

export interface Thread {
  id: string;
  title: string;          // first prompt, truncated
  thumbnail?: string;     // first generated image URL
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

// ─── Pending generation state ─────────────────────────────────────────────────

export type GenerationStatus =
  | "idle"
  | "generating-image"
  | "generating-video"   // waiting for request_id
  | "polling-video"      // polling until video is ready
  | "error";

// ─── Origin (source asset for the next generation) ───────────────────────────

export type OriginSourceType = "image" | "video-frame";

export interface Origin {
  type: OriginSourceType;
  /** Thumbnail / frame data URL shown in the UI */
  thumbnailUrl: string;
  /** URL passed as image_url to the API (image URL or captured frame) */
  imageUrl?: string;
  /** URL passed as video_url to the API (when origin is from a video) */
  videoUrl?: string;
  /** Human-readable label, e.g. "Image 2" or "Video v1 · end" */
  label: string;
  aspectRatio: AspectRatio;
  /** For video-frame origins: which position was captured */
  framePosition?: "start" | "middle" | "end";
}

// ─── API request bodies ───────────────────────────────────────────────────────

export interface GenerateImageRequest {
  prompt: string;
  aspect_ratio?: AspectRatio;
  resolution?: ImageResolution;
  image?: string;   // base64 / data-url for editing
}

export interface GenerateVideoRequest {
  prompt: string;
  duration?: number;
  aspect_ratio?: AspectRatio;
  resolution?: VideoResolution;
  image_url?: string;
}
