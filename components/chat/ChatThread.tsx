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
  onSelectImage: (messageId: string, index: number) => void;
  selectedImageMessageId?: string;
  selectedImageIndex?: number;
  onVideoVersionChange: (messageId: string, versionIndex: number) => void;
  onSelectOrigin: (origin: Origin) => void;
}

export function ChatThread({
  messages,
  onSelectImage,
  selectedImageMessageId,
  selectedImageIndex = 0,
  onVideoVersionChange,
  onSelectOrigin,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex flex-col gap-5 px-4 py-6 max-w-[600px] w-full mx-auto">
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

          case "image-result": {
            const isSelected = selectedImageMessageId === msg.id;
            return (
              <div key={msg.id}>
                <ImageGallery
                  images={msg.images}
                  selectedIndex={isSelected ? selectedImageIndex : -1}
                  onSelect={(i) => onSelectImage(msg.id, i)}
                  onSelectOrigin={onSelectOrigin}
                  galleryLabel="Image"
                />
              </div>
            );
          }

          case "video-loading":
            return (
              <div key={msg.id}>
                <VideoLoadingMessage />
              </div>
            );

          case "video-result":
            return (
              <div key={msg.id}>
                <VideoResultMessage
                  message={msg}
                  onVersionChange={onVideoVersionChange}
                  onSelectOrigin={onSelectOrigin}
                />
              </div>
            );

          default:
            return null;
        }
      })}
      <div ref={bottomRef} />
    </div>
  );
}
