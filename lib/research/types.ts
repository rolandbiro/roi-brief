import { z } from "zod";

// --- Template típus ---

export type MediaplanTemplate =
  | "ppc_traffic"
  | "ppc_reach"
  | "ppc_mixed"
  | "all_channels";

// --- Zod schemák ---

export const KpiEstimateSchema = z.object({
  min: z.number(),
  likely: z.number(),
  max: z.number(),
});

export const ChannelRowSchema = z.object({
  campaign_target: z.string(),
  campaign_type: z.string(),
  ad_network: z.string(),
  ad_type: z.string(),
  budget_allocation_pct: z.number(),
  budget_allocation_huf: z.number(),
  // Traffic metrikák
  impressions: KpiEstimateSchema.optional(),
  ctr: KpiEstimateSchema.optional(),
  clicks: KpiEstimateSchema.optional(),
  cpc: KpiEstimateSchema.optional(),
  // Reach metrikák
  frequency: KpiEstimateSchema.optional(),
  reach: KpiEstimateSchema.optional(),
  cpm: KpiEstimateSchema.optional(),
  cpv: KpiEstimateSchema.optional(),
  // Conversion metrikák
  conversions: KpiEstimateSchema.optional(),
  cpa: KpiEstimateSchema.optional(),
});

export const TargetingRowSchema = z.object({
  ad_network: z.string(),
  age: z.string(),
  gender: z.string(),
  location: z.string(),
  interest: z.string(),
});

export const CampaignSummarySchema = z.object({
  total_budget_huf: z.number(),
  total_impressions: KpiEstimateSchema.optional(),
  total_clicks: KpiEstimateSchema.optional(),
  total_reach: KpiEstimateSchema.optional(),
  total_conversions: KpiEstimateSchema.optional(),
  overall_ctr: KpiEstimateSchema.optional(),
  overall_cpc: KpiEstimateSchema.optional(),
  overall_cpm: KpiEstimateSchema.optional(),
});

export const ResearchResultsSchema = z.object({
  template_type: z.enum(["ppc_traffic", "ppc_reach", "ppc_mixed", "all_channels"]),
  campaign_name: z.string(),
  campaign_period: z.string(),
  campaign_goal: z.string(),
  channels: z.array(ChannelRowSchema),
  targeting: z.array(TargetingRowSchema),
  summary: CampaignSummarySchema,
  research_notes: z.string(),
  sources: z.array(z.string()),
});

// --- TypeScript típusok ---

export type KpiEstimate = z.infer<typeof KpiEstimateSchema>;
export type ChannelRow = z.infer<typeof ChannelRowSchema>;
export type TargetingRow = z.infer<typeof TargetingRowSchema>;
export type CampaignSummary = z.infer<typeof CampaignSummarySchema>;
export type ResearchResults = z.infer<typeof ResearchResultsSchema>;
