"use client";

interface PromptMessageProps {
  text: string;
}

export function PromptMessage({ text }: PromptMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-[#2a2b2e] border border-[#3a3b3e] text-[#e8e8e8] text-[15px] leading-relaxed">
        {text}
      </div>
    </div>
  );
}
