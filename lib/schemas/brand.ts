import { z } from "zod";
import { BriefBaseSchema } from "./brief-base";

export const BrandBriefSchema = BriefBaseSchema.extend({
  campaign_type: z.literal("brand_awareness"),
  brand_specific: z.object({
    brand_lift_target: z
      .string()
      .optional()
      .describe("Brand lift cel (%)"),
    message_recall_target: z
      .string()
      .optional()
      .describe("Uzenetrecall cel (%)"),
    creative_concept: z
      .string()
      .optional()
      .describe("Kreativ koncepcio"),
    tonality: z.string().optional().describe("Hangvetel/tonalitas"),
    positioning: z.string().optional().describe("Pozicionalas"),
    awareness_channels: z
      .array(z.string())
      .describe("Awareness csatornak"),
  }),
});

export type BrandBrief = z.infer<typeof BrandBriefSchema>;
