export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface QuickReply {
  label: string;
  value: string | null; // null = szabad szöveg (fókusz az input mezőre)
}

// Re-export BriefData from new canonical location for backward compatibility
export type { BriefData } from "@/types/brief";
