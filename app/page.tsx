"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import {
  Mode,
  AspectRatio,
  Origin,
  ImageSettings,
  VideoSettings,
  Thread,
  ChatMessage,
  ImageResultMessageData,
  VideoResultMessageData,
  GenerationStatus,
} from "@/lib/types";
import { generateId, truncateText } from "@/lib/utils";
import { rewritePrompt } from "@/lib/prompt-rewriter";
import { generateImages, startVideoGeneration, buildGeneratedVideo } from "@/hooks/useGeneration";
import { useVideoPolling } from "@/hooks/useVideoPolling";
import { useThreads } from "@/hooks/useThreads";
import { useIsMobile } from "@/hooks/useMediaQuery";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatThread } from "@/components/chat/ChatThread";
import { ModeToggle } from "@/components/chat/ModeToggle";
import { PromptInput } from "@/components/generation/PromptInput";
import { SuggestionChips } from "@/components/generation/SuggestionChips";

// ─── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_IMAGE_SETTINGS: ImageSettings = { aspectRatio: "1:1", resolution: "1k" };
const DEFAULT_VIDEO_SETTINGS: VideoSettings = { aspectRatio: "16:9", resolution: "480p", duration: 5 };

// ─── Helpers ───────────────────────────────────────────────────────────────────

function imageOrigin(url: string, aspectRatio: AspectRatio, label: string): Origin {
  return { type: "image", thumbnailUrl: url, imageUrl: url, label, aspectRatio };
}

