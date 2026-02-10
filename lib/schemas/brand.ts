import { z } from "zod";
import { BriefBaseSchema } from "./brief-base";

export const BrandSpecificSchema = z.object({
  brand_lift_target: z
    .string()
    .optional()
    .describe("Brand lift cél (%)"),
  message_recall_target: z
    .string()
    .optional()
    .describe("Üzenetrecall cél (%)"),
  creative_concept: z
    .string()
    .optional()
    .describe("Kreatív koncepció"),
  tonality: z.string().optional().describe("Hangvétel/tonalitás"),
  positioning: z.string().optional().describe("Pozicionálás"),
  awareness_channels: z
    .array(z.string())
    .describe("Awareness csatornák"),
});

export const BrandBriefSchema = BriefBaseSchema.extend({
  campaign_type: z.literal("brand_awareness"),
  brand_specific: BrandSpecificSchema,
});

export type BrandBrief = z.infer<typeof BrandBriefSchema>;
