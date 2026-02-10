import type { BriefState } from "@/lib/tools/types";
import type { CampaignType } from "@/lib/schemas/campaign-types";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/schemas/campaign-types";

export function buildQuestioningStrategy(briefState: BriefState): string {
  const { briefData, detectedTypes, confirmedTypes, phase } = briefState;

  const collectedFields = Object.keys(briefData).filter(
    k => briefData[k] !== undefined && briefData[k] !== ""
  );

  const activeTypes = confirmedTypes.length > 0 ? confirmedTypes : detectedTypes;
  const typeLabels = activeTypes.map(t => CAMPAIGN_TYPE_LABELS[t as CampaignType]).join(", ");

  let strategy = `
KÉRDEZÉSI STRATÉGIA:

Állapot: ${phase}
Eddig összegyűjtött adatok: ${collectedFields.length > 0 ? collectedFields.join(", ") : "még semmi"}
Felismert típus(ok): ${activeTypes.length > 0 ? typeLabels : "még nem ismert"}
`;

  if (phase === "discovery") {
    strategy += `
MOST EZT CSINÁLD:
1. Értsd meg a nagy képet: mi a cég, mi a cél, mi a kampány lényege
2. Ha van elég infód a típusfelismeréshez (általában 2-3 válasz után), használd a classify_campaign tool-t
3. Minden elhangzott konkrét adatot rögzíts az update_brief tool-lal
`;
  } else if (phase === "type_confirmed" || phase === "questioning") {
    strategy += `
MOST EZT CSINÁLD:
1. A típusspecifikus kérdéseket tedd fel (a típus modul útmutatót ad)
2. Először a fontos kérdések (cél, célcsoport, büdzsé), aztán a részletek
3. Minden válaszból rögzíts adatot az update_brief tool-lal
4. Ha az érdeklődő új típust említ, használd újra a classify_campaign tool-t
`;
  }

  strategy += `
TÍPUSMEGERŐSÍTÉS:
- Ha high confidence: természetesen sződd bele a válaszodba ("Értem, szóval egy ${activeTypes.length > 0 ? typeLabels : "..."} kampányra gondolsz...")
- Ha medium/low: kérdezz rá finoman ("Ez alapján inkább médiavásárlásra gondolsz, vagy performance kampányt terveztek?")
- Ha az érdeklődő javít: fogadd el természetesen, ne ismételd a hibát

LEZÁRÁS:
Amikor úgy érzed minden fontos kérdést megbeszéltétek:
1. Foglald össze a briefet természetesen, olvasható szövegben (NEM JSON)
2. Kérdezd meg: "Ez így jó? Van még valami amit hozzátennél?"
3. A megerősítés után jelezd hogy kész a brief (az összefoglalódat írd le, a rendszer kezeli a többit)

MULTI-TÍPUS:
- Ha több típust is fedez a brief, szekvenciálisan kérdezz: először fejezd be az egyik típust, aztán térj a másikra
- Típusváltásnál rövid átvezetés: "Remek, a performance rész kész. Most nézzük a social media kampányt!"
`;

  return strategy;
}
