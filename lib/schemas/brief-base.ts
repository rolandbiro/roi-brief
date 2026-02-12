import { z } from "zod";

export const BriefBaseSchema = z.object({
  // === Alapvető információk ===
  company_name: z.string().describe("Cégnév"),
  contact_name: z.string().optional().describe("Kapcsolattartó neve"),
  industry: z.string().optional().describe("Cég tevékenységi köre"),
  brand_positioning: z.string().optional().describe("Márka pozicionálása"),

  // === Kampány részletek ===
  campaign_name: z.string().optional().describe("Kampány neve"),
  campaign_goal: z.string().describe("Kampány célja"),
  main_message: z.string().optional().describe("Fő üzenet"),
  creative_source: z.array(z.string()).optional().describe("Kreatívok forrása"),
  creative_types: z.array(z.string()).optional().describe("Kreatív típusok"),
  communication_style: z.string().optional().describe("Kommunikációs stílus"),

  // === Csatornák és KPI-k ===
  ad_channels: z.array(z.string()).optional().describe("Online hirdetési csatornák"),
  kpis: z.array(z.string()).optional().describe("KPI-k"),

  // === Célcsoport ===
  gender: z.array(z.string()).optional().describe("Nem"),
  location: z.string().optional().describe("Lakóhely"),
  age_range: z.string().optional().describe("Kor"),
  psychographics: z.string().optional().describe("Pszichográfiai adatok"),
  persona: z.string().optional().describe("Ideális ügyfélprofil (Persona)"),

  // === Időzítés ===
  start_date: z.string().optional().describe("Indulási dátum"),
  end_date: z.string().optional().describe("Zárási dátum"),
  key_events: z.string().optional().describe("Fontos események"),

  // === Költségvetés ===
  budget_range: z.string().optional().describe("Allokált büdzsé (Ft)"),
  budget_allocation: z.string().optional().describe("Platformonkénti elosztási preferencia"),

  // === Versenytársak ===
  competitors: z.array(z.string()).optional().describe("Fő versenytársak"),
  inspiring_campaigns: z.string().optional().describe("Inspiráló kampányok vagy márkák"),

  // === Egyéb ===
  existing_materials: z.string().optional().describe("Meglévő anyagok"),
  previous_campaigns: z.string().optional().describe("Korábbi kampány tapasztalatok"),
  notes: z.string().optional().describe("Egyéb megjegyzések"),
});

export type BriefBase = z.infer<typeof BriefBaseSchema>;
