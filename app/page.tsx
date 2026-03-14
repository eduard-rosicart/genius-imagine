"use client";

import { useState, useCallback } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Mode, ImageSettings, VideoSettings, HistoryItem, AspectRatio } from "@/lib/types";
import { useGeneration } from "@/hooks/useGeneration";
import { useHistory } from "@/hooks/useHistory";
import { generateId } from "@/lib/utils";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PromptInput } from "@/components/generation/PromptInput";
import { SuggestionChips } from "@/components/generation/SuggestionChips";
import { ImageGrid } from "@/components/results/ImageGrid";
import { VideoPlayer } from "@/components/results/VideoPlayer";
import { GeneratingState } from "@/components/results/GeneratingState";

const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  aspectRatio: "1:1",
  resolution: "1k",
  n: 1,
};

const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  aspectRatio: "16:9",
  resolution: "480p",
  duration: 5,
};

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Mode>("image");
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);
  const [videoSettings, setVideoSettings] = useState<VideoSettings>(DEFAULT_VIDEO_SETTINGS);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>(undefined);
  const [displayedImages, setDisplayedImages] = useState<string[]>([]);
  const [displayedVideo, setDisplayedVideo] = useState<string | null>(null);
  const [displayedPrompt, setDisplayedPrompt] = useState<string>("");
  const [displayedAspectRatio, setDisplayedAspectRatio] = useState<AspectRatio>("1:1");
  const [displayedMode, setDisplayedMode] = useState<Mode>("image");
  const [sidebarOpen] = useState(true);

  const {
    status,
    imageUrls,
    videoUrl,
    error,
    currentPrompt,
    currentMode,
    generateImages,
    generateVideo,
    reset,
  } = useGeneration();

  const { history, add: addToHistory, remove: removeFromHistory, clear: clearHistory } = useHistory();

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) return;

    setDisplayedPrompt(prompt);
    setDisplayedMode(mode);
    setDisplayedImages([]);
    setDisplayedVideo(null);
    setSelectedHistoryId(undefined);

    if (mode === "image") {
      setDisplayedAspectRatio(imageSettings.aspectRatio);
      const historyItem = await generateImages(prompt, imageSettings, uploadedImage ?? undefined);
      if (historyItem) {
        addToHistory(historyItem);
        setSelectedHistoryId(historyItem.id);
        setDisplayedImages(historyItem.images?.map((i) => i.url) ?? []);
      }
    } else {
      setDisplayedAspectRatio(videoSettings.aspectRatio);
      await generateVideo(prompt, videoSettings, uploadedImage ?? undefined);
    }
  }, [prompt, mode, imageSettings, videoSettings, uploadedImage, generateImages, generateVideo, addToHistory]);

  // When video polling finishes
  const handleNewGeneration = useCallback(() => {
    reset();
    setPrompt("");
    setDisplayedImages([]);
    setDisplayedVideo(null);
    setDisplayedPrompt("");
    setSelectedHistoryId(undefined);
    setUploadedImage(null);
  }, [reset]);

  const handleSelectHistory = useCallback((item: HistoryItem) => {
    reset();
    setSelectedHistoryId(item.id);
    setDisplayedPrompt(item.prompt);
    setDisplayedMode(item.mode);
    setPrompt(item.prompt);
    setMode(item.mode);

    if (item.mode === "image" && item.images) {
      setDisplayedImages(item.images.map((i) => i.url));
      setDisplayedAspectRatio(item.images[0]?.aspectRatio ?? "1:1");
      setDisplayedVideo(null);
    } else if (item.mode === "video" && item.video) {
      setDisplayedVideo(item.video.url);
      setDisplayedAspectRatio(item.video.aspectRatio);
      setDisplayedImages([]);
    }
  }, [reset]);

  // Determine what to show
  const isLoading = status === "loading";
  const isPolling = status === "polling";
  const isDone = status === "done";
  const isError = status === "error";
  const isIdle = status === "idle";

  // Sync video URL when done
  const activeVideoUrl = videoUrl ?? displayedVideo;
  const activeImages = isDone && currentMode === "image" ? imageUrls : displayedImages;

  const showEmpty = isIdle && activeImages.length === 0 && !activeVideoUrl;
  const showResults = activeImages.length > 0 || (activeVideoUrl !== null);
  const showGenerating = isLoading || isPolling;

  return (
    <div className="flex flex-col h-screen bg-[#1e1f22]">
      {/* Header */}
      <Header />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <Sidebar
            history={history}
            onNewGeneration={handleNewGeneration}
            onSelectHistory={handleSelectHistory}
            onClearHistory={clearHistory}
            selectedId={selectedHistoryId}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable area */}
          <div className="flex-1 overflow-y-auto">
            {/* Empty state */}
            {showEmpty && (
              <div className="flex flex-col items-center justify-center min-h-full gap-8 px-6 py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-xl shadow-purple-900/30">
                    <Sparkles size={28} className="text-white" />
                  </div>
                  <div className="text-center">
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                      What will you imagine?
                    </h1>
                    <p className="text-[#6b7280] mt-2 text-base">
                      Create stunning {mode === "image" ? "images" : "videos"} from text with AI
                    </p>
                  </div>
                </div>

                <SuggestionChips
                  mode={mode}
                  onSelect={(s) => setPrompt(s)}
                />
              </div>
            )}

            {/* Generating state */}
            {showGenerating && (
              <div className="flex flex-col items-center justify-center min-h-full gap-8 px-6 py-12">
                {/* Prompt display */}
                <div className="max-w-2xl w-full">
                  <p className="text-[#6b7280] text-sm mb-1">Generating...</p>
                  <p className="text-white text-base font-medium leading-relaxed">
                    &ldquo;{currentPrompt || displayedPrompt}&rdquo;
                  </p>
                </div>

                <div className="max-w-2xl w-full">
                  <GeneratingState
                    mode={currentMode || displayedMode}
                    isPolling={isPolling}
                    count={imageSettings.n}
                    aspectRatio={displayedAspectRatio}
                  />
                </div>
              </div>
            )}

            {/* Results */}
            {!showGenerating && showResults && (
              <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                {/* Prompt display */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[#6b7280] text-xs font-medium uppercase tracking-wider mb-1">
                      {displayedMode === "image" ? "Image" : "Video"} · {displayedAspectRatio}
                    </p>
                    <p className="text-white text-lg font-medium leading-relaxed">
                      &ldquo;{displayedPrompt}&rdquo;
                    </p>
                  </div>
                  <button
                    onClick={handleNewGeneration}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-[#9ca3af] hover:text-white hover:bg-[#2a2b2e] transition-colors border border-transparent hover:border-[#3a3b3e]"
                  >
                    <RefreshCw size={14} />
                    New
                  </button>
                </div>

                {/* Image results */}
                {displayedMode === "image" && activeImages.length > 0 && (
                  <ImageGrid
                    urls={activeImages}
                    aspectRatio={displayedAspectRatio}
                  />
                )}

                {/* Video result */}
                {displayedMode === "video" && activeVideoUrl && (
                  <VideoPlayer
                    url={activeVideoUrl}
                    aspectRatio={displayedAspectRatio}
                  />
                )}
              </div>
            )}

            {/* Error state */}
            {isError && (
              <div className="flex flex-col items-center justify-center min-h-full gap-4 px-6 py-12">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 max-w-lg">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Generation failed</p>
                    <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
                  </div>
                </div>
                <button
                  onClick={handleNewGeneration}
                  className="text-sm text-[#6b7280] hover:text-white transition-colors"
                >
                  Try again
                </button>
              </div>
            )}
          </div>

          {/* Input bar — always at the bottom */}
          <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t border-[#2a2b2e]">
            <PromptInput
              prompt={prompt}
              onPromptChange={setPrompt}
              mode={mode}
              onModeChange={setMode}
              imageSettings={imageSettings}
              onImageSettingsChange={setImageSettings}
              videoSettings={videoSettings}
              onVideoSettingsChange={setVideoSettings}
              uploadedImage={uploadedImage}
              onUploadedImageChange={setUploadedImage}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              isPolling={isPolling}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
