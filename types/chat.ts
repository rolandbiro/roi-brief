export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Re-export BriefData from new canonical location for backward compatibility
export type { BriefData } from "@/types/brief";
