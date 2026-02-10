"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { BriefEditor } from "@/components/BriefEditor";

export default function BriefPage() {
  const router = useRouter();
  const chatStartedRef = useRef(false);

  const {
    messages,
    isLoading,
    streamingContent,
    briefData,
    error,
    startChat,
    sendMessage,
    quickReplies,
    handleQuickReply,
  } = useChat();

  // Start chat automatically on mount (only once)
  useEffect(() => {
    if (!chatStartedRef.current) {
      chatStartedRef.current = true;
      startChat();
    }
  }, [startChat]);

  const handleNewBrief = () => {
    router.push("/");
  };

  if (briefData) {
    return <BriefEditor initialData={briefData} />;
  }

  return (
    <div className="container mx-auto px-6 py-8 h-[calc(100vh-5rem)]">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0 animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-black">
              Brief <span className="text-roi-orange">kitöltés</span>
            </h1>
          </div>
          <button onClick={handleNewBrief} className="btn-secondary text-sm">
            Új brief
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex-shrink-0 animate-scale-in flex items-center gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Chat container */}
        <div className="flex-1 min-h-0">
          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            streamingContent={streamingContent}
            onSendMessage={sendMessage}
            quickReplies={quickReplies}
            onQuickReply={handleQuickReply}
          />
        </div>
      </div>
    </div>
  );
}
