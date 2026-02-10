import type { BriefData, CampaignType } from "@/types/brief";
import { CAMPAIGN_TYPE_LABELS } from "@/types/brief";

// --- Utility helpers (inline for HTML string generation) ---

function hasValue(val: unknown): boolean {
  if (val === null || val === undefined || val === "") return false;
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function formatValue(val: unknown): string {
  if (Array.isArray(val)) return val.join(", ");
  return String(val);
}

// --- Section definitions (duplicated from brief-sections.ts — necessary because we generate HTML strings, not React) ---

interface FieldDef {
  label: string;
  path: string;
}

interface SectionDef {
  title: string;
  fields: FieldDef[];
}

const EXECUTIVE_SUMMARY: SectionDef = {
  title: "Összefoglaló",
  fields: [
    { label: "Cégnév", path: "company_name" },
    { label: "Kampány célja", path: "campaign_goal" },
    { label: "Büdzsé", path: "budget_range" },
    { label: "Célcsoport", path: "target_audience" },
  ],
};

const BASE_SECTIONS: SectionDef[] = [
  {
    title: "Cégadatok",
    fields: [
      { label: "Cégnév", path: "company_name" },
      { label: "Iparág", path: "industry" },
    ],
  },
  {
    title: "Kampány",
    fields: [
      { label: "Kampány célja", path: "campaign_goal" },
      { label: "Időzítés", path: "timing" },
      { label: "Büdzsé", path: "budget_range" },
      { label: "Célcsoport", path: "target_audience" },
    ],
  },
  {
    title: "Egyéb",
    fields: [
      { label: "Meglévő anyagok", path: "existing_materials" },
      { label: "Korábbi kampányok", path: "previous_campaigns" },
      { label: "Versenytársak", path: "competitors" },
      { label: "Megjegyzések", path: "notes" },
    ],
  },
];

const TYPE_SECTIONS: Record<CampaignType, SectionDef> = {
  media_buying: {
    title: "Médiavásárlás részletek",
    fields: [
      { label: "Célzott GRP", path: "media_specific.grp_target" },
      { label: "Elvárt elérés", path: "media_specific.reach_target" },
      { label: "Frekvencia limit", path: "media_specific.frequency_cap" },
      { label: "Médiatípusok", path: "media_specific.media_types" },
      { label: "Napszak preferenciák", path: "media_specific.daypart_preferences" },
      { label: "Viewability elvárások", path: "media_specific.viewability_requirements" },
    ],
  },
  performance_ppc: {
    title: "Performance/PPC részletek",
    fields: [
      { label: "Cél ROAS", path: "performance_specific.target_roas" },
      { label: "Cél CPA", path: "performance_specific.target_cpa" },
      { label: "Konverziós események", path: "performance_specific.conversion_events" },
      { label: "Landing page-ek", path: "performance_specific.landing_pages" },
      { label: "Hirdetési fiókok", path: "performance_specific.ad_accounts" },
      { label: "Attribúciós modell", path: "performance_specific.attribution_model" },
    ],
  },
  brand_awareness: {
    title: "Brand/Awareness részletek",
    fields: [
      { label: "Brand lift cél", path: "brand_specific.brand_lift_target" },
      { label: "Üzenetrecall cél", path: "brand_specific.message_recall_target" },
      { label: "Kreatív koncepció", path: "brand_specific.creative_concept" },
      { label: "Hangvétel", path: "brand_specific.tonality" },
      { label: "Pozicionálás", path: "brand_specific.positioning" },
      { label: "Awareness csatornák", path: "brand_specific.awareness_channels" },
    ],
  },
  social_media: {
    title: "Social Media részletek",
    fields: [
      { label: "Organikus/paid arány", path: "social_specific.organic_paid_mix" },
      { label: "Platformok", path: "social_specific.platforms" },
      { label: "Tartalomtípusok", path: "social_specific.content_types" },
      { label: "Közösségkezelés", path: "social_specific.community_management" },
      { label: "Influencer terv", path: "social_specific.influencer_plan" },
      { label: "Posztolási gyakoriság", path: "social_specific.posting_frequency" },
    ],
  },
};

// --- HTML generation ---

function renderSectionHtml(
  section: SectionDef,
  dataRecord: Record<string, unknown>,
  bgColor: string,
): string {
  const filledFields = section.fields.filter((f) =>
    hasValue(getNestedValue(dataRecord, f.path)),
  );
  if (filledFields.length === 0) return "";

  const rows = filledFields
    .map((f) => {
      const val = getNestedValue(dataRecord, f.path);
      // campaign_types special formatting
      if (f.path === "campaign_types" && Array.isArray(val)) {
        const formatted = val
          .map((t: string) => CAMPAIGN_TYPE_LABELS[t as CampaignType] ?? t)
          .join(", ");
        return `<tr>
          <td style="padding: 5px 0; color: #3C3E43; font-size: 13px; width: 140px;">${f.label}:</td>
          <td style="padding: 5px 0; color: #2A2B2E; font-size: 13px;">${formatted}</td>
        </tr>`;
      }
      return `<tr>
        <td style="padding: 5px 0; color: #3C3E43; font-size: 13px; width: 140px;">${f.label}:</td>
        <td style="padding: 5px 0; color: #2A2B2E; font-size: 13px;">${formatValue(val)}</td>
      </tr>`;
    })
    .join("");

  return `<tr>
    <td style="padding: 25px 30px; background-color: ${bgColor};">
      <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #FF6400; border-bottom: 1px solid #E3E3E3; padding-bottom: 8px;">
        ${section.title}
      </h3>
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        ${rows}
      </table>
    </td>
  </tr>`;
}

export function generateEmailHtml(data: BriefData, clientEmail?: string): string {
  const today = new Date().toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dataRecord = data as unknown as Record<string, unknown>;

  // Campaign type badges
  const badges = data.campaign_types
    .map(
      (type) =>
        `<span style="display: inline-block; background-color: #FF6400; color: #FFFFFF; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 4px; margin-right: 6px;">${CAMPAIGN_TYPE_LABELS[type]}</span>`,
    )
    .join("");

  // Collect type-specific sections
  const typeSections = data.campaign_types
    .map((type) => TYPE_SECTIONS[type])
    .filter(Boolean);

  // Render all sections, alternating background
  const allSections: SectionDef[] = [
    EXECUTIVE_SUMMARY,
    ...BASE_SECTIONS,
    ...typeSections,
  ];

  let sectionIndex = 0;
  const sectionHtml = allSections
    .map((section) => {
      const bg = sectionIndex % 2 === 0 ? "#ffffff" : "#f9f9f9";
      const html = renderSectionHtml(section, dataRecord, bg);
      if (html) sectionIndex++;
      return html;
    })
    .join("");

  // Client email info row (for ROI Works team reference)
  const clientEmailRow = clientEmail
    ? `<tr>
        <td style="padding: 15px 30px; background-color: #FFF8F0; border-bottom: 2px solid #FF6400;">
          <p style="margin: 0; font-size: 13px; color: #3C3E43;">
            <strong style="color: #2A2B2E;">Érdeklődő email:</strong>
            <a href="mailto:${clientEmail}" style="color: #0022D2; text-decoration: none;">${clientEmail}</a>
          </p>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kampány Brief - ${data.company_name || "Új brief"}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #2A2B2E; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: #ffffff;">
                ROI <span style="color: #FF6400;">WORKS</span>
              </h1>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #E3E3E3;">
                Kampány Brief &bull; ${today}
              </p>
            </td>
          </tr>

          <!-- Campaign type badges -->
          <tr>
            <td style="padding: 20px 30px; text-align: center; border-bottom: 2px solid #FF6400;">
              ${badges}
            </td>
          </tr>

          <!-- Client email (for ROI Works team) -->
          ${clientEmailRow}

          <!-- Dynamic sections -->
          ${sectionHtml}

          <!-- Footer -->
          <tr>
            <td style="background-color: #2A2B2E; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #E3E3E3;">
                Ez a brief a ROI Works AI asszisztensével készült.
              </p>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #3C3E43;">
                &copy; ${new Date().getFullYear()} ROI Works. Minden jog fenntartva.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
