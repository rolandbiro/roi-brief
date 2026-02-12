# Phase 4: Bővített adatgyűjtés és jóváhagyás - Research

**Researched:** 2026-02-12
**Domain:** Zod séma bővítés, AI prompt átszervezés, jóváhagyási UI, Next.js after() háttér trigger
**Confidence:** HIGH

## Summary

A Phase 4 lényege három nagy munkaterület: (1) a BriefData Zod séma bővítése az Agency Brief xlsx template ~25 mezőjével, (2) a teljes prompt rendszer (kérdezési stratégia + extrakció) újraszervezése az Agency Brief struktúra mentén, és (3) a BriefEditor + köszönő oldal átalakítása read-only jóváhagyási flow-vá.

A jelenlegi kódbázis jól strukturált — a sémák, promptok, tool definíciók és a BriefEditor/brief-sections mind modulárisak. A bővítés elsősorban a meglévő fájlok módosítása, nem új absztrakciók bevezetése. A séma bővítés a `lib/schemas/brief-base.ts`-ben történik, a kampánytípus-specifikus sémák (`media-buying.ts`, `performance.ts`, stb.) érintetlenek maradnak, mert az Agency Brief mezők univerzálisak.

A háttér trigger a Next.js `after()` API-val oldható meg, ami a v15.1.0 óta stabil, és a projekt Next.js 16.1.1-et használ — tehát natívan elérhető, Vercel-en is támogatott.

**Primary recommendation:** A sémát flat struktúrában bővítsd (nem nested objektumokkal), az Agency Brief xlsx template mezőrendjét kövesd, és a checkbox mezőket `z.array(z.string()).optional()` típussal kezeld.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Az összes kérdést (régi v1.0 + új Agency Brief) teljesen újraszervezzük egy logikus sorrendbe az Agency Brief struktúra mentén
- Nyitás: cég/márka bemutatással indul ("Mesélj a cégről, a termékről/szolgáltatásról") — nem a kampány céllal
- Átfedések kezelése: Claude döntése — lényeg, hogy ne kérdezzen rá kétszer ugyanarra (régi kampány-specifikus + új Agency Brief mezők összeolvasztása)
- Extrakció mélysége: Claude döntése — mezőtípustól függően kezeli, mikor kell visszakérdezni részletekre és mikor elég az automatikus kinyerés
- A jóváhagyási képernyő read-only összefoglaló — az ügyfél NEM szerkeszthet rajta, csak áttekinti
- Ha módosítani akar, visszamegy a chatbe és ott az AI segítségével korrigál, majd újra megjeleníti az összefoglalót
- Kizárólag a chatből extractált ügyfél-adatokat mutatja — kutatási eredmények nem szerepelnek
- Kétlépéses jóváhagyás: először "Jóváhagyom" gomb, utána külön "PDF letöltése" gomb a köszönő oldalon
- Köszönő oldal: köszönet + PDF letöltési link + rövid üzenet, hogy a PM hamarosan felveszi a kapcsolatot — session vége
- A jóváhagyás háttérben triggereli a Phase 5 kutatást (fire-and-forget) — technikai megvalósítás Claude döntése (Next.js after() vagy hasonló)
- Kontakt adatokat (email, telefon) NEM kérünk be — a PM már ismeri az ügyfelet, aki korábban megkereste a ROI Works-öt
- Bekérjük: cégnév (kötelező) + kapcsolattartó neve — a PM ebből azonosítja a brief-et
- DATA-05 requirement módosul: kontakt adatok kihagyva, helyette cégnév + kapcsolattartó neve elegendő
- Az Agency Brief xlsx template alapján bővül a BriefData Zod séma (docs/ROI_Mediaplan/ mappából)
- Kötelező mezők: cégnév + kampány célja — ezek nélkül nem lehet jóváhagyni
- Többi mező opcionális — az AI gyűjti amit tud, de nem blokkol ha valami hiányzik

