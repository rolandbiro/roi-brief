"use client";

import { useState, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Írja be válaszát...",
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-3 p-4 bg-roi-gray-darker rounded-xl">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        className="flex-1 bg-transparent border border-roi-gray-light/30 rounded-lg px-4 py-3
                   text-white placeholder-roi-gray-light/50 resize-none
                   focus:outline-none focus:border-roi-orange transition-colors"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="btn-primary px-6 self-end disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Küldés
      </button>
    </div>
  );
}
