import { z } from "zod";

export const CampaignTypeEnum = z.enum([
  "media_buying",
  "performance_ppc",
  "brand_awareness",
  "social_media",
]);

export type CampaignType = z.infer<typeof CampaignTypeEnum>;

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  media_buying: "Médiavásárlás",
  performance_ppc: "Performance/PPC",
  brand_awareness: "Brand/Awareness",
  social_media: "Social Media",
};
