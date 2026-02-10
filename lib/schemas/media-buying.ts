import { z } from "zod";
import { BriefBaseSchema } from "./brief-base";

export const MediaBuyingBriefSchema = BriefBaseSchema.extend({
  campaign_type: z.literal("media_buying"),
  media_specific: z.object({
    grp_target: z.string().optional().describe("Celzott GRP (Gross Rating Point)"),
    reach_target: z.string().optional().describe("Elvart eleres"),
    frequency_cap: z.string().optional().describe("Frekvencia limit"),
    media_types: z
      .array(z.string())
      .describe("Mediatipusok (TV, radio, outdoor, digital display)"),
    daypart_preferences: z
      .string()
      .optional()
      .describe("Napszak preferenciák (dayparting)"),
    viewability_requirements: z
      .string()
      .optional()
      .describe("Viewability elvarasok"),
  }),
});

export type MediaBuyingBrief = z.infer<typeof MediaBuyingBriefSchema>;
