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
  const campaignFields = ["campaign_name", "campaign_goal", "main_message", "communication_style", "creative_source", "creative_types"];
  const channelFields = ["ad_channels", "kpis"];
  const targetFields = ["gender", "age_range", "location", "psychographics", "persona"];
  const timingFields = ["start_date", "end_date", "key_events"];
  const budgetFields = ["budget_range", "budget_allocation"];
  const competitorFields = ["competitors", "inspiring_campaigns"];
  const closingFields = ["contact_name", "existing_materials", "previous_campaigns", "notes"];

  const filledCompany = filled(companyFields);
  const filledCampaign = filled(campaignFields);
  const filledChannels = filled(channelFields);
  const filledTarget = filled(targetFields);
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

  let strategy = `
KÉRDEZÉSI STRATÉGIA:

Állapot: ${phase}
Felismert típus(ok): ${activeTypes.length > 0 ? typeLabels : "még nem ismert"}
Kitöltött mezők: ${totalFilled} db

HALADÁS SZEKCIÓNKÉNT:
- Cég/márka: ${filledCompany.length}/${companyFields.length} (${filledCompany.join(", ") || "üres"})
- Kampány: ${filledCampaign.length}/${campaignFields.length} (${filledCampaign.join(", ") || "üres"})
- Csatornák+KPI: ${filledChannels.length}/${channelFields.length} (${filledChannels.join(", ") || "üres"})
- Célcsoport: ${filledTarget.length}/${targetFields.length} (${filledTarget.join(", ") || "üres"})
- Időzítés: ${filledTiming.length}/${timingFields.length} (${filledTiming.join(", ") || "üres"})
- Költségvetés: ${filledBudget.length}/${budgetFields.length} (${filledBudget.join(", ") || "üres"})
- Versenytársak: ${filledCompetitor.length}/${competitorFields.length} (${filledCompetitor.join(", ") || "üres"})
- Záró: ${filledClosing.length}/${closingFields.length} (${filledClosing.join(", ") || "üres"})
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

CHECKBOX MEZŐK (használj suggest_quick_replies-t):
- ad_channels: Facebook, Instagram, Google GDN, Google Search, TikTok, Microsoft, YouTube, Egyéb
- kpis: Elérés, Megjelenés, Link kattintás, Website event, Social aktivitás, Egyéb
- creative_types: Statikus, Videós
- creative_source: Saját kreatív (ügyfél hozza), ROI Works készíti
- gender: Nő, Férfi

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
