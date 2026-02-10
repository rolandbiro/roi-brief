"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Írd be a válaszod...",
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Refocus input when it becomes enabled again (after AI response)
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = input.trim() && !disabled;

  return (
    <div className="p-4">
      <div className={cn(
        "flex gap-3 p-3 rounded-2xl transition-all duration-300",
        "bg-roi-gray-darker/80 border",
        disabled ? "border-roi-gray-light/10" : "border-roi-gray-light/20 hover:border-roi-gray-light/30",
        canSend && "border-roi-orange/30"
      )}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={2}
          className={cn(
            "flex-1 bg-transparent rounded-xl px-4 py-3",
            "text-white placeholder-roi-gray-light/50 resize-none",
            "focus:outline-none transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "self-end px-5 py-3 rounded-xl font-semibold transition-all duration-200",
            "flex items-center gap-2",
            canSend
              ? "bg-roi-orange text-black hover:bg-roi-orange-80 hover:shadow-lg hover:shadow-roi-orange/20 active:scale-95"
              : "bg-roi-gray-light/10 text-roi-gray-light/50 cursor-not-allowed"
          )}
        >
          <span>Küldés</span>
          <svg
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              canSend && "translate-x-0.5"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-roi-gray-light/40 mt-2 text-center">
        Nyomj <kbd className="px-1.5 py-0.5 bg-roi-gray-darker rounded text-roi-gray-light/60">Enter</kbd>-t a küldéshez
      </p>
    </div>
  );
}
