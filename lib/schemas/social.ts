import { z } from "zod";
import { BriefBaseSchema } from "./brief-base";

export const SocialSpecificSchema = z.object({
  organic_paid_mix: z
    .string()
    .optional()
    .describe("Organikus/paid arány"),
  platforms: z
    .array(z.string())
    .describe("Platformok (Facebook, Instagram, TikTok, LinkedIn, stb.)"),
  content_types: z
    .array(z.string())
    .describe("Tartalom típusok (kép, videó, story, reel, stb.)"),
  community_management: z
    .string()
    .optional()
    .describe("Közösségkezelés"),
  influencer_plan: z
    .string()
    .optional()
    .describe("Influencer terv"),
  posting_frequency: z
    .string()
    .optional()
    .describe("Posztolási gyakoriság"),
});

export const SocialBriefSchema = BriefBaseSchema.extend({
  campaign_type: z.literal("social_media"),
  social_specific: SocialSpecificSchema,
});

export type SocialBrief = z.infer<typeof SocialBriefSchema>;
