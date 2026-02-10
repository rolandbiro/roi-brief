import { z } from "zod";
import { MediaBuyingBriefSchema } from "./media-buying";
import { PerformanceBriefSchema } from "./performance";
import { BrandBriefSchema } from "./brand";
import { SocialBriefSchema } from "./social";

export const BriefDataSchema = z.discriminatedUnion("campaign_type", [
  MediaBuyingBriefSchema,
  PerformanceBriefSchema,
  BrandBriefSchema,
  SocialBriefSchema,
]);

export type BriefData = z.infer<typeof BriefDataSchema>;
