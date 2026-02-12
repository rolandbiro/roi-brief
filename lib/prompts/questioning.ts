import type { BriefState } from "@/lib/tools/types";
import type { CampaignType } from "@/lib/schemas/campaign-types";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/schemas/campaign-types";

export function buildQuestioningStrategy(briefState: BriefState): string {
  const { briefData, detectedTypes, confirmedTypes, phase } = briefState;

  // Kitöltött mezők csoportosítása szekciónként
  const filled = (keys: string[]) =>
    keys.filter(k => {
      const v = briefData[k];
      if (v === undefined || v === null || v === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    });

  const companyFields = ["company_name", "industry", "brand_positioning"];
  const goalFields = ["campaign_goal"];
  const channelFields = ["ad_channels", "kpis"];
  const targetFields = ["gender", "age_range", "location", "psychographics", "persona"];
  const messageFields = ["campaign_name", "main_message", "communication_style"];
  const creativeFields = ["creative_source", "creative_types"];
  const timingFields = ["start_date", "end_date", "key_events"];
  const budgetFields = ["budget_range", "budget_allocation"];
  const competitorFields = ["competitors", "inspiring_campaigns"];
  const closingFields = ["contact_name", "existing_materials", "previous_campaigns", "notes"];

  const filledCompany = filled(companyFields);
  const filledGoal = filled(goalFields);
  const filledChannels = filled(channelFields);
  const filledTarget = filled(targetFields);
  const filledMessage = filled(messageFields);
  const filledCreative = filled(creativeFields);
  const filledTiming = filled(timingFields);
  const filledBudget = filled(budgetFields);
  const filledCompetitor = filled(competitorFields);
  const filledClosing = filled(closingFields);

  const activeTypes = confirmedTypes.length > 0 ? confirmedTypes : detectedTypes;
  const typeLabels = activeTypes.map(t => CAMPAIGN_TYPE_LABELS[t as CampaignType]).join(", ");

  const totalFilled = Object.keys(briefData).filter(k => {
    const v = briefData[k];
    if (v === undefined || v === null || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  }).length;

  const now = new Date();
  const currentMonth = now.toLocaleDateString("hu-HU", { year: "numeric", month: "long" });

  let strategy = `
KÉRDEZÉSI STRATÉGIA:

Mai dátum: ${currentMonth}
Állapot: ${phase}
Felismert típus(ok): ${activeTypes.length > 0 ? typeLabels : "még nem ismert"}
Kitöltött mezők: ${totalFilled} db

HALADÁS SZEKCIÓNKÉNT (a sorrend SZÁMÍT — ne ugorj előre!):
1. Cég/márka: ${filledCompany.length}/${companyFields.length} (${filledCompany.join(", ") || "üres"})
2. Kampány célja: ${filledGoal.length}/${goalFields.length} (${filledGoal.join(", ") || "⚠ ÜRES — EZ A KÖVETKEZŐ!"})
3. Csatornák+KPI: ${filledChannels.length}/${channelFields.length} (${filledChannels.join(", ") || "üres"}) → suggest_quick_replies!
4. Célcsoport: ${filledTarget.length}/${targetFields.length} (${filledTarget.join(", ") || "üres"})
5. Üzenet+stílus: ${filledMessage.length}/${messageFields.length} (${filledMessage.join(", ") || "üres"})
6. Kreatívok: ${filledCreative.length}/${creativeFields.length} (${filledCreative.join(", ") || "üres"}) → suggest_quick_replies!
7. Időzítés: ${filledTiming.length}/${timingFields.length} (${filledTiming.join(", ") || "üres"})
8. Költségvetés: ${filledBudget.length}/${budgetFields.length} (${filledBudget.join(", ") || "üres"})
9. Versenytársak: ${filledCompetitor.length}/${competitorFields.length} (${filledCompetitor.join(", ") || "üres"})
10. Záró: ${filledClosing.length}/${closingFields.length} (${filledClosing.join(", ") || "üres"})
`;

  // A fázis-specifikus útmutatás
  if (phase === "discovery") {
    strategy += `
MOST EZT CSINÁLD:
1. A cég/márka szekció hiányzó mezőit kérdezd (ha nem mind kitöltött)
2. Ha van elég infód a típusfelismeréshez, használd a classify_campaign tool-t
3. Minden elhangzott konkrét adatot rögzíts az update_brief tool-lal
`;
  } else if (phase === "type_confirmed" || phase === "questioning") {
    strategy += `
MOST EZT CSINÁLD:
1. Haladj a fenti szekció sorrendben — a következő nem-üres szekciót dolgozd fel
2. A típusspecifikus kérdéseket sződd be természetesen a megfelelő szekcióba
3. Ha egy kérdésre az érdeklődő már válaszolt korábban, NE kérdezd újra
4. Ha az érdeklődő új típust említ, használd újra a classify_campaign tool-t
`;
  }

  strategy += `
TÍPUSMEGERŐSÍTÉS:
- Ha high confidence: természetesen sződd bele a válaszodba ("Értem, szóval egy ${activeTypes.length > 0 ? typeLabels : "..."} kampányra gondolsz...")
- Ha medium/low: kérdezz rá finoman
- Ha az érdeklődő javít: fogadd el természetesen

QUICK REPLY KÖTELEZŐ — Az alábbi mezőknél MINDIG hívd a suggest_quick_replies tool-t a kérdéseddel együtt:
- ad_channels: ["Facebook", "Instagram", "Google Search", "Google GDN", "TikTok", "YouTube", "Microsoft", "Egyéb"]
- kpis: ["Elérés", "Megjelenés", "Link kattintás", "Website event", "Social aktivitás", "Egyéb"]
- creative_types: ["Statikus kép", "Videó"]
- creative_source: ["Saját kreatív (ügyfél hozza)", "ROI Works készíti", "Mindkettő"]
- gender: ["Nő", "Férfi", "Mindkettő"]
- budget_range: ["< 500e Ft", "500e - 1M Ft", "1M - 3M Ft", "3M - 5M Ft", "5M+ Ft"]
- start_date: a mai dátumtól (${currentMonth}) számított következő 3-4 hónap nevei quick reply-ként (NE ajánlj múltbeli hónapot!)
- Bármilyen igen/nem kérdés: ["Igen", "Nem"]
Ha a kérdésedre 2-8 válaszlehetőség van, MINDIG használj quick reply-t!

LEZÁRÁS:
Amikor a legtöbb szekció kitöltött (minimum: company_name + campaign_goal):
1. Foglald össze a briefet természetesen, olvasható szövegben (NEM JSON)
2. Kérdezd meg: "Ez így jó? Van még valami amit hozzátennél?"
3. A megerősítés után hívd a complete_brief tool-t

MULTI-TÍPUS:
- Ha több típust is fedez a brief, szekvenciálisan kérdezz: először fejezd be az egyiket, aztán a másikat
- Típusváltásnál rövid átvezetés
`;

  return strategy;
}
