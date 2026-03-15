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
    <div className="flex flex-col gap-6 px-4 py-6 max-w-[620px] w-full mx-auto">
      {messages.map((msg) => {
        switch (msg.type) {
          case "prompt":
            return <PromptMessage key={msg.id} text={msg.text} />;

          case "image-loading":
            return (
              <div key={msg.id}>
                <ImageLoadingMessage aspectRatio={msg.aspectRatio} />
              </div>
            );

          case "image-result":
            return (
              <div key={msg.id}>
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
              <div key={msg.id}>
                <VideoLoadingMessage />
              </div>
            );

          case "video-result": {
            const isOriginVideo =
              activeOrigin?.type === "video-frame" &&
              msg.versions.some((v) => v.url === activeOrigin.videoUrl);

            return (
              <div key={msg.id}>
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