### Claude's Discretion
- Kikérdezés során az átfedések és extrakció mélységének kezelése
- Jóváhagyási képernyő vizuális layoutja (~25 mező áttekinthetően)
- Visszamódosítás interakciós mintája (chat ↔ összefoglaló)
- Checkbox mezők megjelenítése a BriefEditorban
- Technikai/admin mezők relevanciájának eldöntése
- Háttér trigger technikai megvalósítása

### Deferred Ideas (OUT OF SCOPE)
- PM + főnök email címek környezeti változóként → Phase 6 (Xlsx generálás és PM delivery) tervezi meg
- Hibaértesítés a PM-nek ha a háttérfeldolgozás hibázik → Phase 6
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | ^4.3.6 | Séma definíció és validáció | Már a projektben, BriefData, BriefBase séma |
| next | 16.1.1 | Framework, `after()` API | Már a projektben, after() stabil v15.1.0 óta |
| @anthropic-ai/sdk | ^0.74.0 | Claude API tool use | Már a projektben, tool definíciók + handler |
| @react-pdf/renderer | ^4.3.2 | PDF generálás | Már a projektben, BriefPDF template |
| tailwindcss | ^4 | Styling | Már a projektben |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react | 19.2.3 | UI komponensek | Meglévő BriefEditor, ChatContainer |

### Alternatives Considered
Nincs szükség új library-re. Minden ami kell, már a projektben van.

## Architecture Patterns

### Érintett fájlok térképe

```
lib/
├── schemas/
│   ├── brief-base.ts          # MÓDOSÍTANI: bővíteni Agency Brief mezőkkel
│   ├── brief-data.ts          # MÓDOSÍTANI: ha campaign_types logika változik
│   ├── campaign-types.ts      # ÉRINTETLEN
│   ├── media-buying.ts        # ÉRINTETLEN
│   ├── performance.ts         # ÉRINTETLEN
│   ├── brand.ts               # ÉRINTETLEN
│   ├── social.ts              # ÉRINTETLEN
│   └── index.ts               # ÉRINTETLEN
├── prompts/
│   ├── base.ts                # MÓDOSÍTANI: bemutatkozás + kérdezési sorrend átírás
│   ├── questioning.ts         # MÓDOSÍTANI: stratégia átírás Agency Brief sorrendbe
│   ├── extraction.ts          # MÓDOSÍTANI: új mezők extrakciós útmutatója
│   ├── compose.ts             # ÉRINTETLEN (logika jó, a modulok változnak)
│   ├── index.ts               # ÉRINTETLEN
│   └── types/
│       ├── media-buying.ts    # FELÜLVIZSGÁLNI: átfedés Agency Brief mezőkkel
│       ├── performance.ts     # FELÜLVIZSGÁLNI: átfedés Agency Brief mezőkkel
│       ├── brand.ts           # FELÜLVIZSGÁLNI: átfedés Agency Brief mezőkkel
│       └── social.ts          # FELÜLVIZSGÁLNI: átfedés Agency Brief mezőkkel
├── tools/
│   ├── definitions.ts         # MÓDOSÍTANI: update_brief mező lista dokumentáció
│   ├── handlers.ts            # ÉRINTETLEN (deepSet logika generikus, működik)
│   ├── types.ts               # ÉRINTETLEN (BriefState generikus)
│   └── index.ts               # ÉRINTETLEN
├── brief-sections.ts          # MÓDOSÍTANI: Agency Brief szekciók a BriefEditorhoz
├── pdf-template.tsx           # MÓDOSÍTANI: Agency Brief szekciók a PDF-hez
└── email-template.ts          # MÓDOSÍTANI: Agency Brief szekciók az emailhez

components/
├── BriefEditor.tsx            # MÓDOSÍTANI: read-only + jóváhagyási flow + köszönő oldal

app/
├── brief/page.tsx             # MÓDOSÍTANI: jóváhagyási flow logika
├── api/
│   ├── chat/route.ts          # MÓDOSÍTANI: after() trigger jóváhagyás után
│   ├── approve/route.ts       # ÚJ: jóváhagyási API endpoint (after() trigger)
│   ├── download-pdf/route.tsx # ÉRINTETLEN (BriefData interface bővül, de a logika nem)
│   └── send-brief/route.tsx   # LEHETSÉGES ELTÁVOLÍTÁS: email küldés az ügyfélnek megszűnik

hooks/
├── useChat.ts                 # MÓDOSÍTANI: jóváhagyási flow state + approve hívás
```

