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

export interface ImageSettings {
  aspectRatio: AspectRatio;
  resolution: ImageResolution;
  n: number;
}

export interface VideoSettings {
  aspectRatio: AspectRatio;
  resolution: VideoResolution;
  duration: number;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio: AspectRatio;
}

export interface GeneratedVideo {
  url: string;
  prompt: string;
  timestamp: number;
  duration: number;
  aspectRatio: AspectRatio;
  resolution: VideoResolution;
}

export type GenerationStatus =
  | "idle"
  | "loading"
  | "polling"
  | "done"
  | "error";

export interface HistoryItem {
  id: string;
  mode: Mode;
  prompt: string;
  timestamp: number;
  thumbnail?: string;
  images?: GeneratedImage[];
  video?: GeneratedVideo;
}

export interface GenerateImageRequest {
  prompt: string;
  n?: number;
  aspect_ratio?: AspectRatio;
  resolution?: ImageResolution;
  image?: string; // base64 for editing
}

export interface GenerateVideoRequest {
  prompt: string;
  duration?: number;
  aspect_ratio?: AspectRatio;
  resolution?: VideoResolution;
  image_url?: string;
  video_url?: string;
}
