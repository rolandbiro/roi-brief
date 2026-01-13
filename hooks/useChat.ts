"use client";

import { useState, useCallback } from "react";
import { Message, BriefData } from "@/types/chat";
import { createInitialMessage } from "@/lib/prompts";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkForBriefData = (content: string) => {
    const jsonMatch = content.match(/BRIEF_JSON_START\s*([\s\S]*?)\s*BRIEF_JSON_END/);
    if (jsonMatch) {
      try {
        const briefJson = JSON.parse(jsonMatch[1]);
        setBriefData(briefJson);
      } catch (err) {
        console.error("Failed to parse brief JSON:", err);
      }
    }
  };

  const processStream = async (response: Response): Promise<string> => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullContent += parsed.text;
              setStreamingContent(fullContent);
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }

    return fullContent;
  };

  const startChat = useCallback(async (pdfBase64: string, pdfText: string) => {
    setIsLoading(true);
    setError(null);

    const initialUserMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: createInitialMessage(pdfText || "Az ajánlat tartalma nem volt kiolvasható, de az ügyfél szeretné kitölteni a briefet."),
      timestamp: new Date(),
    };

    setMessages([initialUserMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: initialUserMessage.content }],
        }),
      });

      if (!response.ok) throw new Error("Failed to start chat");

      const fullContent = await processStream(response);

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");

      // Check if brief data is in the response
      checkForBriefData(fullContent);
    } catch (err) {
      setError("Hiba történt a chat indítása során. Kérjük, próbálja újra.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const allMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const fullContent = await processStream(response);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");

      checkForBriefData(fullContent);
    } catch (err) {
      setError("Hiba történt az üzenet küldése során. Kérjük, próbálja újra.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return {
    messages,
    isLoading,
    streamingContent,
    briefData,
    error,
    startChat,
    sendMessage,
    setBriefData,
  };
}