### Pattern 1: Séma bővítés flat struktúrában

**What:** Az Agency Brief xlsx template mezőit a `BriefBaseSchema`-ba adjuk, flat (nem nested) struktúrában. A kampánytípus-specifikus sémák érintetlenek maradnak.

**When to use:** Minden olyan mező, ami az Agency Brief xlsx-ben szerepel és nem típusspecifikus.

**Why flat:** A jelenlegi `update_brief` tool `deepSet`-tel dolgozik (dot notation: `"media_specific.grp_target"`). Flat mezőknél egyszerűbb a path (`"campaign_name"`), nincs nested objektum kezelési overhead. A checkbox mezők `z.array(z.string()).optional()` típussal kezelhetők flat-ben is.

**Mezők mappelése (xlsx → séma):**

```
MEGLÉVŐ (BriefBase-ben):
- company_name          ← "Cégnév" (kötelező marad)
- industry              ← "Cég tevékenységi köre"
- campaign_goal         ← "Kampány célja" (kötelező marad)
- timing                ← ez splittelődik start_date + end_date-ra
- budget_range          ← "Allokált büdzsé (Ft)"
- target_audience       ← ez splittelődik demografics + psychographics-ra
- existing_materials    ← megmarad
- previous_campaigns    ← megmarad
- competitors           ← "Fő versenytársak"
- notes                 ← "Egyéb megjegyzések" alá kerül

ÚJ MEZŐK:
- contact_name          ← "Kapcsolattartó neve"
- brand_positioning     ← "Márka pozicionálása"
- campaign_name         ← "Kampány neve"
- main_message          ← "Fő üzenet"
- creative_source       ← "Kampány kreatívok" checkbox → array: ["client", "roiworks"]
- creative_types        ← "Statikus/Videós" checkbox → array: ["static", "video"]
- communication_style   ← "Kommunikációs stílus"
- ad_channels           ← "Online hirdetési csatornák" checkbox → array
- kpis                  ← "Fő mérési mutatók (KPI-k)" checkbox → array
- gender                ← "Nem" checkbox → array: ["female", "male"]
- location              ← "Lakóhely"
- age_range             ← "Kor"
- psychographics        ← "Pszichográfiai adatok"
- persona               ← "Ideális ügyfélprofil (Persona)"
- start_date            ← "Indulási dátum"
- end_date              ← "Zárási dátum"
- key_events            ← "Fontos események"
- budget_allocation     ← "Platformonkénti elosztási preferencia"
- inspiring_campaigns   ← "Inspiráló kampányok vagy márkák"

ELTÁVOLÍTANDÓ / ÁTSZERVEZENDŐ:
- timing               → splittelődik start_date + end_date-ra
- target_audience      → splittelődik részletesebb mezőkre (gender, location, age, psychographics, persona)

KIHAGYVA (döntés alapján):
- contact_email, contact_phone → nem kérjük (CONTEXT.md döntés)
- technical_requirements → nem releváns az ügyfélnek (Claude discretion → kihagyni javasolt)
- internal_approval → nem releváns az ügyfélnek (Claude discretion → kihagyni javasolt)
```

### Pattern 2: Kérdezési stratégia átszervezés

**What:** A `base.ts` prompt + `questioning.ts` stratégia teljes átírása az Agency Brief szekciók sorrendjében.

**Jelenlegi sorrend (v1.0):**
1. Discovery: cég + kampány típus felismerés
2. Type confirmed: típusspecifikus kérdések
3. Summary + lezárás

