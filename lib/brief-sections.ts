import { BriefData, CampaignType, CAMPAIGN_TYPE_LABELS } from "@/types/brief";

export interface FieldDef {
  key: string;
  label: string;
}

export interface SectionDef {
  title: string;
  fields: FieldDef[];
  condition?: (data: BriefData) => boolean;
}

export function hasValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

export function getNestedValue(
  obj: Record<string, unknown>,
  path: string,
): unknown {
  return path
    .split(".")
    .reduce(
      (acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
      obj as unknown,
    );
}

export function formatValue(value: unknown): string | null {
  if (!hasValue(value)) return null;
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function formatCampaignTypes(types: string[] | undefined): string | null {
  if (!types || types.length === 0) return null;
  return types
    .map((t) => CAMPAIGN_TYPE_LABELS[t as CampaignType] ?? t)
    .join(", ");
}

export const AGENCY_BRIEF_SECTIONS: SectionDef[] = [
  {
    title: "Alapvető információk",
    fields: [
      { key: "company_name", label: "Cégnév" },
      { key: "contact_name", label: "Kapcsolattartó" },
      { key: "industry", label: "Tevékenységi kör" },
      { key: "brand_positioning", label: "Márka pozicionálás" },
    ],
  },
  {
    title: "Kampány részletek",
    fields: [
      { key: "campaign_name", label: "Kampány neve" },
      { key: "campaign_types", label: "Kampánytípusok" },
      { key: "campaign_goal", label: "Kampány célja" },
      { key: "main_message", label: "Fő üzenet" },
      { key: "communication_style", label: "Kommunikációs stílus" },
      { key: "creative_source", label: "Kreatívok forrása" },
      { key: "creative_types", label: "Kreatív típusok" },
    ],
  },
  {
    title: "Csatornák és mérés",
    fields: [
      { key: "ad_channels", label: "Hirdetési csatornák" },
      { key: "kpis", label: "KPI-k" },
    ],
  },
  {
    title: "Célcsoport",
    fields: [
      { key: "gender", label: "Nem" },
      { key: "age_range", label: "Kor" },
      { key: "location", label: "Lakóhely" },
      { key: "psychographics", label: "Érdeklődés, szokások" },
      { key: "persona", label: "Persona" },
    ],
  },
  {
    title: "Időzítés",
    fields: [
      { key: "start_date", label: "Indulás" },
      { key: "end_date", label: "Zárás" },
      { key: "key_events", label: "Fontos események" },
    ],
  },
  {
    title: "Költségvetés",
    fields: [
      { key: "budget_range", label: "Büdzsé" },
      { key: "budget_allocation", label: "Platformonkénti elosztás" },
    ],
  },
  {
    title: "Versenytársak",
    fields: [
      { key: "competitors", label: "Fő versenytársak" },
      { key: "inspiring_campaigns", label: "Inspiráló kampányok" },
    ],
  },
  {
    title: "Egyéb",
    fields: [
      { key: "existing_materials", label: "Meglévő anyagok" },
      { key: "previous_campaigns", label: "Korábbi kampányok" },
      { key: "notes", label: "Megjegyzések" },
    ],
  },
];

export const TYPE_SECTIONS: Record<CampaignType, SectionDef> = {
  media_buying: {
    title: "Médiavásárlás részletek",
    fields: [
      { key: "media_specific.grp_target", label: "Célzott GRP" },
      { key: "media_specific.reach_target", label: "Elvárt elérés" },
      { key: "media_specific.frequency_cap", label: "Frekvencia limit" },
      { key: "media_specific.media_types", label: "Médiatípusok" },
      {
        key: "media_specific.daypart_preferences",
        label: "Napszak preferenciák",
      },
      {
        key: "media_specific.viewability_requirements",
        label: "Viewability elvárások",
      },
    ],
    condition: (data) => !!data.campaign_types?.includes("media_buying"),
  },
  performance_ppc: {
    title: "Performance/PPC részletek",
    fields: [
      { key: "performance_specific.target_cpa", label: "Cél CPA" },
      { key: "performance_specific.target_roas", label: "Cél ROAS" },
      {
        key: "performance_specific.conversion_events",
        label: "Konverziós események",
      },
      { key: "performance_specific.landing_pages", label: "Landing page-ek" },
      { key: "performance_specific.ad_accounts", label: "Hirdetési fiókok" },
      {
        key: "performance_specific.attribution_model",
        label: "Attribúciós modell",
      },
    ],
    condition: (data) => !!data.campaign_types?.includes("performance_ppc"),
  },
  brand_awareness: {
    title: "Brand/Awareness részletek",
    fields: [
      { key: "brand_specific.brand_lift_target", label: "Brand lift cél" },
      {
        key: "brand_specific.message_recall_target",
        label: "Üzenetrecall cél",
      },
      { key: "brand_specific.creative_concept", label: "Kreatív koncepció" },
      { key: "brand_specific.tonality", label: "Hangvétel/tonalitás" },
      { key: "brand_specific.positioning", label: "Pozicionálás" },
      {
        key: "brand_specific.awareness_channels",
        label: "Awareness csatornák",
      },
    ],
    condition: (data) => !!data.campaign_types?.includes("brand_awareness"),
  },
  social_media: {
    title: "Social Media részletek",
    fields: [
      { key: "social_specific.platforms", label: "Platformok" },
      {
        key: "social_specific.organic_paid_mix",
        label: "Organikus/fizetett arány",
      },
      { key: "social_specific.content_types", label: "Tartalomtípusok" },
      {
        key: "social_specific.community_management",
        label: "Közösségkezelés",
      },
      { key: "social_specific.influencer_plan", label: "Influencer terv" },
      {
        key: "social_specific.posting_frequency",
        label: "Posztolási gyakoriság",
      },
    ],
    condition: (data) => !!data.campaign_types?.includes("social_media"),
  },
};

export function getActiveSections(
  data: BriefData,
): Array<{ title: string; fields: Array<{ label: string; value: string }> }> {
  const dataRecord = data as unknown as Record<string, unknown>;

  const allSections: SectionDef[] = [
    ...AGENCY_BRIEF_SECTIONS,
    ...Object.entries(TYPE_SECTIONS)
      .filter(([, section]) => !section.condition || section.condition(data))
      .map(([, section]) => section),
  ];

  return allSections
    .map((section) => ({
      title: section.title,
      fields: section.fields
        .map((f) => {
          const raw = getNestedValue(dataRecord, f.key);
          const value =
            f.key === "campaign_types"
              ? formatCampaignTypes(raw as string[] | undefined)
              : formatValue(raw);
          return { label: f.label, value: value! };
        })
        .filter((f) => f.value !== null && f.value !== undefined),
    }))
    .filter((s) => s.fields.length > 0);
}
