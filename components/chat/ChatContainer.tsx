"use client";

import { useRef, useEffect } from "react";
import { Message, QuickReply } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { QuickReplies } from "./QuickReplies";

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  streamingContent?: string;
  quickReplies?: QuickReply[] | null;
  onQuickReply?: (value: string | null) => void;
}

export function ChatContainer({
  messages,
  onSendMessage,
  isLoading = false,
  streamingContent,
  quickReplies,
  onQuickReply,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Messages area with custom scrollbar */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        {/* Filter out user messages that contain system prompts */}
        {messages
          .filter((m) => !(m.role === "user" && m.content.includes("Az ügyfél feltöltötte")))
          .map((message, index, arr) => (
            <ChatMessage
              key={message.id}
              message={message}
              skipAnimation={!streamingContent && index === arr.length - 1 && message.role === "assistant"}
            />
          ))}

        {/* Streaming message */}
        {streamingContent && (
          <ChatMessage
            message={{
              id: "streaming",
              role: "assistant",
              content: streamingContent,
              timestamp: new Date(),
            }}
            skipAnimation
          />
        )}

        {/* Loading indicator */}
        {isLoading && !streamingContent && (
          <div className="flex justify-start mb-4 animate-fade-in">
            <div className="bg-gradient-to-br from-roi-gray-darker to-roi-gray-darker/90 rounded-2xl rounded-bl-md px-5 py-4 border border-roi-gray-light/5 shadow-lg">
              <div className="flex items-center gap-3">
                {/* Animated AI icon */}
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-roi-orange to-roi-orange-80 flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-black animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                {/* Typing dots */}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-roi-orange rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-roi-orange rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-roi-orange rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-roi-gray-light text-sm ml-1">Gondolkodik...</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick-reply gombok */}
        {quickReplies && quickReplies.length > 0 && !isLoading && !streamingContent && (
          <QuickReplies
            options={quickReplies}
            onSelect={onQuickReply || (() => {})}
            disabled={isLoading}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area with subtle separator */}
      <div className="border-t border-roi-gray-light/10 bg-roi-gray-dark/50 backdrop-blur-sm">
        <ChatInput
          onSend={onSendMessage}
          disabled={isLoading}
          placeholder={isLoading ? "Gondolkodik..." : "Írd be a válaszod..."}
        />
      </div>
    </div>
  );
}