function videoOrigin(videoUrl: string, aspectRatio: AspectRatio, label: string): Origin {
  return {
    type: "video-frame",
    thumbnailUrl: videoUrl,
    videoUrl,
    label,
    aspectRatio,
    framePosition: "end",
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const isMobile = useIsMobile();
  // On mobile, sidebar starts closed; on tablet/desktop it starts open
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Mode>("image");
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);
  const [videoSettings, setVideoSettings] = useState<VideoSettings>(DEFAULT_VIDEO_SETTINGS);

  // ── Thread ────────────────────────────────────────────────────────────────────
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(undefined);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);

  // ── Raw mode (prompt rewriter) ────────────────────────────────────────────────
  const [rawMode, setRawMode] = useState(false);

  // ── Unified origin state ──────────────────────────────────────────────────────
  const [origin, setOrigin] = useState<Origin | null>(null);

  // ── Generation ────────────────────────────────────────────────────────────────
  const [genStatus, setGenStatus] = useState<GenerationStatus>("idle");
  const [genError, setGenError] = useState<string | null>(null);

  const pendingVideoRef = useRef<{
    threadId: string;
    loadingMsgId: string;
    existingVideoMsgId?: string;
    prompt: string;
    settings: VideoSettings;
    originAspectRatio?: AspectRatio;
  } | null>(null);

  const { threads, upsertThread, clearAll, replaceMessage } = useThreads();
  const {
    status: pollStatus,
    videoUrl: polledVideoUrl,
    videoDuration: polledDuration,
    errorMessage: pollErrorMessage,
    startPolling,
    reset: resetPolling,
  } = useVideoPolling();

  // ── Responsive sidebar default ────────────────────────────────────────────────
  // Once the client hydrates, set sidebar open on non-mobile
  useEffect(() => {
    if (!isMobile) setSidebarOpen(true);
  }, [isMobile]);

  // ── Polling resolution ────────────────────────────────────────────────────────
  useEffect(() => {
    if (pollStatus === "done" && polledVideoUrl && pendingVideoRef.current) {
      const { threadId, loadingMsgId, existingVideoMsgId, prompt: vPrompt, settings, originAspectRatio } = pendingVideoRef.current;

      const newVideo = buildGeneratedVideo(vPrompt, polledVideoUrl, polledDuration, settings, originAspectRatio);

      if (existingVideoMsgId) {
        setActiveMessages((prev) => {
          const existingMsg = prev.find((m) => m.id === existingVideoMsgId) as VideoResultMessageData | undefined;
          if (!existingMsg) return prev;
          const updatedMsg: VideoResultMessageData = {
            ...existingMsg,
            versions: [...existingMsg.versions, newVideo],
            activeVersionIndex: existingMsg.versions.length,
          };
          const newMessages = prev
            .filter((m) => m.id !== loadingMsgId)
            .map((m) => (m.id === existingVideoMsgId ? updatedMsg : m));
          const currentThread = threads.find((t) => t.id === threadId);
          if (currentThread) upsertThread({ ...currentThread, messages: newMessages, updatedAt: Date.now() });
          return newMessages;
        });
      } else {
        const videoMsg: VideoResultMessageData = {
          id: generateId(),
          type: "video-result",
          prompt: vPrompt,
          versions: [newVideo],
          activeVersionIndex: 0,
          timestamp: Date.now(),
        };
        replaceMessage(threadId, loadingMsgId, videoMsg);
        if (activeThreadId === threadId) {
          setActiveMessages((prev) => prev.map((m) => (m.id === loadingMsgId ? videoMsg : m)));
        }
      }

      setOrigin(videoOrigin(polledVideoUrl, newVideo.aspectRatio, `Video · end`));

      pendingVideoRef.current = null;
      setGenStatus("idle");
      resetPolling();
    } else if (pollStatus === "failed" || pollStatus === "expired" || pollStatus === "error") {
      setGenError(pollErrorMessage ?? "Video generation failed. Please try again.");
      setGenStatus("error");
      if (pendingVideoRef.current) {
        const { threadId, loadingMsgId } = pendingVideoRef.current;
        if (activeThreadId === threadId) {
          setActiveMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== loadingMsgId);
            const currentThread = threads.find((t) => t.id === threadId);
            if (currentThread) upsertThread({ ...currentThread, messages: filtered, updatedAt: Date.now() });
            return filtered;
          });
        }
      }
      pendingVideoRef.current = null;
      resetPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollStatus, polledVideoUrl, pollErrorMessage]);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const rawText = prompt.trim();
    if (!rawText || genStatus !== "idle") return;
    setGenError(null);
    const text = rawMode ? rewritePrompt(rawText, "medium") : rawText;

    const isVideoMode = mode === "video";

    let threadId = activeThreadId;
    let thread: Thread;
    if (!threadId) {
      thread = { id: generateId(), title: truncateText(text, 50), createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
      upsertThread(thread);
      setActiveThreadId(thread.id);
      threadId = thread.id;
    } else {
      thread = threads.find((t) => t.id === threadId) ?? {
        id: threadId!, title: truncateText(text, 50), createdAt: Date.now(), updatedAt: Date.now(), messages: [],
      };
    }

    const promptMsg: ChatMessage = { id: generateId(), type: "prompt", text, timestamp: Date.now() };
    const loadingId = generateId();
    const loadingMsg: ChatMessage = isVideoMode
      ? { id: loadingId, type: "video-loading", prompt: text, aspectRatio: videoSettings.aspectRatio, timestamp: Date.now() }
      : { id: loadingId, type: "image-loading", prompt: text, aspectRatio: imageSettings.aspectRatio, timestamp: Date.now() };

    const newMessages = [...(thread.messages ?? []), promptMsg, loadingMsg];
    const updatedThread: Thread = { ...thread, messages: newMessages, updatedAt: Date.now() };
    upsertThread(updatedThread);
    setActiveMessages([...newMessages]);
    setPrompt("");

    if (isVideoMode) {
      setGenStatus("generating-video");

      const existingVideoMsg = thread.messages
        .slice().reverse()
        .find((m) => m.type === "video-result") as VideoResultMessageData | undefined;

      let apiImageUrl: string | undefined;
      let apiVideoUrl: string | undefined;
      let originAspectRatio: AspectRatio | undefined;

      if (origin) {
        originAspectRatio = origin.aspectRatio;
        if (origin.type === "image") {
          apiImageUrl = origin.imageUrl;
        } else {
          if (origin.imageUrl) {
            apiImageUrl = origin.imageUrl;
          } else {
            apiVideoUrl = origin.videoUrl;
          }
        }
      }

      if (!origin && existingVideoMsg) {
        const lastVid = existingVideoMsg.versions[existingVideoMsg.activeVersionIndex];
        if (lastVid) {
          apiVideoUrl = lastVid.url;
          originAspectRatio = lastVid.aspectRatio;
        }
      }

      pendingVideoRef.current = {
        threadId: threadId!,
        loadingMsgId: loadingId,
        existingVideoMsgId: existingVideoMsg?.id,
        prompt: text,
        settings: videoSettings,
        originAspectRatio,
      };

      try {
        const requestId = await startVideoGeneration(text, videoSettings, apiImageUrl, apiVideoUrl);
        setGenStatus("polling-video");
        startPolling(requestId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Video generation failed";
        setGenError(msg);
        setGenStatus("error");
        upsertThread({ ...updatedThread, messages: newMessages.filter((m) => m.id !== loadingId) });
        setActiveMessages((prev) => prev.filter((m) => m.id !== loadingId));
        pendingVideoRef.current = null;
      }

    } else {
      setGenStatus("generating-image");
      const refImageUrl = origin?.type === "image" ? origin.imageUrl : undefined;
      const effectiveAspect = origin ? origin.aspectRatio : imageSettings.aspectRatio;

      try {
        const imgs = await generateImages(text, { ...imageSettings, aspectRatio: effectiveAspect }, refImageUrl);

        const resultMsg: ImageResultMessageData = {
          id: generateId(), type: "image-result", prompt: text,
          images: imgs, selectedIndex: 0,
          aspectRatio: effectiveAspect, timestamp: Date.now(),
        };

        const finalMessages = newMessages.map((m) => (m.id === loadingId ? resultMsg : m));
        upsertThread({ ...updatedThread, messages: finalMessages, thumbnail: updatedThread.thumbnail ?? imgs[0]?.url, updatedAt: Date.now() });
        setActiveMessages([...finalMessages]);
        setGenStatus("idle");

        if (imgs[0]) {
          setOrigin(imageOrigin(imgs[0].url, effectiveAspect, "Image 1"));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Image generation failed";
        setGenError(msg);
        setGenStatus("error");
        upsertThread({ ...updatedThread, messages: newMessages.filter((m) => m.id !== loadingId) });
        setActiveMessages((prev) => prev.filter((m) => m.id !== loadingId));
      }
    }
  }, [prompt, rawMode, genStatus, mode, origin, imageSettings, videoSettings, activeThreadId, threads, upsertThread, startPolling]);

  // ── Thread navigation ─────────────────────────────────────────────────────────
  const deriveOriginFromThread = useCallback((messages: ChatMessage[]): Origin | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.type === "video-result") {
        const vid = msg.versions[msg.activeVersionIndex];
        if (vid) return videoOrigin(vid.url, vid.aspectRatio, "Video · end");
      }
      if (msg.type === "image-result" && msg.images[0]) {
        return imageOrigin(msg.images[0].url, msg.images[0].aspectRatio, "Image 1");
      }
    }
    return null;
  }, []);

  const handleSelectThread = useCallback((thread: Thread) => {
    setActiveThreadId(thread.id);
    setActiveMessages([...thread.messages]);
    setOrigin(deriveOriginFromThread(thread.messages));
    setGenStatus("idle");
    setGenError(null);
    resetPolling();
    pendingVideoRef.current = null;
  }, [resetPolling, deriveOriginFromThread]);

  const handleNewThread = useCallback(() => {
    setActiveThreadId(undefined);
    setActiveMessages([]);
    setOrigin(null);
    setGenStatus("idle");
    setGenError(null);
    setPrompt("");
    resetPolling();
    pendingVideoRef.current = null;
  }, [resetPolling]);

  const handleVideoVersionChange = useCallback((messageId: string, versionIndex: number) => {
    if (!activeThreadId) return;
    const currentThread = threads.find((t) => t.id === activeThreadId);
    if (!currentThread) return;
    const updatedMessages = currentThread.messages.map((m) =>
      m.id === messageId && m.type === "video-result" ? { ...m, activeVersionIndex: versionIndex } : m
    );
    upsertThread({ ...currentThread, messages: updatedMessages, updatedAt: Date.now() });
    setActiveMessages([...updatedMessages]);
  }, [activeThreadId, threads, upsertThread]);

  const handleModeChange = useCallback((m: Mode) => setMode(m), []);
  const handleSelectOrigin = useCallback((o: Origin) => {
    setOrigin(o);
    if (o.aspectRatio) {
      setImageSettings((prev) => ({ ...prev, aspectRatio: o.aspectRatio }));
      setVideoSettings((prev) => ({ ...prev, aspectRatio: o.aspectRatio }));
    }
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const isLoading = genStatus === "generating-image" || genStatus === "generating-video" || genStatus === "polling-video";
  const isEmpty = activeMessages.length === 0 && !isLoading;

  return (
    <div
      className="flex flex-col bg-[#1e1f22] overflow-hidden"
      style={{ height: "100dvh" }}
    >
      <Header
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        onNewThread={handleNewThread}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar
          threads={threads}
          activeThreadId={activeThreadId}
          isOpen={sidebarOpen}
          onNewThread={handleNewThread}
          onSelectThread={handleSelectThread}
          onClearAll={clearAll}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main: chat fills full remaining width */}
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">

          {/* Scrollable chat area */}
          <div className="flex-1 overflow-y-auto min-h-0 relative scroll-contain">
            {/* Mode toggle — floating top-right */}
            <div className="absolute top-3 right-3 z-20">
              <ModeToggle mode={mode} onChange={handleModeChange} />
            </div>

            {isEmpty ? (
              <div className="flex flex-col items-center justify-center min-h-full gap-6 px-4 py-10 md:gap-8 md:py-12">
                <div className="flex flex-col items-center gap-3 md:gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-xl shadow-purple-900/30">
                    <Sparkles size={22} className="text-white md:text-[24px]" />
                  </div>
                  <div className="text-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      What will you imagine?
                    </h1>
                    <p className="text-[#6b7280] mt-2 text-sm md:text-base">
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
                onVideoVersionChange={handleVideoVersionChange}
                onSelectOrigin={handleSelectOrigin}
                activeOrigin={origin}
              />
            )}

            {genError && (
              <div className="max-w-full md:max-w-[620px] mx-auto px-3 md:px-4 pb-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <span className="flex-1">{genError}</span>
                  <button
                    onClick={() => setGenError(null)}
                    className="w-8 h-8 flex items-center justify-center text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prompt input */}
          <div
            className="flex-shrink-0 px-3 md:px-4 pt-2 md:pt-3 border-t border-[#2a2b2e]"
            style={{ paddingBottom: "max(12px, calc(var(--safe-bottom) + 8px))" }}
          >
            <PromptInput
              prompt={prompt}
              onPromptChange={setPrompt}
              mode={mode}
              onModeChange={handleModeChange}
              imageSettings={imageSettings}
              onImageSettingsChange={setImageSettings}
              videoSettings={videoSettings}
              onVideoSettingsChange={setVideoSettings}
              origin={origin}
              onClearOrigin={() => setOrigin(null)}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              rawMode={rawMode}
              onRawModeChange={setRawMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
