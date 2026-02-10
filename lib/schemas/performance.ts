import { z } from "zod";
import { BriefBaseSchema } from "./brief-base";

export const PerformanceSpecificSchema = z.object({
  target_roas: z.string().optional().describe("Cél ROAS (Return on Ad Spend)"),
  target_cpa: z.string().optional().describe("Cél CPA (Cost per Acquisition)"),
  conversion_events: z
    .array(z.string())
    .describe("Konverziós események"),
  landing_pages: z.array(z.string()).describe("Landing page-ek"),
  ad_accounts: z
    .string()
    .optional()
    .describe("Hirdetési fiókok (Google Ads, Meta, stb.)"),
  attribution_model: z
    .string()
    .optional()
    .describe("Attribúciós modell"),
});

export const PerformanceBriefSchema = BriefBaseSchema.extend({
  campaign_type: z.literal("performance_ppc"),
  performance_specific: PerformanceSpecificSchema,
});

export type PerformanceBrief = z.infer<typeof PerformanceBriefSchema>;
