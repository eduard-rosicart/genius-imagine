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
  GenerationStatus,
} from "@/lib/types";
import { generateId, truncateText } from "@/lib/utils";
import { generateImages, startVideoGeneration, buildGeneratedVideo } from "@/hooks/useGeneration";
import { useVideoPolling } from "@/hooks/useVideoPolling";
import { useThreads } from "@/hooks/useThreads";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatThread } from "@/components/chat/ChatThread";
import { ModeToggle } from "@/components/chat/ModeToggle";
import { PromptInput } from "@/components/generation/PromptInput";
import { SuggestionChips } from "@/components/generation/SuggestionChips";
import { ImageDetailPanel } from "@/components/detail/ImageDetailPanel";

// ─── Default settings ──────────────────────────────────────────────────────────

const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  aspectRatio: "1:1",
  resolution: "1k",
};

const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  aspectRatio: "16:9",
  resolution: "480p",
  duration: 5,
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  // ── UI ────────────────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Mode>("image");
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);
  const [videoSettings, setVideoSettings] = useState<VideoSettings>(DEFAULT_VIDEO_SETTINGS);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // ── Thread ────────────────────────────────────────────────────────────────────
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(undefined);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);

  // ── Image detail panel ────────────────────────────────────────────────────────
  const [detailMessageId, setDetailMessageId] = useState<string | undefined>(undefined);
  const [detailImageIndex, setDetailImageIndex] = useState(0);

  // ── Video-from-image ──────────────────────────────────────────────────────────
  const [videoFromImageUrl, setVideoFromImageUrl] = useState<string | null>(null);

  // ── Generation ────────────────────────────────────────────────────────────────
  const [genStatus, setGenStatus] = useState<GenerationStatus>("idle");
  const [genError, setGenError] = useState<string | null>(null);

  // Pending video metadata (resolved when polling completes)
  const pendingVideoRef = useRef<{
    threadId: string;
    loadingMsgId: string;
    existingVideoMsgId?: string;
    prompt: string;
    settings: VideoSettings;
    sourceImageUrl?: string;
  } | null>(null);

  const { threads, upsertThread, clearAll, replaceMessage } = useThreads();
  const {
    status: pollStatus,
    videoUrl: polledVideoUrl,
    videoDuration: polledDuration,
    startPolling,
    reset: resetPolling,
  } = useVideoPolling();

  // ── Polling resolution ────────────────────────────────────────────────────────
  useEffect(() => {
    if (pollStatus === "done" && polledVideoUrl && pendingVideoRef.current) {
      const {
        threadId,
        loadingMsgId,
        existingVideoMsgId,
        prompt: vPrompt,
        settings,
        sourceImageUrl,
      } = pendingVideoRef.current;

      const newVideo = buildGeneratedVideo(vPrompt, polledVideoUrl, polledDuration, settings);

      if (existingVideoMsgId) {
        // Append a new version to the existing VideoResultMessage.
        // Read from activeMessages (current state) to avoid stale closures.
        setActiveMessages((prev) => {
          const existingMsg = prev.find(
            (m) => m.id === existingVideoMsgId
          ) as VideoResultMessageData | undefined;
          if (!existingMsg) return prev;

          const updatedMsg: VideoResultMessageData = {
            ...existingMsg,
            versions: [...existingMsg.versions, newVideo],
            activeVersionIndex: existingMsg.versions.length,
          };

          const newMessages = prev
            .filter((m) => m.id !== loadingMsgId)
            .map((m) => (m.id === existingVideoMsgId ? updatedMsg : m));

          // Persist to storage as a side effect inside the setter (safe with functional update)
          const currentThread = threads.find((t) => t.id === threadId);
          if (currentThread) {
            upsertThread({
              ...currentThread,
              messages: newMessages,
              updatedAt: Date.now(),
            });
          }

          return newMessages;
        });
      } else {
        // First video — replace loading placeholder with result.
        // Use activeMessages (current React state) instead of threads (stale closure).
        const videoMsg: VideoResultMessageData = {
          id: generateId(),
          type: "video-result",
          prompt: vPrompt,
          versions: [newVideo],
          activeVersionIndex: 0,
          sourceImageUrl,
          timestamp: Date.now(),
        };
        // Persist to storage
        replaceMessage(threadId, loadingMsgId, videoMsg);
        // Update local display state immediately, without reading stale threads
        if (activeThreadId === threadId) {
          setActiveMessages((prev) =>
            prev.map((m) => (m.id === loadingMsgId ? videoMsg : m))
          );
        }
      }

      pendingVideoRef.current = null;
      setGenStatus("idle");
      resetPolling();
    } else if (pollStatus === "expired" || pollStatus === "error") {
      setGenError("Video generation failed or timed out. Please try again.");
      setGenStatus("error");
      if (pendingVideoRef.current) {
        const { threadId, loadingMsgId } = pendingVideoRef.current;
        if (activeThreadId === threadId) {
          // Remove the loading message using functional update
          setActiveMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== loadingMsgId);
            const currentThread = threads.find((t) => t.id === threadId);
            if (currentThread) {
              upsertThread({ ...currentThread, messages: filtered, updatedAt: Date.now() });
            }
            return filtered;
          });
        }
      }
      pendingVideoRef.current = null;
      resetPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollStatus, polledVideoUrl]);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const text = prompt.trim();
    if (!text || genStatus !== "idle") return;

    setGenError(null);

    const isVideoMode = videoFromImageUrl !== null || mode === "video";

    // ── Resolve / create thread ───────────────────────────────────────────────
    let threadId = activeThreadId;
    let thread: Thread;

    if (!threadId) {
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
        id: threadId!,
        title: truncateText(text, 50),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
    }

    // ── Build prompt + loading messages ───────────────────────────────────────
    const promptMsg: ChatMessage = {
      id: generateId(),
      type: "prompt",
      text,
      timestamp: Date.now(),
    };

    const loadingId = generateId();
    const loadingMsg: ChatMessage = isVideoMode
      ? {
          id: loadingId,
          type: "video-loading",
          prompt: text,
          sourceImageUrl: videoFromImageUrl ?? undefined,
          aspectRatio: videoSettings.aspectRatio,
          timestamp: Date.now(),
        }
      : {
          id: loadingId,
          type: "image-loading",
          prompt: text,
          aspectRatio: imageSettings.aspectRatio,
          timestamp: Date.now(),
        };

    const newMessages = [...(thread.messages ?? []), promptMsg, loadingMsg];
    const updatedThread: Thread = { ...thread, messages: newMessages, updatedAt: Date.now() };
    upsertThread(updatedThread);
    setActiveMessages([...newMessages]);
    setPrompt("");

    // ── VIDEO path ────────────────────────────────────────────────────────────
    if (isVideoMode) {
      setGenStatus("generating-video");

      // Find last video result in this thread — to pass its URL as context (point 3)
      const existingVideoMsg = thread.messages
        .slice()
        .reverse()
        .find((m) => m.type === "video-result") as VideoResultMessageData | undefined;

      const lastVideoUrl = existingVideoMsg
        ? existingVideoMsg.versions[existingVideoMsg.activeVersionIndex]?.url
        : undefined;

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
          videoFromImageUrl ?? undefined,
          // Pass previous video URL as context when no image is being used
          videoFromImageUrl ? undefined : lastVideoUrl
        );
        setGenStatus("polling-video");
        startPolling(requestId);
        setVideoFromImageUrl(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Video generation failed";
        setGenError(msg);
        setGenStatus("error");
        const rollback: Thread = {
          ...updatedThread,
          messages: newMessages.filter((m) => m.id !== loadingId),
        };
        upsertThread(rollback);
        setActiveMessages([...rollback.messages]);
        pendingVideoRef.current = null;
      }

    // ── IMAGE path ────────────────────────────────────────────────────────────
    } else {
      setGenStatus("generating-image");
      try {
        const imgs = await generateImages(text, imageSettings, uploadedImage ?? undefined);

        const resultMsg: ImageResultMessageData = {
          id: generateId(),
          type: "image-result",
          prompt: text,
          images: imgs,
          selectedIndex: 0,
          aspectRatio: imageSettings.aspectRatio,
          timestamp: Date.now(),
        };

        const finalMessages = newMessages.map((m) => (m.id === loadingId ? resultMsg : m));
        const finalThread: Thread = {
          ...updatedThread,
          messages: finalMessages,
          thumbnail: updatedThread.thumbnail ?? imgs[0]?.url,
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

  // ── Thread navigation ─────────────────────────────────────────────────────────
  const handleSelectThread = useCallback(
    (thread: Thread) => {
      setActiveThreadId(thread.id);
      setActiveMessages([...thread.messages]);
      setDetailMessageId(undefined);
      setVideoFromImageUrl(null);
      setGenStatus("idle");
      setGenError(null);
      resetPolling();
      pendingVideoRef.current = null;
    },
    [resetPolling]
  );

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

  // ── Image detail actions ──────────────────────────────────────────────────────
  const handleSelectImage = useCallback(
    (messageId: string, index: number) => {
      if (detailMessageId === messageId && detailImageIndex === index) {
        setDetailMessageId(undefined);
      } else {
        setDetailMessageId(messageId);
        setDetailImageIndex(index);
      }
    },
    [detailMessageId, detailImageIndex]
  );

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

  const handleVideoVersionChange = useCallback(
    (messageId: string, versionIndex: number) => {
      if (!activeThreadId) return;
      const currentThread = threads.find((t) => t.id === activeThreadId);
      if (!currentThread) return;
      const updatedMessages = currentThread.messages.map((m) =>
        m.id === messageId && m.type === "video-result"
          ? { ...m, activeVersionIndex: versionIndex }
          : m
      );
      const updatedThread: Thread = {
        ...currentThread,
        messages: updatedMessages,
        updatedAt: Date.now(),
      };
      upsertThread(updatedThread);
      setActiveMessages([...updatedMessages]);
    },
    [activeThreadId, threads, upsertThread]
  );

  // ── Derived state ─────────────────────────────────────────────────────────────
  const detailMessage = detailMessageId
    ? (activeMessages.find((m) => m.id === detailMessageId) as
        | ImageResultMessageData
        | undefined)
    : undefined;

  const isLoading =
    genStatus === "generating-image" ||
    genStatus === "generating-video" ||
    genStatus === "polling-video";
  const showDetail = !!detailMessage && detailMessage.type === "image-result";
  const isEmpty = activeMessages.length === 0 && !isLoading;

  // When switching mode via ModeToggle, also cancel video-from-image
  const handleModeChange = useCallback(
    (m: Mode) => {
      setMode(m);
      if (m === "image") setVideoFromImageUrl(null);
    },
    []
  );

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

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Chat column */}
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">

            {/* ── Scrollable chat area ── */}
            <div className="flex-1 overflow-y-auto min-h-0 relative">

              {/* Mode toggle — floating top-right of chat */}
              <div className="absolute top-3 right-4 z-20">
                <ModeToggle
                  mode={videoFromImageUrl !== null ? "video" : mode}
                  onChange={handleModeChange}
                />
              </div>

              {isEmpty ? (
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
                        {mode === "image"
                          ? "Describe an image and watch it come to life"
                          : "Describe a video and watch it come to life"}
                      </p>
                    </div>
                  </div>
                  <SuggestionChips mode={mode} onSelect={(s) => setPrompt(s)} />
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

            {/* ── Prompt input ── */}
            <div className="flex-shrink-0 px-4 pb-4 pt-3 border-t border-[#2a2b2e]">
              <PromptInput
                prompt={prompt}
                onPromptChange={setPrompt}
                mode={mode}
                onModeChange={handleModeChange}
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

          {/* ── Image detail panel ── */}
          {showDetail && detailMessage && (
            <div
              className="w-72 flex-shrink-0 border-l border-[#2a2b2e] overflow-hidden"
              style={{ animation: "slideInRight 0.2s ease-out" }}
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
