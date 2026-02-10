export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface QuickReply {
  label: string;
  value: string | null; // null = szabad szoveg (fokusz az input mezore)
}

// Re-export BriefData from new canonical location for backward compatibility
export type { BriefData } from "@/types/brief";
