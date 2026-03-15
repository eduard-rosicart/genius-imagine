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
  Provider,
} from "@/lib/types";
import { generateId, truncateText } from "@/lib/utils";
import { rewritePrompt } from "@/lib/prompt-rewriter";
import {
  generateImages,
  startVideoGeneration,
  buildGeneratedVideo,
} from "@/hooks/useGeneration";
import { useVideoPolling } from "@/hooks/useVideoPolling";
import { useEternalAiParallelPolling, useEternalAiSinglePolling } from "@/hooks/useEternalAiPolling";
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
  return { type: "video-frame", thumbnailUrl: videoUrl, videoUrl, label, aspectRatio, framePosition: "end" };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Mode>("image");
  const [provider, setProvider] = useState<Provider>("xai");
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);
  const [videoSettings, setVideoSettings] = useState<VideoSettings>(DEFAULT_VIDEO_SETTINGS);

  // ── Thread ────────────────────────────────────────────────────────────────────
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>(undefined);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);

  // ── Raw mode ──────────────────────────────────────────────────────────────────
  const [rawMode, setRawMode] = useState(false);

  // ── Origin ────────────────────────────────────────────────────────────────────
  const [origin, setOrigin] = useState<Origin | null>(null);

  // ── Generation state ──────────────────────────────────────────────────────────
  const [genStatus, setGenStatus] = useState<GenerationStatus>("idle");
  const [genError, setGenError] = useState<string | null>(null);

  // Pending video metadata (shared by xAI and EternalAI video paths)
  const pendingVideoRef = useRef<{
    threadId: string;
    loadingMsgId: string;
    existingVideoMsgId?: string;
    prompt: string;
    settings: VideoSettings;
    originAspectRatio?: AspectRatio;
  } | null>(null);

  // Pending EternalAI image metadata
  const pendingEternalImgRef = useRef<{
    threadId: string;
    loadingMsgId: string;
    prompt: string;
    aspectRatio: AspectRatio;
    // partial urls as they arrive
    collectedUrls: (string | null)[];
    expectedCount: number;
  } | null>(null);

  const { threads, upsertThread, removeThread, clearAll, replaceMessage } = useThreads();

  // ── xAI video polling ─────────────────────────────────────────────────────────
  const {
    status: pollStatus,
    videoUrl: polledVideoUrl,
    videoDuration: polledDuration,
    errorMessage: pollErrorMessage,
    startPolling: startXaiVideoPolling,
    reset: resetXaiPolling,
  } = useVideoPolling();

  // ── EternalAI parallel image polling ─────────────────────────────────────────
  const {
    start: startEternalImgPolling,
    reset: resetEternalImgPolling,
  } = useEternalAiParallelPolling();

  // ── EternalAI single (video) polling ─────────────────────────────────────────
  const {
    status: eternalVidStatus,
    resultUrl: eternalVidUrl,
    errorMessage: eternalVidError,
    start: startEternalVidPolling,
    reset: resetEternalVidPolling,
  } = useEternalAiSinglePolling();

  // ── Sidebar default (open on non-mobile after hydration) ─────────────────────
  useEffect(() => {
    if (!isMobile) setSidebarOpen(true);
  }, [isMobile]);

  // ── Helper: resolve video result into thread ──────────────────────────────────
  const resolveVideoResult = useCallback((videoUrl: string, durationSec: number | null) => {
    if (!pendingVideoRef.current) return;
    const { threadId, loadingMsgId, existingVideoMsgId, prompt: vPrompt, settings, originAspectRatio } = pendingVideoRef.current;

    const newVideo = buildGeneratedVideo(vPrompt, videoUrl, durationSec, settings, originAspectRatio);

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
        id: generateId(), type: "video-result", prompt: vPrompt,
        versions: [newVideo], activeVersionIndex: 0, timestamp: Date.now(),
      };
      replaceMessage(threadId, loadingMsgId, videoMsg);
      if (activeThreadId === threadId) {
        setActiveMessages((prev) => prev.map((m) => (m.id === loadingMsgId ? videoMsg : m)));
      }
    }

    setOrigin(videoOrigin(videoUrl, newVideo.aspectRatio, `Video · end`));
    pendingVideoRef.current = null;
    setGenStatus("idle");
  }, [threads, upsertThread, replaceMessage, activeThreadId]);

  // ── xAI video polling resolution ─────────────────────────────────────────────
  useEffect(() => {
    if (pollStatus === "done" && polledVideoUrl && pendingVideoRef.current) {
      resolveVideoResult(polledVideoUrl, polledDuration);
      resetXaiPolling();
    } else if (pollStatus === "failed" || pollStatus === "expired" || pollStatus === "error") {
      setGenError(pollErrorMessage ?? "Video generation failed. Please try again.");
      setGenStatus("error");
      if (pendingVideoRef.current) {
        const { threadId, loadingMsgId } = pendingVideoRef.current;
        if (activeThreadId === threadId) {
          setActiveMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== loadingMsgId);
            const ct = threads.find((t) => t.id === threadId);
            if (ct) upsertThread({ ...ct, messages: filtered, updatedAt: Date.now() });
            return filtered;
          });
        }
      }
      pendingVideoRef.current = null;
      resetXaiPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollStatus, polledVideoUrl, pollErrorMessage]);

  // ── EternalAI video polling resolution ───────────────────────────────────────
  useEffect(() => {
    if (eternalVidStatus === "success" && eternalVidUrl && pendingVideoRef.current) {
      resolveVideoResult(eternalVidUrl, null);
      resetEternalVidPolling();
    } else if (eternalVidStatus === "failed" || eternalVidStatus === "error") {
      setGenError(eternalVidError ?? "EternalAI video generation failed. Please try again.");
      setGenStatus("error");
      if (pendingVideoRef.current) {
        const { threadId, loadingMsgId } = pendingVideoRef.current;
        if (activeThreadId === threadId) {
          setActiveMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== loadingMsgId);
            const ct = threads.find((t) => t.id === threadId);
            if (ct) upsertThread({ ...ct, messages: filtered, updatedAt: Date.now() });
            return filtered;
          });
        }
      }
      pendingVideoRef.current = null;
      resetEternalVidPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eternalVidStatus, eternalVidUrl, eternalVidError]);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const rawText = prompt.trim();
    if (!rawText || genStatus !== "idle") return;
    setGenError(null);
    const text = rawMode ? rewritePrompt(rawText, "medium") : rawText;

    const isVideoMode = mode === "video";

    // EternalAI video requires a reference image
    if (isVideoMode && provider === "eternalai") {
      const hasImageOrigin = origin?.type === "image" && !!origin?.imageUrl;
      if (!hasImageOrigin) {
        setGenError("EternalAI video requires a reference image. Generate an image first and set it as Origin.");
        return;
      }
    }

    // Resolve / create thread
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

    // ── VIDEO path ────────────────────────────────────────────────────────────────
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
          if (origin.imageUrl) apiImageUrl = origin.imageUrl;
          else apiVideoUrl = origin.videoUrl;
        }
      }

      if (!origin && existingVideoMsg) {
        const lastVid = existingVideoMsg.versions[existingVideoMsg.activeVersionIndex];
        if (lastVid) { apiVideoUrl = lastVid.url; originAspectRatio = lastVid.aspectRatio; }
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
        const requestId = await startVideoGeneration(text, videoSettings, provider, apiImageUrl, apiVideoUrl);

        // Check EternalAI fast-path sentinel
        if (requestId.startsWith("__done__:")) {
          const url = requestId.slice(9);
          resolveVideoResult(url, null);
          return;
        }

        setGenStatus("polling-video");

        if (provider === "eternalai") {
          startEternalVidPolling(requestId, "video");
        } else {
          startXaiVideoPolling(requestId);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Video generation failed";
        setGenError(msg);
        setGenStatus("error");
        upsertThread({ ...updatedThread, messages: newMessages.filter((m) => m.id !== loadingId) });
        setActiveMessages((prev) => prev.filter((m) => m.id !== loadingId));
        pendingVideoRef.current = null;
      }

    // ── IMAGE path ────────────────────────────────────────────────────────────────
    } else {
      setGenStatus("generating-image");
      const refImageUrl = origin?.type === "image" ? origin.imageUrl : undefined;
      const effectiveAspect = origin ? origin.aspectRatio : imageSettings.aspectRatio;

      try {
        const result = await generateImages(text, { ...imageSettings, aspectRatio: effectiveAspect }, provider, refImageUrl);

        // ── xAI: synchronous result ───────────────────────────────────────────────
        if (Array.isArray(result)) {
          const imgs = result;
          const resultMsg: ImageResultMessageData = {
            id: generateId(), type: "image-result", prompt: text,
            images: imgs, selectedIndex: 0, aspectRatio: effectiveAspect, timestamp: Date.now(),
          };
          const finalMessages = newMessages.map((m) => (m.id === loadingId ? resultMsg : m));
          upsertThread({ ...updatedThread, messages: finalMessages, thumbnail: updatedThread.thumbnail ?? imgs[0]?.url, updatedAt: Date.now() });
          setActiveMessages([...finalMessages]);
          setGenStatus("idle");
          if (imgs[0]) setOrigin(imageOrigin(imgs[0].url, effectiveAspect, "Image 1"));

        // ── EternalAI: async polling ──────────────────────────────────────────────
        } else {
          const { requestIds } = result;

          // Store pending metadata
          pendingEternalImgRef.current = {
            threadId: threadId!,
            loadingMsgId: loadingId,
            prompt: text,
            aspectRatio: effectiveAspect,
            collectedUrls: Array(requestIds.length).fill(null),
            expectedCount: requestIds.length,
          };

          // Stay in generating-image so the spinner keeps showing
          // The loadingMsg stays until we have at least 1 result

          startEternalImgPolling(requestIds, {
            onItemUpdate: (index, url) => {
              const pending = pendingEternalImgRef.current;
              if (!pending) return;

              pending.collectedUrls[index] = url;
              const validUrls = pending.collectedUrls.filter(Boolean) as string[];

              // Build partial result — show images as they arrive
              const partialImages = validUrls.map((u) => ({ url: u, aspectRatio: pending.aspectRatio }));
              const partialMsg: ImageResultMessageData = {
                id: generateId(), type: "image-result", prompt: pending.prompt,
                images: partialImages, selectedIndex: 0,
                aspectRatio: pending.aspectRatio, timestamp: Date.now(),
              };

              setActiveMessages((prev) => {
                // Replace loading or existing partial result
                const hasResult = prev.some((m) => m.type === "image-result" && m.prompt === pending.prompt);
                if (hasResult) {
                  return prev.map((m) =>
                    m.type === "image-result" && m.prompt === pending.prompt ? partialMsg : m
                  );
                }
                return prev.map((m) => (m.id === pending.loadingMsgId ? partialMsg : m));
              });
            },
            onAllDone: (urls) => {
              const pending = pendingEternalImgRef.current;
              if (!pending) return;

              const imgs = urls.map((u) => ({ url: u, aspectRatio: pending.aspectRatio }));
              const resultMsg: ImageResultMessageData = {
                id: generateId(), type: "image-result", prompt: pending.prompt,
                images: imgs, selectedIndex: 0,
                aspectRatio: pending.aspectRatio, timestamp: Date.now(),
              };

              // Persist to thread
              const ct = threads.find((t) => t.id === pending.threadId);
              if (ct) {
                const finalMessages = ct.messages
                  .filter((m) => m.id !== pending.loadingMsgId)
                  .filter((m) => !(m.type === "image-result" && (m as ImageResultMessageData).prompt === pending.prompt))
                  .concat(resultMsg);
                upsertThread({ ...ct, messages: finalMessages, thumbnail: ct.thumbnail ?? imgs[0]?.url, updatedAt: Date.now() });
              }

              setActiveMessages((prev) => {
                const filtered = prev
                  .filter((m) => m.id !== pending.loadingMsgId)
                  .filter((m) => !(m.type === "image-result" && (m as ImageResultMessageData).prompt === pending.prompt));
                return [...filtered, resultMsg];
              });

              if (imgs[0]) setOrigin(imageOrigin(imgs[0].url, pending.aspectRatio, "Image 1"));

              pendingEternalImgRef.current = null;
              setGenStatus("idle");
            },
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Image generation failed";
        setGenError(msg);
        setGenStatus("error");
        upsertThread({ ...updatedThread, messages: newMessages.filter((m) => m.id !== loadingId) });
        setActiveMessages((prev) => prev.filter((m) => m.id !== loadingId));
        resetEternalImgPolling();
        pendingEternalImgRef.current = null;
      }
    }
  }, [
    prompt, rawMode, genStatus, mode, provider, origin,
    imageSettings, videoSettings, activeThreadId, threads,
    upsertThread, startXaiVideoPolling, startEternalVidPolling,
    startEternalImgPolling, resetEternalImgPolling, resolveVideoResult,
  ]);

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

  const resetAllPolling = useCallback(() => {
    resetXaiPolling();
    resetEternalVidPolling();
    resetEternalImgPolling();
    pendingVideoRef.current = null;
    pendingEternalImgRef.current = null;
  }, [resetXaiPolling, resetEternalVidPolling, resetEternalImgPolling]);

  const handleSelectThread = useCallback((thread: Thread) => {
    setActiveThreadId(thread.id);
    setActiveMessages([...thread.messages]);
    setOrigin(deriveOriginFromThread(thread.messages));
    setGenStatus("idle");
    setGenError(null);
    resetAllPolling();
  }, [resetAllPolling, deriveOriginFromThread]);

  const handleNewThread = useCallback(() => {
    setActiveThreadId(undefined);
    setActiveMessages([]);
    setOrigin(null);
    setGenStatus("idle");
    setGenError(null);
    setPrompt("");
    resetAllPolling();
  }, [resetAllPolling]);

  const handleDeleteThread = useCallback((id: string) => {
    removeThread(id);
    if (id === activeThreadId) {
      setActiveThreadId(undefined);
      setActiveMessages([]);
      setOrigin(null);
      setGenStatus("idle");
      setGenError(null);
      setPrompt("");
      resetAllPolling();
    }
  }, [removeThread, activeThreadId, resetAllPolling]);

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
    <div className="flex flex-col bg-[#1e1f22] overflow-hidden" style={{ height: "100dvh" }}>
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
          onDeleteThread={handleDeleteThread}
          onClearAll={clearAll}
          onClose={() => setSidebarOpen(false)}
        />

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
                    <Sparkles size={22} className="text-white" />
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
              provider={provider}
              onProviderChange={setProvider}
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
