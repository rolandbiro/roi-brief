import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";
import { ReactNode } from "react";

interface ChatMessageProps {
  message: Message;
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
        <strong key={key++} className="font-bold">
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
        <em key={key++} className="italic">
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

  // Format content - split by lines and process each
  const formattedContent = message.content.split("\n").map((line, i, arr) => (
    <span key={i}>
      {formatMarkdown(line)}
      {i < arr.length - 1 && <br />}
    </span>
  ));

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-roi-orange text-black rounded-br-sm"
            : "bg-roi-gray-darker text-white rounded-bl-sm"
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-roi-orange flex items-center justify-center">
              <span className="text-black text-xs font-bold">AI</span>
            </div>
            <span className="text-roi-orange text-sm font-medium">
              ROI Brief Asszisztens
            </span>
          </div>
        )}
        <div>{formattedContent}</div>
      </div>
    </div>
  );
}