**Új sorrend (Agency Brief struktúra mentén):**
1. **Cég/márka bemutatkozás** — cégnév, kapcsolattartó neve, tevékenységi kör, márka pozicionálás
2. **Kampány részletek** — kampány neve, típusa, fő üzenet, kommunikációs stílus, kreatívok
3. **Csatornák + KPI-k** — online hirdetési csatornák, KPI-k (checkbox jellegű, quick replies)
4. **Célcsoport** — demográfia (nem, kor, lakóhely), pszichográfia, persona
5. **Időzítés** — indulási/zárási dátum, fontos események
6. **Költségvetés** — büdzsé, platformonkénti elosztás
7. **Versenytársak** — fő versenytársak, inspiráló kampányok
8. **Típusspecifikus kérdések** — ha van felismert kampánytípus, annak extra mezői
9. **Összefoglaló + lezárás**

**Átfedés-kezelés (discretion döntés):**
A típusspecifikus modulok (`media-buying.ts`, `performance.ts`, stb.) maradnak, de a prompt-ban utasítás kerül, hogy:
- Ha az Agency Brief szekciókban már válaszolt egy kérdésre, a típusspecifikus modul NE kérdezze újra
- Pl. "Online hirdetési csatornák" (Agency Brief) vs. "Platformok" (social_media modul) — ugyanaz, ne kérdezd kétszer
- A `buildQuestioningStrategy()` kapja meg az eddig kitöltött mezők listáját, és a prompt explicit mondja: "Ezeket már megkaptad, ne kérdezd újra: [lista]"

### Pattern 3: BriefEditor → Read-only jóváhagyás + köszönő oldal

**What:** A jelenlegi BriefEditor átalakítása:
1. Eltávolítani: email input mező, "Jóváhagyás és küldés" gomb → "Jóváhagyom" gomb
2. Eltávolítani: `send-brief` API hívás → helyette `approve` API hívás
3. Hozzáadni: jóváhagyás után köszönő oldal state (isApproved)
4. Köszönő oldal: "Köszönjük!" + "PDF letöltése" gomb + üzenet a PM-ről

**Jelenlegi állapotgép:**
```
chat → complete_brief tool → "Brief áttekintése" gomb → BriefEditor (email + küldés) → success oldal
```

**Új állapotgép:**
```
chat → complete_brief tool → "Brief áttekintése" gomb → BriefEditor (read-only + "Jóváhagyom") → approve API (after() trigger) → köszönő oldal (PDF letöltés)
```

**Visszamódosítás pattern (discretion döntés):**
- A BriefEditor-on legyen egy "Vissza a chatbe" gomb
- Ez visszanavigál a chat-re (`briefData` state-et null-ra állítja)
- Az ügyfél a chatben korrigálhat, majd az AI újra hívja a `complete_brief` tool-t
- A "Brief áttekintése" gomb újra megjelenik, és az ügyfél újra látja az összefoglalót

### Pattern 4: Jóváhagyás API + after() trigger

**What:** Új `/api/approve` POST endpoint, ami:
1. Fogadja a `briefData`-t
2. Visszaadja a választ azonnal (200 OK)
3. `after()` callback-ben triggereli a Phase 5 kutatást

```typescript
// app/api/approve/route.ts
import { after } from 'next/server';

export async function POST(request: Request) {
  const { briefData } = await request.json();

  // Trigger Phase 5 research in background
  after(async () => {
    // Phase 5 implements this — for now just a placeholder
    // await runResearchPipeline(briefData);
    console.log('Research pipeline triggered for:', briefData.company_name);
  });

  return Response.json({ approved: true });
}
```

**Miért `after()` és nem más:**
- Native Next.js 16 feature, stabil v15.1.0 óta
- Vercel deployment-en natívan támogatott (`waitUntil` primitív)
- Nem kell extra infrastructure (queue, cron, webhook)
- A response azonnal visszamegy a kliensnek
- A callback a response után fut, nem blokkolja a UX-et
- Max duration a route config `maxDuration`-jével állítható (Phase 5-ben lesz fontos)

### Anti-Patterns to Avoid

- **Ne hozz létre nested objektumot az Agency Brief mezőknek:** A jelenlegi `media_specific`, `brand_specific` stb. nested pattern jó a típusspecifikus mezőkhöz, de az Agency Brief univerzális mezők flat-ben egyszerűbbek. Ne csinálj `agency_brief: { contact_name, brand_positioning, ... }` wrapper-t.

