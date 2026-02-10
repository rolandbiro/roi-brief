import { z } from "zod";
import { CampaignTypeEnum } from "./campaign-types";
import { BriefBaseSchema } from "./brief-base";
import { MediaSpecificSchema } from "./media-buying";
import { PerformanceSpecificSchema } from "./performance";
import { BrandSpecificSchema } from "./brand";
import { SocialSpecificSchema } from "./social";

export const BriefDataSchema = BriefBaseSchema.extend({
  campaign_types: z.array(CampaignTypeEnum)
    .min(1)
    .describe("Kampánytípus(ok) — egy vagy több"),
  media_specific: MediaSpecificSchema.optional()
    .describe("Médiavásárlás specifikus adatok"),
  performance_specific: PerformanceSpecificSchema.optional()
    .describe("Performance/PPC specifikus adatok"),
  brand_specific: BrandSpecificSchema.optional()
    .describe("Brand/awareness specifikus adatok"),
  social_specific: SocialSpecificSchema.optional()
    .describe("Social media specifikus adatok"),
});

export type BriefData = z.infer<typeof BriefDataSchema>;
