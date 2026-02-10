"use client";

import { useState, useCallback } from "react";
import { Message } from "@/types/chat";
import { BriefData } from "@/types/brief";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processStream = async (
    response: Response
  ): Promise<{ content: string; briefData: BriefData | null }> => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let extractedBriefData: BriefData | null = null;

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
            if (parsed.briefData) {
              extractedBriefData = parsed.briefData;
              setBriefData(parsed.briefData);
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }

    return { content: fullContent, briefData: extractedBriefData };
  };

  const startChat = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Szia!" }],
        }),
      });

      if (!response.ok) throw new Error("Failed to start chat");

      const { content, briefData: newBriefData } =
        await processStream(response);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        timestamp: new Date(),
      };

      setMessages([assistantMessage]);
      setStreamingContent("");

      if (newBriefData) {
        setBriefData(newBriefData);
      }
    } catch (err) {
      setError("Hiba történt a chat indítása során. Kérjük, próbálja újra.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
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

        const { content: responseContent, briefData: newBriefData } =
          await processStream(response);

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: responseContent,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent("");

        if (newBriefData) {
          setBriefData(newBriefData);
        }
      } catch (err) {
        setError(
          "Hiba történt az üzenet küldése során. Kérjük, próbálja újra."
        );
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const requestExtraction = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages,
          extractBrief: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to extract brief");

      const { content, briefData: newBriefData } =
        await processStream(response);

      if (content) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent("");
      }

      if (newBriefData) {
        setBriefData(newBriefData);
      }
    } catch (err) {
      setError(
        "Hiba történt a brief összeállítása során. Kérjük, próbálja újra."
      );
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
    requestExtraction,
  };
}