- **Ne írj szerkeszthető mezőket a BriefEditor-ba:** A döntés read-only. Ne adj `onChange` handler-eket, ne csinálj form-ot. Egyszerű szöveg megjelenítés.

- **Ne építs custom state management-et a jóváhagyási flow-hoz:** A meglévő `useChat` hook `briefData` + `briefState.phase` állapotgépe elegendő. Adj hozzá egy `isApproved` state-et, ne építs külön store-t.

- **Ne küldj emailt az ügyfélnek:** Az `api/send-brief` route ügyfél email logikája kikerül. Az xlsx/email küldés a PM-nek Phase 6-ban lesz.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Háttér task trigger | Custom queue/webhook/cron | `next/server` `after()` | Natív, Vercel-kompatibilis, zero config |
| Séma validáció | Kézi type guard-ok | Zod `.safeParse()` + `.optional()` | Már a projektben, type-safe |
| Checkbox mezők | Custom checkbox component | `z.array(z.string()).optional()` + quick replies | Az AI tool use-ból jönnek string tömbök |
| PDF szekciók | Kézi PDF section builder | Meglévő `SectionView` pattern | Csak a szekció definíciókat kell bővíteni |

**Key insight:** A jelenlegi kódbázis pattern-jei (SectionDef, FieldDef, getNestedValue, formatValue) jól skálázódnak — csak a definíciós adatokat kell bővíteni, nem az infrastruktúrát.

## Common Pitfalls

### Pitfall 1: Séma mezők duplikálása 3 helyen
**What goes wrong:** Az Agency Brief mezőket definiálni kell (1) a Zod sémában, (2) a brief-sections.ts szekció definíciókban, (3) a pdf-template.tsx szekció definíciókban, és (4) az email-template.ts szekció definíciókban. Ha egy mező kimarad valahol, nem jelenik meg.
**Why it happens:** A jelenlegi architektúrában a szekció definíciók 3 helyen vannak duplikálva (brief-sections, pdf-template, email-template).
**How to avoid:** A szekció definíciókat centralizálni a `brief-sections.ts`-be, és onnan importálni a pdf-template és email-template-be. Az `email-template.ts` kommentje már jelzi a problémát: "duplicated from brief-sections.ts — necessary because we generate HTML strings, not React".
**Recommendation:** A szekció *definíciókat* (SectionDef tömb) ki lehet emelni közös helyre, csak a *renderelés* marad helyi. A pdf-template és email-template importálhatják a definíciókat a `brief-sections.ts`-ből.
**Warning signs:** Ha egy mezőt adsz hozzá és 4 fájlt kell módosítani — ez a jel.

### Pitfall 2: `timing` és `target_audience` mező splitting
**What goes wrong:** A jelenlegi séma `timing: z.string()` és `target_audience: z.string()` — ezek szabad szöveg mezők. Az Agency Brief viszont ezeket részletesebb mezőkre bontja (start_date, end_date, key_events; gender, age, location, psychographics, persona).
**Why it happens:** A v1.0 séma egyszerűsítette ezeket, az xlsx template viszont részletesebb.
**How to avoid:** Nem kell backward compatible lenni — a séma teljesen átírható, mert nincs persisted adat. A `timing` mező kikerül, helyette `start_date`, `end_date`, `key_events`. A `target_audience` kikerül, helyette `gender`, `age_range`, `location`, `psychographics`, `persona`.
**Warning signs:** Ha a régi mező is és az új is él a sémában, az zavaros lesz a prompt és az AI számára.

### Pitfall 3: Prompt context window méret
**What goes wrong:** Ha a kérdezési stratégia + típusspecifikus modulok + kitöltött mezők listája túl hosszú, a prompt context window-t feleslegesen terheli.
**Why it happens:** ~25 mező + 4 típusspecifikus modul + kérdezési útmutató = sok szöveg.
**How to avoid:** A prompt tömör legyen. A mezőlistát ne sorolj fel egyenként a stratégiában — inkább tematikus blokkonként adj útmutatót. A kitöltött mezők listáját (ami dinamikus) tartsd rövidre.
**Warning signs:** Ha a system prompt 3000+ tokent zabál, gondolkodj a tömörítésen.

