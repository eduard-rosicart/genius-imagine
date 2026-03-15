"use client";

import { useEffect, useRef } from "react";
import { ChatMessage, Origin } from "@/lib/types";
import { PromptMessage } from "./PromptMessage";
import { ImageLoadingMessage } from "./ImageLoadingMessage";
import { ImageGallery } from "./ImageGallery";
import { VideoLoadingMessage } from "./VideoLoadingMessage";
import { VideoResultMessage } from "./VideoResultMessage";

interface ChatThreadProps {
  messages: ChatMessage[];
  onVideoVersionChange: (messageId: string, versionIndex: number) => void;
  onSelectOrigin: (origin: Origin) => void;
  activeOrigin: Origin | null;
}

export function ChatThread({
  messages,
  onVideoVersionChange,
  onSelectOrigin,
  activeOrigin,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const originImageUrl =
    activeOrigin?.type === "image" ? activeOrigin.imageUrl : undefined;

  return (
    <div className="flex flex-col gap-5 md:gap-6 px-3 md:px-4 py-5 md:py-6 w-full max-w-full md:max-w-[620px] lg:max-w-[680px] mx-auto">
      {messages.map((msg, idx) => {
        switch (msg.type) {
          case "prompt":
            return (
              <div key={msg.id} className="chat-message-enter" style={{ animationDelay: `${Math.min(idx * 30, 120)}ms` }}>
                <PromptMessage text={msg.text} />
              </div>
            );

          case "image-loading":
            return (
              <div key={msg.id} className="chat-message-enter">
                <ImageLoadingMessage aspectRatio={msg.aspectRatio} />
              </div>
            );

          case "image-result":
            return (
              <div key={msg.id} className="chat-message-enter">
                <ImageGallery
                  images={msg.images}
                  onSelectOrigin={onSelectOrigin}
                  activeOriginUrl={originImageUrl}
                  galleryLabel="Image"
                />
              </div>
            );

          case "video-loading":
            return (
              <div key={msg.id} className="chat-message-enter">
                <VideoLoadingMessage />
              </div>
            );

          case "video-result": {
            const isOriginVideo =
              activeOrigin?.type === "video-frame" &&
              msg.versions.some((v) => v.url === activeOrigin.videoUrl);

            return (
              <div key={msg.id} className="chat-message-enter">
                <VideoResultMessage
                  message={msg}
                  onVersionChange={onVideoVersionChange}
                  onSelectOrigin={onSelectOrigin}
                  isOrigin={isOriginVideo}
                  originFramePos={isOriginVideo ? activeOrigin?.framePosition : undefined}
                />
              </div>
            );
          }

          default:
            return null;
        }
      })}
      <div ref={bottomRef} />
    </div>
  );
}
