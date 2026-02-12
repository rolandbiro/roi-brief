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
    setBriefData,
    error,
    briefState,
    startChat,
    sendMessage,
    requestExtraction,
    quickReplies,
    handleQuickReply,
  } = useChat();

  // Show "Brief áttekintése" button when AI calls complete_brief tool
  // (after user confirms the summary)
  const showReviewButton =
    !briefData &&
    !isLoading &&
    briefState.phase === "complete";

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

  const handleBackToChat = () => {
    setBriefData(null);
  };

  if (briefData) {
    return <BriefEditor initialData={briefData} onBackToChat={handleBackToChat} />;
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

        {/* Brief review button — appears when campaign type is confirmed */}
        {showReviewButton && (
          <div className="mt-4 flex-shrink-0 animate-scale-in">
            <div className="relative overflow-hidden p-5 bg-gradient-to-r from-roi-orange/10 to-roi-orange/5 border border-roi-orange/30 rounded-2xl">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-roi-orange/20 rounded-full blur-2xl" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-roi-orange/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-roi-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-roi-orange text-lg">Brief kész!</h3>
                    <p className="text-sm text-roi-gray-light">
                      Az AI összegyűjtötte az adatokat. Nézd át és küldd el.
                    </p>
                  </div>
                </div>
                <button
                  onClick={requestExtraction}
                  className="btn-primary whitespace-nowrap"
                >
                  Brief áttekintése
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