### Pitfall 4: complete_brief tool túl korán hívása
**What goes wrong:** Az AI a `complete_brief` tool-t hívhatja mielőtt az összes fontos kérdést feltette — különösen a bővített mezőkészlettel.
**Why it happens:** A v1.0-ban 10 mező volt, most ~25. Az AI "elég"-nek érezheti a beszélgetést korábban.
**How to avoid:** A prompt-ban explicit utasítás: "NE hívd a complete_brief-et amíg legalább a cégnév, kampány célja, célcsoport és büdzsé nincs kitöltve. A többi opcionális, de próbáld meg a témakörök mindegyikét végigvinni."
**Warning signs:** Ha a tesztelés során az AI 3-4 kérdés után lezárja a beszélgetést.

### Pitfall 5: Jóváhagyás API idempotency
**What goes wrong:** Ha a felhasználó kétszer kattint a "Jóváhagyom" gombra, az `after()` kétszer triggereli a Phase 5 kutatást.
**Why it happens:** Nincs gomb disabled state vagy server-side idempotency.
**How to avoid:** Kliens-oldalon: a gomb disabled-re vált kattintás után (optimistic). Szerver-oldalon: Phase 5-ben session ID-val deduplikálhat, de ez Phase 5 scope.
**Warning signs:** Dupla email a PM-nek dupla xlsx-szel.

## Code Examples

### Bővített BriefBase séma (Agency Brief mezőkkel)

```typescript
// lib/schemas/brief-base.ts
import { z } from "zod";

export const BriefBaseSchema = z.object({
  // === Alapvető információk ===
  company_name: z.string().describe("Cégnév"),
  contact_name: z.string().optional().describe("Kapcsolattartó neve"),
  industry: z.string().optional().describe("Cég tevékenységi köre"),
  brand_positioning: z.string().optional().describe("Márka pozicionálása"),

  // === Kampány részletek ===
  campaign_name: z.string().optional().describe("Kampány neve"),
  campaign_goal: z.string().describe("Kampány célja"),
  main_message: z.string().optional().describe("Fő üzenet"),
  creative_source: z.array(z.string()).optional()
    .describe("Kreatívok forrása (client, roiworks)"),
  creative_types: z.array(z.string()).optional()
    .describe("Kreatív típusok (static, video)"),
  communication_style: z.string().optional().describe("Kommunikációs stílus"),

  // === Csatornák és KPI-k ===
  ad_channels: z.array(z.string()).optional()
    .describe("Online hirdetési csatornák (facebook, instagram, google_gdn, google_search, tiktok, microsoft, youtube, egyéb)"),
  kpis: z.array(z.string()).optional()
    .describe("KPI-k (elérés, megjelenés, link_kattintás, website_event, social_aktivitás, egyéb)"),

  // === Célcsoport ===
  gender: z.array(z.string()).optional()
    .describe("Nem (female, male)"),
  location: z.string().optional().describe("Lakóhely"),
  age_range: z.string().optional().describe("Kor"),
  psychographics: z.string().optional()
    .describe("Pszichográfiai adatok (érdeklődési körök, vásárlási szokások)"),
  persona: z.string().optional().describe("Ideális ügyfélprofil (Persona)"),

  // === Időzítés ===
  start_date: z.string().optional().describe("Indulási dátum"),
  end_date: z.string().optional().describe("Zárási dátum"),
  key_events: z.string().optional().describe("Fontos események"),

  // === Költségvetés ===
  budget_range: z.string().optional().describe("Allokált büdzsé (Ft)"),
  budget_allocation: z.string().optional()
    .describe("Platformonkénti elosztási preferencia"),

  // === Versenytársak ===
  competitors: z.array(z.string()).optional().describe("Fő versenytársak"),
  inspiring_campaigns: z.string().optional()
    .describe("Inspiráló kampányok vagy márkák"),

  // === Egyéb ===
  existing_materials: z.string().optional()
    .describe("Meglévő anyagok (kreativok, brandbook, stb.)"),
  previous_campaigns: z.string().optional()
    .describe("Korábbi kampány tapasztalatok"),
  notes: z.string().optional().describe("Egyéb megjegyzések"),
});
```

