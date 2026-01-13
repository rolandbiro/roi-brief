"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { BriefEditor } from "@/components/BriefEditor";

// Helper to read PDF from sessionStorage (uses lazy initializer to avoid effect setState)
function usePdfData() {
  const [pdfData] = useState<{ name: string; base64: string } | null>(() => {
    // This runs only once during initial render (client-side)
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem("proposalPdf");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });

  return pdfData;
}

export default function BriefPage() {
  const router = useRouter();
  const pdfData = usePdfData();
  const [hideEditor, setHideEditor] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const chatStartedRef = useRef(false);

  const {
    messages,
    isLoading,
    streamingContent,
    briefData,
    error,
    startChat,
    sendMessage,
  } = useChat();

  // Derive showEditor from briefData (no effect needed)
  const showEditor = useMemo(() => {
    return briefData !== null && !hideEditor;
  }, [briefData, hideEditor]);

  // Redirect if no PDF data
  useEffect(() => {
    if (pdfData === null) {
      router.push("/");
    }
  }, [pdfData, router]);

  // Parse PDF and start chat when PDF data is available (only once)
  useEffect(() => {
    if (pdfData && !chatStartedRef.current) {
      chatStartedRef.current = true;
      setIsParsing(true);

      // Extract text from PDF
      fetch("/api/parse-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: pdfData.base64 }),
      })
        .then((res) => res.json())
        .then((data) => {
          setIsParsing(false);
          startChat(pdfData.base64, data.text || "");
        })
        .catch(() => {
          setIsParsing(false);
          startChat(pdfData.base64, "");
        });
    }
  }, [pdfData, startChat]);

  const handleNewBrief = () => {
    sessionStorage.removeItem("proposalPdf");
    router.push("/");
  };

  const handleBackToChat = () => {
    setHideEditor(true);
  };

  if (pdfData === null) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-roi-orange border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (isParsing) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-roi-orange/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-16 h-16 border-4 border-roi-orange border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">PDF feldolgozása</h2>
          <p className="text-roi-gray-light">Az ajánlat elemzése folyamatban...</p>
        </div>
      </div>
    );
  }

  if (showEditor && briefData) {
    return <BriefEditor initialData={briefData} onBack={handleBackToChat} />;
  }

  return (
    <div className="container mx-auto px-6 py-8 h-[calc(100vh-5rem)]">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        {/* Header with animation */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0 animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-black">
              Brief <span className="text-roi-orange">kitöltés</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-2 px-3 py-1 bg-roi-gray-darker rounded-full">
                <svg
                  className="w-4 h-4 text-roi-orange"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm text-roi-gray-light">{pdfData.name}</span>
              </div>
            </div>
          </div>
          <button onClick={handleNewBrief} className="btn-secondary text-sm">
            Új brief
          </button>
        </div>

        {/* Error message with animation */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex-shrink-0 animate-scale-in flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          />
        </div>

        {/* Brief ready indicator with animation */}
        {briefData && !showEditor && (
          <div className="mt-4 flex-shrink-0 animate-scale-in">
            <div className="relative overflow-hidden p-5 bg-gradient-to-r from-roi-orange/10 to-roi-orange/5 border border-roi-orange/30 rounded-2xl">
              {/* Decorative glow */}
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
                      Az AI összegyűjtötte az adatokat. Ellenőrizze és küldje el.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setHideEditor(false)}
                  className="btn-primary whitespace-nowrap"
                >
                  Brief megtekintése
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
