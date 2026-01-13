import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

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
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}