**Fontos változások a v1.0-hoz képest:**
- `company_name` marad kötelező (`.string()` — nem optional)
- `campaign_goal` marad kötelező
- `timing` → eltávolítva, helyette `start_date` + `end_date` + `key_events`
- `target_audience` → eltávolítva, helyette `gender` + `location` + `age_range` + `psychographics` + `persona`
- `industry`, `budget_range`, `competitors` → optional-ra változnak (v1.0-ban kötelezőek voltak)
- Új checkbox típusú mezők: `ad_channels`, `kpis`, `gender`, `creative_source`, `creative_types` → `z.array(z.string()).optional()`

### Centralizált szekció definíciók

```typescript
// lib/brief-sections.ts — közös definíciók BriefEditor + PDF + email számára
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
```

### Jóváhagyás API + after() trigger

```typescript
// app/api/approve/route.ts
import { after } from 'next/server';
import type { BriefData } from '@/types/brief';

export async function POST(request: Request) {
  const { briefData }: { briefData: BriefData } = await request.json();

  if (!briefData?.company_name || !briefData?.campaign_goal) {
    return Response.json(
      { error: 'Cégnév és kampány célja kötelező' },
      { status: 400 }
    );
  }

  // Fire-and-forget: trigger Phase 5 research pipeline
  after(async () => {
    try {
      // Phase 5 will implement this function
      // await runResearchPipeline(briefData);
      console.log('[approve] Research pipeline triggered:', briefData.company_name);
    } catch (error) {
      // Phase 6 will handle PM error notification
      console.error('[approve] Research pipeline error:', error);
    }
  });

  return Response.json({ approved: true });
}
```

### Read-only BriefEditor jóváhagyási flow

```typescript
// Jelenlegi flow (v1.0):
// briefData → editable fields → email input → send-brief API → success

// Új flow (v1.1):
// briefData → read-only display → "Jóváhagyom" → approve API → köszönő oldal → "PDF letöltése"
```

## State of the Art

| Old Approach (v1.0) | Current Approach (v1.1) | When Changed | Impact |
|---------------------|-------------------------|--------------|--------|
| Email küldés az ügyfélnek | PDF letöltés, nincs email | Phase 4 | send-brief route kikerül |
| BriefEditor szerkeszthető | BriefEditor read-only | Phase 4 | Egyszerűbb UI, nincs updateField |
| timing szabad szöveg | start_date + end_date | Phase 4 | Pontosabb adat az xlsx-hez |
| target_audience szabad szöveg | gender + age + location + psychographics + persona | Phase 4 | Részletesebb célcsoport adat |
| 10 base mező | ~25 Agency Brief mező | Phase 4 | Teljesebb brief a PM-nek |
| Kampány céllal indul | Cég/márka bemutatással indul | Phase 4 | Természetesebb beszélgetés |

**Deprecated/outdated:**
- `timing` mező → helyette `start_date` + `end_date` + `key_events`
- `target_audience` mező → helyette `gender` + `age_range` + `location` + `psychographics` + `persona`
- `api/send-brief` route → nem kell email küldés az ügyfélnek (Phase 6-ban a PM kap emailt)

## Discretion Recommendations

### 1. Checkbox mezők kezelése az AI-val
**Recommendation:** A checkbox jellegű mezők (ad_channels, kpis, creative_types, creative_source, gender) esetében az AI a `suggest_quick_replies` tool-t használja. A mezőértékek string tömbként tárolódnak az `update_brief` tool-lal.

**Megvalósítás:** Az AI kérdez ("Milyen csatornákon gondolkodtok?"), quick reply gombokkal kínálja a lehetőségeket, és a válaszból `update_brief` tool-lal array-ként rögzíti.

A séma-szinten ezek `z.array(z.string()).optional()`.

