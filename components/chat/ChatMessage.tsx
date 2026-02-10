import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";
import { ReactNode } from "react";

interface ChatMessageProps {
  message: Message;
  isNew?: boolean;
}

// Simple markdown parser for bold (**text**) and italic (*text*)
function formatMarkdown(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Check for bold (**text**)
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Check for italic (*text*) - but not **
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+?)\*(?!\*)/);

    // Find which comes first
    const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;
    const italicIndex = italicMatch ? remaining.indexOf(italicMatch[0]) : -1;

    if (boldIndex === -1 && italicIndex === -1) {
      // No more markdown, add remaining text
      parts.push(remaining);
      break;
    }

    // Process whichever comes first
    if (boldIndex !== -1 && (italicIndex === -1 || boldIndex <= italicIndex)) {
      // Add text before bold
      if (boldIndex > 0) {
        parts.push(remaining.slice(0, boldIndex));
      }
      // Add bold text
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {boldMatch![1]}
        </strong>
      );
      remaining = remaining.slice(boldIndex + boldMatch![0].length);
    } else if (italicIndex !== -1) {
      // Add text before italic
      if (italicIndex > 0) {
        parts.push(remaining.slice(0, italicIndex));
      }
      // Add italic text
      parts.push(
        <em key={key++} className="italic text-roi-orange/90">
          {italicMatch![1]}
        </em>
      );
      remaining = remaining.slice(italicIndex + italicMatch![0].length);
    }
  }

  return parts;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const displayContent = message.content.trim();

  if (!displayContent) return null;

  // Format content - split by lines and process each
  const formattedContent = displayContent.split("\n").map((line, i, arr) => (
    <span key={i}>
      {formatMarkdown(line)}
      {i < arr.length - 1 && <br />}
    </span>
  ));

  return (
    <div
      className={cn(
        "flex w-full mb-4 animate-fade-in-up",
        isUser ? "justify-end" : "justify-start"
      )}
      style={{ animationDuration: "0.3s" }}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-5 py-4 shadow-lg",
          isUser
            ? "bg-gradient-to-br from-roi-orange to-roi-orange-80 text-black rounded-br-md"
            : "bg-gradient-to-br from-roi-gray-darker to-roi-gray-darker/90 text-white rounded-bl-md border border-roi-gray-light/5"
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-roi-gray-light/10">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-roi-orange to-roi-orange-80 flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-roi-orange text-sm font-semibold tracking-wide">
              ROI Brief Asszisztens
            </span>
          </div>
        )}
        <div className={cn(
          "text-[15px] leading-relaxed",
          isUser ? "font-medium" : ""
        )}>
          {formattedContent}
        </div>
      </div>
    </div>
  );
}
