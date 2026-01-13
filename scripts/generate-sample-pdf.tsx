import { Document, Page, Text, View, StyleSheet, renderToFile } from "@react-pdf/renderer";
import path from "path";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#FF6400",
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2A2B2E",
  },
  logoAccent: {
    color: "#FF6400",
  },
  date: {
    fontSize: 10,
    color: "#666",
    marginTop: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2A2B2E",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6400",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: "#666",
    width: 120,
  },
  value: {
    fontSize: 10,
    color: "#2A2B2E",
    flex: 1,
  },
  text: {
    fontSize: 10,
    color: "#2A2B2E",
    lineHeight: 1.6,
    marginBottom: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  accepted: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f0fff0",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  acceptedText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "bold",
    textAlign: "center",
  },
});

const SampleProposal = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          ROI <Text style={styles.logoAccent}>WORKS</Text>
        </Text>
        <Text style={styles.date}>Ajánlat készítésének dátuma: 2026. január 10.</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Marketing Kampány Ajánlat</Text>

      {/* Client Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ügyfél adatai</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Cégnév:</Text>
          <Text style={styles.value}>TechStart Kft.</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Kapcsolattartó:</Text>
          <Text style={styles.value}>Kovács Péter</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>kovacs.peter@techstart.hu</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Telefon:</Text>
          <Text style={styles.value}>+36 30 123 4567</Text>
        </View>
      </View>

      {/* Campaign Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kampány áttekintés</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Kampány neve:</Text>
          <Text style={styles.value}>TechStart 2026 Tavaszi Termékbevezető</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Kampány típusa:</Text>
          <Text style={styles.value}>Termékbevezető kampány</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Időtartam:</Text>
          <Text style={styles.value}>2026. március 1. - 2026. május 31.</Text>
        </View>
        <Text style={styles.text}>
          A TechStart Kft. új SaaS projektmenedzsment szoftverének bevezetése a magyar KKV piacra.
          A kampány célja a márkaismertség növelése és lead generálás a célcsoport körében.
        </Text>
      </View>

      {/* Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ajánlott szolgáltatások</Text>
        <Text style={styles.text}>• Google Ads kampány (Search + Display)</Text>
        <Text style={styles.text}>• Facebook és Instagram hirdetések</Text>
        <Text style={styles.text}>• LinkedIn B2B kampány</Text>
        <Text style={styles.text}>• Landing page optimalizálás</Text>
        <Text style={styles.text}>• Email marketing automation</Text>
        <Text style={styles.text}>• Havi riportálás és elemzés</Text>
      </View>

      {/* Budget */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Költségvetés</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Média büdzsé:</Text>
          <Text style={styles.value}>2.500.000 Ft / hó</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ügynökségi díj:</Text>
          <Text style={styles.value}>500.000 Ft / hó</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Teljes büdzsé (3 hó):</Text>
          <Text style={styles.value}>9.000.000 Ft + ÁFA</Text>
        </View>
      </View>

      {/* Acceptance */}
      <View style={styles.accepted}>
        <Text style={styles.acceptedText}>✓ AJÁNLAT ELFOGADVA - 2026. január 12.</Text>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        ROI Works Marketing Ügynökség | 1052 Budapest, Váci utca 12. | info@roiworks.hu | +36 1 234 5678
      </Text>
    </Page>
  </Document>
);

async function generatePdf() {
  const outputPath = path.join(process.cwd(), "sample-proposal.pdf");
  await renderToFile(<SampleProposal />, outputPath);
  console.log(`PDF generated: ${outputPath}`);
}

generatePdf().catch(console.error);
