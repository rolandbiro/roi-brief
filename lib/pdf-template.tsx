import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import "@/lib/pdf-fonts";
import { PdfLogo } from "@/lib/pdf-logo";
import type { BriefData, CampaignType } from "@/types/brief";
import { CAMPAIGN_TYPE_LABELS } from "@/types/brief";

const colors = {
  orange: "#FF6400",
  blue: "#0022D2",
  dark: "#2A2B2E",
  gray: "#3C3E43",
  light: "#E3E3E3",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Archivo",
    padding: 40,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.orange,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 900,
    color: colors.dark,
  },
  logoTextAccent: {
    color: colors.orange,
  },
  date: {
    fontSize: 10,
    color: colors.gray,
  },
  campaignTypes: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 20,
  },
  typeBadge: {
    backgroundColor: colors.orange,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 8,
    color: colors.white,
    fontWeight: 700,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.orange,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    color: colors.gray,
    width: 140,
  },
  value: {
    fontSize: 10,
    color: colors.dark,
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: colors.gray,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.light,
  },
});

// --- Utility functions ---

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

// --- Section definitions ---

interface FieldDef {
  label: string;
  path: string;
}

interface SectionDef {
  title: string;
  fields: FieldDef[];
}

const EXECUTIVE_SUMMARY: SectionDef = {
  title: "Executive Summary",
  fields: [
    { label: "Cégnév", path: "company_name" },
    { label: "Kampány célja", path: "campaign_goal" },
    { label: "Büdzsékeret", path: "budget_range" },
    { label: "Célcsoport", path: "target_audience" },
  ],
};

const BASE_SECTIONS: SectionDef[] = [
  {
    title: "Alapadatok",
    fields: [
      { label: "Cégnév", path: "company_name" },
      { label: "Iparág", path: "industry" },
      { label: "Kampány célja", path: "campaign_goal" },
      { label: "Időzítés", path: "timing" },
      { label: "Büdzsékeret", path: "budget_range" },
      { label: "Célcsoport", path: "target_audience" },
      { label: "Meglévő anyagok", path: "existing_materials" },
      { label: "Korábbi kampányok", path: "previous_campaigns" },
      { label: "Versenytársak", path: "competitors" },
      { label: "Megjegyzések", path: "notes" },
    ],
  },
];

const TYPE_SECTIONS: Record<CampaignType, SectionDef[]> = {
  media_buying: [
    {
      title: "Médiavásárlás",
      fields: [
        { label: "Célzott GRP", path: "media_specific.grp_target" },
        { label: "Elvárt elérés", path: "media_specific.reach_target" },
        { label: "Frekvencia limit", path: "media_specific.frequency_cap" },
        { label: "Médiatípusok", path: "media_specific.media_types" },
        { label: "Napszak preferenciák", path: "media_specific.daypart_preferences" },
        { label: "Viewability elvárások", path: "media_specific.viewability_requirements" },
      ],
    },
  ],
  performance_ppc: [
    {
      title: "Performance / PPC",
      fields: [
        { label: "Cél ROAS", path: "performance_specific.target_roas" },
        { label: "Cél CPA", path: "performance_specific.target_cpa" },
        { label: "Konverziós események", path: "performance_specific.conversion_events" },
        { label: "Landing page-ek", path: "performance_specific.landing_pages" },
        { label: "Hirdetési fiókok", path: "performance_specific.ad_accounts" },
        { label: "Attribúciós modell", path: "performance_specific.attribution_model" },
      ],
    },
  ],
  brand_awareness: [
    {
      title: "Brand / Awareness",
      fields: [
        { label: "Brand lift cél", path: "brand_specific.brand_lift_target" },
        { label: "Üzenetrecall cél", path: "brand_specific.message_recall_target" },
        { label: "Kreatív koncepció", path: "brand_specific.creative_concept" },
        { label: "Hangvétel", path: "brand_specific.tonality" },
        { label: "Pozicionálás", path: "brand_specific.positioning" },
        { label: "Awareness csatornák", path: "brand_specific.awareness_channels" },
      ],
    },
  ],
  social_media: [
    {
      title: "Social Media",
      fields: [
        { label: "Organikus/paid arány", path: "social_specific.organic_paid_mix" },
        { label: "Platformok", path: "social_specific.platforms" },
        { label: "Tartalom típusok", path: "social_specific.content_types" },
        { label: "Közösségkezelés", path: "social_specific.community_management" },
        { label: "Influencer terv", path: "social_specific.influencer_plan" },
        { label: "Posztolási gyakoriság", path: "social_specific.posting_frequency" },
      ],
    },
  ],
};

// --- Components ---

function SectionView({ section, data }: { section: SectionDef; data: Record<string, unknown> }) {
  const filledFields = section.fields.filter((f) => hasValue(getNestedValue(data, f.path)));
  if (filledFields.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {filledFields.map((field) => (
        <View key={field.path} style={styles.row}>
          <Text style={styles.label}>{field.label}:</Text>
          <Text style={styles.value}>{formatValue(getNestedValue(data, field.path))}</Text>
        </View>
      ))}
    </View>
  );
}

interface BriefPDFProps {
  data: BriefData;
}

export function BriefPDF({ data }: BriefPDFProps) {
  const today = new Date().toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dataRecord = data as unknown as Record<string, unknown>;

  const typeSections = data.campaign_types.flatMap(
    (type) => TYPE_SECTIONS[type] ?? []
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <PdfLogo width={30} />
            <Text style={styles.logoText}>
              ROI <Text style={styles.logoTextAccent}>WORKS</Text>
            </Text>
          </View>
          <Text style={styles.date}>{today}</Text>
        </View>

        {/* Campaign type badges */}
        <View style={styles.campaignTypes}>
          {data.campaign_types.map((type) => (
            <View key={type} style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {CAMPAIGN_TYPE_LABELS[type]}
              </Text>
            </View>
          ))}
        </View>

        {/* Executive Summary */}
        <SectionView section={EXECUTIVE_SUMMARY} data={dataRecord} />

        {/* Base sections */}
        {BASE_SECTIONS.map((section) => (
          <SectionView key={section.title} section={section} data={dataRecord} />
        ))}

        {/* Type-specific sections */}
        {typeSections.map((section) => (
          <SectionView key={section.title} section={section} data={dataRecord} />
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          Ez a dokumentum a ROI Works AI Brief rendszerrel készült. • {today}
          {"\n"}© 2026 ROI Works
        </Text>
      </Page>
    </Document>
  );
}
