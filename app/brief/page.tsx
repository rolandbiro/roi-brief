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
        <div className="flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-roi-orange border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (isParsing) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-roi-orange border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-roi-gray-light">PDF feldolgozása...</p>
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-black">
              Brief <span className="text-roi-orange">kitöltés</span>
            </h1>
            <p className="text-sm text-roi-gray-light flex items-center gap-2">
              <svg
                className="w-4 h-4"
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
              {pdfData.name}
            </p>
          </div>
          <button onClick={handleNewBrief} className="btn-secondary text-sm">
            Új brief
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex-shrink-0">
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

        {/* Brief ready indicator */}
        {briefData && !showEditor && (
          <div className="mt-4 p-4 bg-roi-orange/20 border border-roi-orange/50 rounded-lg flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-roi-orange">Brief kész!</h3>
                <p className="text-sm text-roi-gray-light">
                  Az AI összegyűjtötte az adatokat. Ellenőrizze és küldje el.
                </p>
              </div>
              <button
                onClick={() => setHideEditor(false)}
                className="btn-primary"
              >
                Brief megtekintése
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
