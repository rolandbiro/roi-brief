import { z } from "zod";
import { BriefBaseSchema } from "./brief-base";

export const PerformanceBriefSchema = BriefBaseSchema.extend({
  campaign_type: z.literal("performance_ppc"),
  performance_specific: z.object({
    target_roas: z.string().optional().describe("Cel ROAS (Return on Ad Spend)"),
    target_cpa: z.string().optional().describe("Cel CPA (Cost per Acquisition)"),
    conversion_events: z
      .array(z.string())
      .describe("Konverzios esemenyek"),
    landing_pages: z.array(z.string()).describe("Landing page-ek"),
    ad_accounts: z
      .string()
      .optional()
      .describe("Hirdetesi fiokok (Google Ads, Meta, stb.)"),
    attribution_model: z
      .string()
      .optional()
      .describe("Attribucios modell"),
  }),
});

export type PerformanceBrief = z.infer<typeof PerformanceBriefSchema>;
