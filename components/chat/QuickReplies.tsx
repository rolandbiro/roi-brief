"use client";

import type { QuickReply } from "@/types/chat";

interface QuickRepliesProps {
  options: QuickReply[];
  onSelect: (value: string | null) => void;
  disabled: boolean;
}

export function QuickReplies({ options, onSelect, disabled }: QuickRepliesProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 animate-fade-in">
      {options.map((option) => (
        <button
          key={option.label}
          onClick={() => onSelect(option.value)}
          disabled={disabled}
          className="px-4 py-2 rounded-xl border border-roi-orange/30
                     text-roi-orange text-sm font-medium
                     hover:bg-roi-orange/10 hover:border-roi-orange/60
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-95"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
