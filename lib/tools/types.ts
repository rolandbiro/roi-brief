import type { CampaignType } from "@/lib/schemas/campaign-types";

export interface BriefState {
  detectedTypes: CampaignType[];
  confirmedTypes: CampaignType[];
  typeConfidence: "high" | "medium" | "low" | null;
  briefData: Record<string, unknown>;
  phase: "discovery" | "type_confirmed" | "questioning" | "summary" | "complete";
}

export interface ClassifyCampaignInput {
  campaign_types: CampaignType[];
  confidence: "high" | "medium" | "low";
  reasoning?: string;
}

export interface UpdateBriefInput {
  field: string;
  value: unknown;
}

export interface SuggestQuickRepliesInput {
  options: Array<{ label: string; value: string | null }>;
}

export interface ToolResult {
  output: Record<string, unknown>;
  updatedState: BriefState;
}

export function createInitialBriefState(): BriefState {
  return {
    detectedTypes: [],
    confirmedTypes: [],
    typeConfidence: null,
    briefData: {},
    phase: "discovery",
  };
}
