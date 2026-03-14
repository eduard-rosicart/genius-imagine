"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import {
  Mode,
  ImageSettings,
  VideoSettings,
  Thread,
  ChatMessage,
  ImageResultMessageData,
  VideoResultMessageData,
  VideoLoadingMessageData,
  GenerationStatus,
} from "@/lib/types";
import { generateId, truncateText } from "@/lib/utils";
import { generateImages, startVideoGeneration, buildGeneratedVideo } from "@/hooks/useGeneration";
import { useVideoPolling } from "@/hooks/useVideoPolling";
import { useThreads } from "@/hooks/useThreads";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatThread } from "@/components/chat/ChatThread";
import { PromptInput } from "@/components/generation/PromptInput";
import { SuggestionChips } from "@/components/generation/SuggestionChips";
import { ImageDetailPanel } from "@/components/detail/ImageDetailPanel";

// ─── Default settings ─────────────────────────────────────────────────────────

const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  aspectRatio: "1:1",
  resolution: "1k",
};

const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  aspectRatio: "16:9",
  resolution: "480p",
  duration: 5,
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Mode>("image");
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);
  const [videoSettings, setVideoSettings] = useState<VideoSettings>(DEFAULT_VIDEO_SETTINGS);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Thread state
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(undefined);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);

  // Image detail panel state
  const [detailMessageId, setDetailMessageId] = useState<string | undefined>(undefined);
  const [detailImageIndex, setDetailImageIndex] = useState(0);

  // Video-from-image mode
  const [videoFromImageUrl, setVideoFromImageUrl] = useState<string | null>(null);

  // Generation state
  const [genStatus, setGenStatus] = useState<GenerationStatus>("idle");
  const [genError, setGenError] = useState<string | null>(null);

  // Pending video metadata (for when polling completes)
  const pendingVideoRef = useRef<{
    threadId: string;
    loadingMsgId: string;
    existingVideoMsgId?: string;
    prompt: string;
    settings: VideoSettings;
    sourceImageUrl?: string;
  } | null>(null);

  const { threads, upsertThread, removeThread, clearAll, addMessage, replaceMessage } = useThreads();
  const { status: pollStatus, videoUrl: polledVideoUrl, videoDuration: polledDuration, startPolling, reset: resetPolling } = useVideoPolling();

  // ── Active thread sync ──────────────────────────────────────────────────────

  const refreshMessages = useCallback((threadId: string) => {
    const t = threads.find((t) => t.id === threadId);
    if (t) setActiveMessages([...t.messages]);
  }, [threads]);

  // When polling finishes ─────────────────────────────────────────────────────
  useEffect(() => {
    if (pollStatus === "done" && polledVideoUrl && pendingVideoRef.current) {
      const { threadId, loadingMsgId, existingVideoMsgId, prompt: vPrompt, settings, sourceImageUrl } = pendingVideoRef.current;

      const newVideo = buildGeneratedVideo(vPrompt, polledVideoUrl, polledDuration, settings);

      if (existingVideoMsgId) {
        // Append version to existing video message
        const currentThread = threads.find((t) => t.id === threadId);
        if (currentThread) {
          const existingMsg = currentThread.messages.find((m) => m.id === existingVideoMsgId) as VideoResultMessageData | undefined;
          if (existingMsg) {
            const updatedMsg: VideoResultMessageData = {
              ...existingMsg,
              versions: [...existingMsg.versions, newVideo],
              activeVersionIndex: existingMsg.versions.length,
            };
            // Remove loading message and update video message
            const updatedThread: Thread = {
              ...currentThread,
              messages: currentThread.messages
                .filter((m) => m.id !== loadingMsgId)
                .map((m) => (m.id === existingVideoMsgId ? updatedMsg : m)),
              updatedAt: Date.now(),
            };
            upsertThread(updatedThread);
            if (activeThreadId === threadId) setActiveMessages([...updatedThread.messages]);
          }
        }
      } else {
        // First video — replace loading with result
        const videoMsg: VideoResultMessageData = {
          id: generateId(),
          type: "video-result",
          prompt: vPrompt,
          versions: [newVideo],
          activeVersionIndex: 0,
          sourceImageUrl,
          timestamp: Date.now(),
        };
        replaceMessage(threadId, loadingMsgId, videoMsg);
        if (activeThreadId === threadId) {
          const t = threads.find((tt) => tt.id === threadId);
          if (t) {
            const msgs = t.messages.map((m) => m.id === loadingMsgId ? videoMsg : m);
            setActiveMessages([...msgs]);
          }
        }
      }

      pendingVideoRef.current = null;
      setGenStatus("idle");
      resetPolling();
    } else if (pollStatus === "expired" || pollStatus === "error") {
      setGenError("Video generation failed or expired. Please try again.");
      setGenStatus("error");
      // Remove loading message
      if (pendingVideoRef.current) {
        const { threadId, loadingMsgId } = pendingVideoRef.current;
        const currentThread = threads.find((t) => t.id === threadId);
        if (currentThread) {
          const updatedThread: Thread = {
            ...currentThread,
            messages: currentThread.messages.filter((m) => m.id !== loadingMsgId),
            updatedAt: Date.now(),
          };
          upsertThread(updatedThread);
          if (activeThreadId === threadId) setActiveMessages([...updatedThread.messages]);
        }
      }
      pendingVideoRef.current = null;
      resetPolling();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollStatus, polledVideoUrl]);

  // ── Core submit handler ─────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const text = prompt.trim();
    if (!text || genStatus !== "idle") return;

    setGenError(null);

    const isVideoMode = videoFromImageUrl !== null || mode === "video";
    const effectiveSettings = isVideoMode ? videoSettings : imageSettings;

    // Determine thread
    let threadId = activeThreadId;
    let thread: Thread;

    if (!threadId) {
      // Create new thread
      thread = {
        id: generateId(),
        title: truncateText(text, 50),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      upsertThread(thread);
      setActiveThreadId(thread.id);
      threadId = thread.id;
    } else {
      thread = threads.find((t) => t.id === threadId) ?? {
        id: threadId,
        title: truncateText(text, 50),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
    }

    // Add user prompt message
    const promptMsg: ChatMessage = {
      id: generateId(),
      type: "prompt",
      text,
      timestamp: Date.now(),
    };

    const loadingId = generateId();
    const imageAspect = isVideoMode
      ? videoSettings.aspectRatio
      : imageSettings.aspectRatio;

    const loadingMsg: ChatMessage = isVideoMode
      ? ({
          id: loadingId,
          type: "video-loading",
          prompt: text,
          sourceImageUrl: videoFromImageUrl ?? undefined,
          aspectRatio: videoSettings.aspectRatio,
          timestamp: Date.now(),
        } as ChatMessage)
      : ({
          id: loadingId,
          type: "image-loading",
          prompt: text,
          aspectRatio: imageSettings.aspectRatio,
          timestamp: Date.now(),
        } as ChatMessage);

    // Build updated messages for local display
    const newMessages = [...(thread.messages ?? []), promptMsg, loadingMsg];
    const updatedThread: Thread = {
      ...thread,
      messages: newMessages,
      updatedAt: Date.now(),
    };
    upsertThread(updatedThread);
    setActiveMessages([...newMessages]);
    setPrompt("");

    if (isVideoMode) {
      setGenStatus("generating-video");

      // Find if there's already a video result in this thread to append a version
      const existingVideoMsg = thread.messages.findLast?.(
        (m) => m.type === "video-result"
      ) as VideoResultMessageData | undefined;

      pendingVideoRef.current = {
        threadId: threadId!,
        loadingMsgId: loadingId,
        existingVideoMsgId: existingVideoMsg?.id,
        prompt: text,
        settings: videoSettings,
        sourceImageUrl: videoFromImageUrl ?? undefined,
      };

      try {
        const requestId = await startVideoGeneration(
          text,
          videoSettings,
          videoFromImageUrl ?? undefined
        );
        setGenStatus("polling-video");
        startPolling(requestId);
        setVideoFromImageUrl(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Video generation failed";
        setGenError(msg);
        setGenStatus("error");
        // Remove loading message
        const rollback: Thread = {
          ...updatedThread,
          messages: newMessages.filter((m) => m.id !== loadingId),
        };
        upsertThread(rollback);
        setActiveMessages([...rollback.messages]);
        pendingVideoRef.current = null;
      }
    } else {
      setGenStatus("generating-image");
      try {
        const images = await generateImages(
          text,
          imageSettings,
          uploadedImage ?? undefined
        );

        const resultMsg: ImageResultMessageData = {
          id: generateId(),
          type: "image-result",
          prompt: text,
          images,
          selectedIndex: 0,
          aspectRatio: imageSettings.aspectRatio,
          timestamp: Date.now(),
        };

        // Replace loading with result
        const finalMessages = newMessages.map((m) =>
          m.id === loadingId ? resultMsg : m
        );
        const finalThread: Thread = {
          ...updatedThread,
          messages: finalMessages,
          thumbnail: updatedThread.thumbnail ?? images[0]?.url,
          updatedAt: Date.now(),
        };
        upsertThread(finalThread);
        setActiveMessages([...finalMessages]);
        setGenStatus("idle");
        setUploadedImage(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Image generation failed";
        setGenError(msg);
        setGenStatus("error");
        const rollback: Thread = {
          ...updatedThread,
          messages: newMessages.filter((m) => m.id !== loadingId),
        };
        upsertThread(rollback);
        setActiveMessages([...rollback.messages]);
      }
    }
  }, [
    prompt,
    genStatus,
    mode,
    videoFromImageUrl,
    imageSettings,
    videoSettings,
    activeThreadId,
    threads,
    uploadedImage,
    upsertThread,
    startPolling,
  ]);

  // ── Thread navigation ───────────────────────────────────────────────────────

  const handleSelectThread = useCallback((thread: Thread) => {
    setActiveThreadId(thread.id);
    setActiveMessages([...thread.messages]);
    setDetailMessageId(undefined);
    setVideoFromImageUrl(null);
    setGenStatus("idle");
    setGenError(null);
    resetPolling();
    pendingVideoRef.current = null;
  }, [resetPolling]);

  const handleNewThread = useCallback(() => {
    setActiveThreadId(undefined);
    setActiveMessages([]);
    setDetailMessageId(undefined);
    setVideoFromImageUrl(null);
    setGenStatus("idle");
    setGenError(null);
    setPrompt("");
    setUploadedImage(null);
    resetPolling();
    pendingVideoRef.current = null;
  }, [resetPolling]);

  // ── Image detail panel actions ──────────────────────────────────────────────

  const handleSelectImage = useCallback((messageId: string, index: number) => {
    if (detailMessageId === messageId && detailImageIndex === index) {
      // Toggle off
      setDetailMessageId(undefined);
    } else {
      setDetailMessageId(messageId);
      setDetailImageIndex(index);
    }
  }, [detailMessageId, detailImageIndex]);

  const handleRemix = useCallback((imageUrl: string) => {
    setUploadedImage(imageUrl);
    setMode("image");
    setVideoFromImageUrl(null);
    setDetailMessageId(undefined);
    setPrompt("");
  }, []);

  const handleGenerateVideo = useCallback((imageUrl: string) => {
    setVideoFromImageUrl(imageUrl);
    setMode("video");
    setDetailMessageId(undefined);
    setPrompt("");
  }, []);

  const handleVideoVersionChange = useCallback((messageId: string, versionIndex: number) => {
    if (!activeThreadId) return;
    const currentThread = threads.find((t) => t.id === activeThreadId);
    if (!currentThread) return;
    const updatedMessages = currentThread.messages.map((m) =>
      m.id === messageId && m.type === "video-result"
        ? { ...m, activeVersionIndex: versionIndex }
        : m
    );
    const updatedThread: Thread = { ...currentThread, messages: updatedMessages, updatedAt: Date.now() };
    upsertThread(updatedThread);
    setActiveMessages([...updatedMessages]);
  }, [activeThreadId, threads, upsertThread]);

  // ── Detail panel data ───────────────────────────────────────────────────────

  const detailMessage = detailMessageId
    ? (activeMessages.find((m) => m.id === detailMessageId) as ImageResultMessageData | undefined)
    : undefined;

  const isLoading = genStatus === "generating-image" || genStatus === "generating-video" || genStatus === "polling-video";
  const showDetail = !!detailMessage && detailMessage.type === "image-result";
  const isEmpty = activeMessages.length === 0 && !isLoading;

  return (
    <div className="flex flex-col h-screen bg-[#1e1f22] overflow-hidden">
      <Header
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        onNewThread={handleNewThread}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        {sidebarOpen && (
          <Sidebar
            threads={threads}
            activeThreadId={activeThreadId}
            onNewThread={handleNewThread}
            onSelectThread={handleSelectThread}
            onClearAll={clearAll}
          />
        )}

        {/* Main: chat + detail panel */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Chat area */}
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            {/* Scrollable message list */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {isEmpty ? (
                // Empty state
                <div className="flex flex-col items-center justify-center min-h-full gap-8 px-6 py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-xl shadow-purple-900/30">
                      <Sparkles size={24} className="text-white" />
                    </div>
                    <div className="text-center">
                      <h1 className="text-3xl font-bold text-white tracking-tight">
                        What will you imagine?
                      </h1>
                      <p className="text-[#6b7280] mt-2 text-base">
                        Describe an image or video and watch it come to life
                      </p>
                    </div>
                  </div>
                  <SuggestionChips
                    mode={mode}
                    onSelect={(s) => setPrompt(s)}
                  />
                </div>
              ) : (
                <ChatThread
                  messages={activeMessages}
                  onSelectImage={handleSelectImage}
                  selectedImageMessageId={detailMessageId}
                  selectedImageIndex={detailImageIndex}
                  onVideoVersionChange={handleVideoVersionChange}
                />
              )}

              {/* Error banner */}
              {genError && (
                <div className="max-w-[600px] mx-auto px-4 pb-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <span className="flex-1">{genError}</span>
                    <button
                      onClick={() => setGenError(null)}
                      className="text-red-400/60 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t border-[#2a2b2e]">
              <PromptInput
                prompt={prompt}
                onPromptChange={setPrompt}
                mode={mode}
                imageSettings={imageSettings}
                onImageSettingsChange={setImageSettings}
                videoSettings={videoSettings}
                onVideoSettingsChange={setVideoSettings}
                uploadedImage={uploadedImage}
                onUploadedImageChange={setUploadedImage}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                videoFromImage={videoFromImageUrl !== null}
                onCancelVideoMode={() => {
                  setVideoFromImageUrl(null);
                  setMode("image");
                }}
              />
            </div>
          </div>

          {/* Image Detail Panel — slides in from right */}
          {showDetail && detailMessage && (
            <div
              className="w-72 flex-shrink-0 border-l border-[#2a2b2e] overflow-hidden"
              style={{
                animation: "slideInRight 0.2s ease-out",
              }}
            >
              <ImageDetailPanel
                images={detailMessage.images}
                selectedIndex={detailImageIndex}
                onSelectIndex={(i) => setDetailImageIndex(i)}
                onClose={() => setDetailMessageId(undefined)}
                onRemix={handleRemix}
                onGenerateVideo={handleGenerateVideo}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