### 2. Technikai/admin mezők (technical_requirements, internal_approval)
**Recommendation:** Kihagyni. Ezek a xlsx template-ben szerepelnek, de egy ügyfél-oldali chat-ben nem relevánsak:
- "Technikai követelmények (pl. pixel telepítés)" — ezt a ROI Works csapat dönti el
- "Belső jóváhagyási folyamatok" — belső ügynökségi kérdés

Ne kerüljenek a sémába, ne kérdezze az AI. Ha a PM-nek kellene, az xlsx template-ben üresen maradnak, a PM manuálisan tölti ki.

### 3. Jóváhagyási képernyő layout
**Recommendation:** A meglévő card-alapú layout jó (szekció title + mezők felsorolás). A változás:
- Eltávolítani az email input-ot
- Eltávolítani az editálási lehetőséget
- "Jóváhagyás és küldés" → "Jóváhagyom"
- "Vissza a chatbe" gomb hozzáadása a header-ben
- A checkbox mezőket (ad_channels, kpis, stb.) badge/tag formában megjeleníteni (mint a campaign_types badge-ek)

### 4. Visszamódosítás interakciós minta
**Recommendation:** Egyszerű state toggle:
- BriefEditor-on "Módosítás" vagy "Vissza a chatbe" gomb
- Kattintásra: `setBriefData(null)` — visszakerül a chat nézetre
- A chat állapot (messages, briefState) megmarad
- Az ügyfél ír az AI-nak, az AI módosítja az update_brief tool-lal
- Az AI újra hívja a complete_brief-et → "Brief áttekintése" gomb → frissített BriefEditor

## Open Questions

1. **A campaign_types mező jövője**
   - What we know: A jelenlegi séma `campaign_types: z.array(CampaignTypeEnum).min(1)` kötelező. Az Agency Brief xlsx-ben is van "Kampány típusa" mező, de szabad szöveges.
   - What's unclear: Megtartjuk-e a 4 enum típust (media_buying, performance_ppc, brand_awareness, social_media) és a típusspecifikus sémákat/modulokat, vagy egyszerűsítünk?
   - Recommendation: Megtartani. A típusspecifikus modulok értékes extra kérdéseket adnak. Az Agency Brief "Kampány típusa" mező szabadszöveges verziója a `campaign_name` + `campaign_goal` mezőkbe kerül, a classify_campaign tool továbbra is felismeri a típust.

2. **send-brief route sorsa**
   - What we know: Az ügyfélnek nem küldünk emailt. A PM-nek a Phase 6-ban küldünk xlsx-eket.
   - What's unclear: A `send-brief` route-ot töröljük-e most, vagy Phase 6-ban alakítjuk át?
   - Recommendation: Most töröljük (vagy kommentezzük ki). A Phase 6 teljesen újat épít xlsx csatolmánnyal. A régi PDF-küldő logika nem kell.

## Sources

### Primary (HIGH confidence)
- Agency Brief xlsx template: `docs/ROI_Mediaplan/ROIworks _ TEMPLATE_ Agency campaign brief.xlsx` — teljes mező struktúra kiolvasva
- Jelenlegi kódbázis: összes érintett fájl olvasva és elemezve
- Next.js after() docs: https://nextjs.org/docs/app/api-reference/functions/after — stabil v15.1.0 óta, Next.js 16-ban is elérhető

### Secondary (MEDIUM confidence)
- Zod v4 API: a jelenlegi séma patterneket követi, `.optional()`, `.array()`, `.describe()` mind működik

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — minden ami kell, már a projektben van
- Architecture: HIGH — a jelenlegi pattern-ek jól skálázódnak, az átalakítás világos
- Pitfalls: HIGH — a kódbázis alapos elemzése alapján azonosítva
- Séma bővítés: HIGH — az xlsx template-ből kiolvasott pontos mező lista alapján
- after() API: HIGH — hivatalos Next.js docs alapján, stabil v15.1.0 óta

**Research date:** 2026-02-12
**Valid until:** 2026-03-14 (stabil, lassú változás)
