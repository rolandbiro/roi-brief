"use client";

import { useRef, useEffect } from "react";
import { Message } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  streamingContent?: string;
}

export function ChatContainer({
  messages,
  onSendMessage,
  isLoading = false,
  streamingContent,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {streamingContent && (
          <ChatMessage
            message={{
              id: "streaming",
              role: "assistant",
              content: streamingContent,
              timestamp: new Date(),
            }}
          />
        )}
        {isLoading && !streamingContent && (
          <div className="flex justify-start mb-4">
            <div className="bg-roi-gray-darker rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-roi-orange rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-roi-orange rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-2 h-2 bg-roi-orange rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-roi-gray-darker p-4">
        <ChatInput
          onSend={onSendMessage}
          disabled={isLoading}
          placeholder={isLoading ? "Várakozás a válaszra..." : "Írja be válaszát..."}
        />
      </div>
    </div>
  );
}
