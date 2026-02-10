import { z } from "zod";

export const BriefBaseSchema = z.object({
  company_name: z.string().describe("Cegnev"),
  industry: z.string().describe("Iparag"),
  campaign_goal: z.string().describe("A kampany celja"),
  timing: z.string().describe("Idozites (mikor indulna, meddig tart)"),
  budget_range: z.string().describe("Budzsekeret"),
  target_audience: z.string().describe("Celcsoport"),
  existing_materials: z
    .string()
    .optional()
    .describe("Meglevo anyagok (kreativok, brandbook, stb.)"),
  previous_campaigns: z
    .string()
    .optional()
    .describe("Korabbi kampany tapasztalatok"),
  competitors: z.array(z.string()).describe("Versenytarsak"),
  notes: z.string().optional().describe("Egyeb megjegyzesek"),
});

export type BriefBase = z.infer<typeof BriefBaseSchema>;
