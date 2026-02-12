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
import {
  AGENCY_BRIEF_SECTIONS,
  TYPE_SECTIONS,
  hasValue,
  getNestedValue,
  formatValue,
  type FieldDef,
  type SectionDef,
} from "@/lib/brief-sections";

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

// --- Components ---

function SectionView({ section, data }: { section: SectionDef; data: Record<string, unknown> }) {
  const filledFields = section.fields.filter((f) => hasValue(getNestedValue(data, f.key)));
  if (filledFields.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {filledFields.map((field) => (
        <View key={field.key} style={styles.row}>
          <Text style={styles.label}>{field.label}:</Text>
          <Text style={styles.value}>{formatValue(getNestedValue(data, field.key)) ?? ""}</Text>
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

  const typeSections = data.campaign_types
    .map((type) => TYPE_SECTIONS[type])
    .filter(Boolean);

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

        {/* Agency Brief sections */}
        {AGENCY_BRIEF_SECTIONS.map((section) => (
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
