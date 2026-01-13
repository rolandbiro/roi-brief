import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { BriefData } from "@/types/chat";

// ROI Works brand colors
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
    backgroundColor: colors.white,
    padding: 40,
    fontFamily: "Helvetica",
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
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.dark,
  },
  logoAccent: {
    color: colors.orange,
  },
  date: {
    fontSize: 10,
    color: colors.gray,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 30,
    textAlign: "center",
  },
  titleAccent: {
    color: colors.orange,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
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
    width: 120,
  },
  value: {
    fontSize: 10,
    color: colors.dark,
    flex: 1,
  },
  textBlock: {
    fontSize: 10,
    color: colors.dark,
    lineHeight: 1.5,
    marginTop: 5,
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
  list: {
    marginTop: 5,
  },
  listItem: {
    fontSize: 10,
    color: colors.dark,
    marginBottom: 3,
    paddingLeft: 10,
  },
});

interface BriefPDFProps {
  data: BriefData;
}

export function BriefPDF({ data }: BriefPDFProps) {
  const today = new Date().toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            ROI <Text style={styles.logoAccent}>WORKS</Text>
          </Text>
          <Text style={styles.date}>{today}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Kampány Brief: <Text style={styles.titleAccent}>{data.campaign.name}</Text>
        </Text>

        {/* Company Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cégadatok</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cégnév:</Text>
            <Text style={styles.value}>{data.company.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kapcsolattartó:</Text>
            <Text style={styles.value}>{data.company.contact_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{data.company.contact_email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Telefon:</Text>
            <Text style={styles.value}>{data.company.contact_phone}</Text>
          </View>
        </View>

        {/* Campaign Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kampány</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Típus:</Text>
            <Text style={styles.value}>{data.campaign.type}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Cél:</Text>
            <Text style={styles.value}>{data.campaign.goal}</Text>
          </View>
          <Text style={styles.textBlock}>
            <Text style={{ fontWeight: "bold" }}>Üzenet: </Text>
            {data.campaign.message}
          </Text>
          <View style={styles.list}>
            <Text style={{ ...styles.label, marginTop: 5 }}>KPI-k:</Text>
            {data.campaign.kpis.map((kpi, index) => (
              <Text key={index} style={styles.listItem}>
                • {kpi}
              </Text>
            ))}
          </View>
        </View>

        {/* Target Audience Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Célcsoport</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nem:</Text>
            <Text style={styles.value}>{data.target_audience.demographics.gender}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kor:</Text>
            <Text style={styles.value}>{data.target_audience.demographics.age}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Földrajzi hely:</Text>
            <Text style={styles.value}>{data.target_audience.demographics.location}</Text>
          </View>
          <Text style={styles.textBlock}>
            <Text style={{ fontWeight: "bold" }}>Pszichográfia: </Text>
            {data.target_audience.psychographics}
          </Text>
          <Text style={styles.textBlock}>
            <Text style={{ fontWeight: "bold" }}>Persona: </Text>
            {data.target_audience.persona}
          </Text>
        </View>

        {/* Channels & Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Csatornák és Időzítés</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Csatornák:</Text>
            <Text style={styles.value}>{data.channels.join(", ")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kezdés:</Text>
            <Text style={styles.value}>{data.timeline.start}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Befejezés:</Text>
            <Text style={styles.value}>{data.timeline.end}</Text>
          </View>
        </View>

        {/* Budget & Competitors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Költségvetés és Versenytársak</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Büdzsé:</Text>
            <Text style={styles.value}>{data.budget.total}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Versenytársak:</Text>
            <Text style={styles.value}>{data.competitors.join(", ")}</Text>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Megjegyzések</Text>
            <Text style={styles.textBlock}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Ez a dokumentum a ROI Works brief rendszerrel készült. • {today}
        </Text>
      </Page>
    </Document>
  );
}
