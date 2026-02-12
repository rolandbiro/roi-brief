import type { BriefData } from "@/types/brief";
import type { MediaplanTemplate } from "./types";

export const RESEARCH_SYSTEM_PROMPT = `Te egy magyar piaci digitális marketing szakértő vagy, aki mediaplan kutatást végez.

FELADATOD:
- Benchmark adatok keresése az adott iparágra (CPM, CPC, CTR, konverziós ráták)
- Csatorna mix javaslat a kampánycél és büdzsé alapján
- Targeting ajánlás platformonként (Google Affinity/In-market, Meta Interests, stb.)
- KPI becslés a büdzsé és iparági átlagok alapján
- Versenytárs hirdetési aktivitás feltérképezése

FONTOS SZABÁLYOK:
- Magyar piacra vonatkozó adatokat keress, HUF árazással
- Használj web keresést az iparági benchmark adatokhoz, versenytárs aktivitáshoz és platform-specifikus targeting lehetőségekhez
- NE generálj JSON-t — szabad szöveges kutatási összefoglalót adj
- Jelöld meg, ha egy adat becslés (nem keresési eredmény)
- Minden forrást tarts számon a válaszodban`;

function templateInstructions(templateType: MediaplanTemplate): string {
  switch (templateType) {
    case "ppc_traffic":
      return "FÓKUSZ: Traffic/konverzió metrikák — impressions, CTR, clicks, CPC. A csatorna mix traffic-orientált legyen.";
    case "ppc_reach":
      return "FÓKUSZ: Reach/awareness metrikák — impressions, frequency, reach, CPM/CPV. A csatorna mix elérés-orientált legyen.";
    case "ppc_mixed":
      return "FÓKUSZ: Mind traffic, mind reach metrikák — a csatornákat kampánycél szerint osztd szét (traffic csatornák: impressions, CTR, clicks, CPC; reach csatornák: impressions, frequency, reach, CPM/CPV).";
    case "all_channels":
      return "FÓKUSZ: Teljes csatorna mix — PPC csatornák mellett vedd figyelembe a social media, médiavásárlás és egyéb csatornákat is. Minden releváns metrikát adj meg.";
  }
}

function safe(value: unknown, fallback = "nincs megadva"): string {
  if (value === undefined || value === null || value === "") return fallback;
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : fallback;
  }
  return String(value);
}

export function buildResearchPrompt(
  briefData: BriefData,
  templateType: MediaplanTemplate,
): string {
  return `Készíts piackutatást az alábbi kampány briefhez:

BRIEF ADATOK:
- Cég: ${safe(briefData.company_name)}
- Iparág: ${safe(briefData.industry)}
- Kampánycél: ${safe(briefData.campaign_goal)}
- Büdzsé: ${safe(briefData.budget_range)}
- Célcsoport kor: ${safe(briefData.age_range)}
- Célcsoport nem: ${safe(briefData.gender)}
- Célcsoport lokáció: ${safe(briefData.location, "Magyarország")}
- Időszak: ${safe(briefData.start_date)} - ${safe(briefData.end_date)}
- Hirdetési csatornák: ${safe(briefData.ad_channels, "nincs megadva — javasolj")}
- Versenytársak: ${safe(briefData.competitors)}

TEMPLATE TÍPUS: ${templateType}
${templateInstructions(templateType)}

FELADATOK:
1. Keress benchmark adatokat az iparágra (CPM, CPC, CTR, konverziós ráták a magyar piacon)
2. Keress versenytárs hirdetési aktivitásra vonatkozó információkat
3. Javasolj csatorna mixet a kampánycél és büdzsé alapján — indokold a választásokat
4. Adj platformonkénti targeting javaslatot (Google Affinity/In-market kategóriák, Meta Interests, stb.)
5. Becsüld meg a várható KPI-ket a büdzsé és iparági átlagok alapján (min-likely-max tartomány)

Minden adatot magyar piacra lokalizálj!`;
}

export const STRUCTURE_SYSTEM_PROMPT = `Te egy adatstruktúráló asszisztens vagy. A feladatod a szabad szöveges kutatási eredmények strukturált JSON formátumba rendezése.

SZABÁLYOK:
- A kutatási szöveget a megadott JSON schema szerint formázd
- KPI becslések: min (konzervatív), likely (reális), max (optimista) tartomány
- Budget elosztás: minden csatornára százalékban (budget_allocation_pct) és forintban (budget_allocation_huf) is
- A százalékok összege legyen 100%
- Kampánycéltól függő metrikák: Traffic csatornáknál impressions/ctr/clicks/cpc, Reach csatornáknál frequency/reach/cpm/cpv, Conversion-nél conversions/cpa — csak a releváns metrikákat töltsd ki
- Ahol nincs elegendő adat a kutatásban, jelezd a research_notes mezőben
- A sources mezőbe gyűjtsd össze a kutatásban hivatkozott forrásokat`;
