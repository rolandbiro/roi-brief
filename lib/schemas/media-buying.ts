import { z } from "zod";
import { BriefBaseSchema } from "./brief-base";

export const MediaSpecificSchema = z.object({
  grp_target: z.string().optional().describe("Célzott GRP (Gross Rating Point)"),
  reach_target: z.string().optional().describe("Elvárt elérés"),
  frequency_cap: z.string().optional().describe("Frekvencia limit"),
  media_types: z
    .array(z.string())
    .describe("Médiatípusok (TV, rádió, outdoor, digital display)"),
  daypart_preferences: z
    .string()
    .optional()
    .describe("Napszak preferenciák (dayparting)"),
  viewability_requirements: z
    .string()
    .optional()
    .describe("Viewability elvárások"),
});

export const MediaBuyingBriefSchema = BriefBaseSchema.extend({
  campaign_type: z.literal("media_buying"),
  media_specific: MediaSpecificSchema,
});

export type MediaBuyingBrief = z.infer<typeof MediaBuyingBriefSchema>;
