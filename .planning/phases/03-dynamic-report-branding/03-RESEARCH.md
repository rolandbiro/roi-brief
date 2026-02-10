# Phase 3: Dynamic Report & Branding - Research

**Researched:** 2026-02-10
**Domain:** PDF generation, read-only brief review UI, email delivery, ROI Works branding
**Confidence:** HIGH

## Summary

A Phase 3 három fő területet fed le: (1) read-only brief áttekintés az érdeklődőnek, (2) PDF generálás ROI Works arculatban, (3) email küldés a ROI Works csapatnak + jóváhagyás flow. A projektben már van @react-pdf/renderer (v4.3.2) és SendGrid (v8.1.6) integráció, de ezek a régi nested BriefData sémára épülnek — a Phase 2 flat sémára való átírás az első és legkritikusabb feladat.

Az arculati kézikönyv (docs/demand/roi_arculat_2026.pdf) egyértelmű iránymutatást ad: Archivo / Archivo SemiExpanded betűtípus, narancs #FF6400, kék #0022D2, szürke #E3E3E3, sötét #3C3E43/#2A2B2E. A Logo.tsx SVG már létezik és újrahasználható a PDF-ben a @react-pdf/renderer natív SVG komponenseivel.

**Primary recommendation:** Először a régi sémából fakadó ~60 TS hibát kell kijavítani (BriefEditor, pdf-template, email-template, send-brief route), majd az új flat sémához illő dinamikus riport struktúrát kell építeni. A BriefEditor teljes átírása szükséges: szerkeszthető formból read-only áttekintésre.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Executive summary az elején — hasonló formátumban mint amit a chat jelenleg ad (kampány neve, cél, budget, target CPA, platform, tartalom, szolgáltatások, technikai infó)
- Multi-típus brief: Claude dönti el a legjobb struktúrát (közös fejléc + külön szekciók vs. témakörönként összevonva)
- Szekciók sorrendje: Claude optimalizálja típusonként
- Üres mezők (amit az érdeklődő nem mondott el) NEM jelennek meg — csak az derül ki amit mondott
- **Read-only nézet** — nem szerkeszthető editor, hanem strukturált áttekintés a chat-ből gyűjtött adatokról
- Az érdeklődő a chat végén „Brief áttekintése" gombbal jut ide (nem automatikus átirányítás)
- Elérhető akciók: „Jóváhagyás és küldés" + „PDF letöltés" (nincs „vissza a chatbe" és „link másolás")
- Ha valami nem stimmel, az érdeklődő a chatben javítja (nem az editorban)
- Email cím mező a jóváhagyás oldalon — az érdeklődő itt adja meg
- ROI Works arculati útmutató: `docs/demand/roi_arculat_2026.pdf` — ebből kell dolgozni
- Minden arculati elem használandó: logó, márka színek, Archivo betűtípus, egyéb grafikus elemek
- Hangvétel: barátságos, modern — tegező, közvetlen stílus (mint a chat)
- Jóváhagyás gomb = email elmegy a ROI Works-nek + PDF letölthető egyben
- Email csak a ROI Works csapatnak megy (az érdeklődő nem kap email másolatot)
- Email cím az érdeklődőtől a jóváhagyás oldalon kérendő (nem a chatben)
- Jóváhagyás után: „Köszönjük!" siker oldal + PDF letöltés link

### Claude's Discretion
- Multi-típus brief szekció struktúra (közös fejléc + külön szekciók vs. témakör alapú)
- Szekciók sorrendje kampánytípusonként
- BriefEditor dinamikus mezőmegjelenítés logikája
- PDF layout részletei (margók, fejléc/lábléc, oldalszámozás)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-pdf/renderer | 4.3.2 | PDF generálás React komponensekből | Már a projektben van, működik a send-brief route-ban |
| @sendgrid/mail | 8.1.6 | Email küldés | Már a projektben van, konfigurálva |
| React | 19.2.3 | UI komponensek | Projektben van |
| Next.js | 16.1.1 | API route-ok, routing | Projektben van |
| Zod | 4.3.6 | Schema validáció | Projektben van, BriefDataSchema definiálva |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-pdf/renderer Font API | (built-in) | Archivo betűtípus regisztrálás | PDF-ben custom font használathoz |
| @react-pdf/renderer SVG API | (built-in) | ROI Works logó beágyazás | PDF fejlécben logó megjelenítéshez |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @react-pdf/renderer | puppeteer/playwright | Headless browser = nehezebb, lassabb, Vercel-en problémás |
| Server-side renderToBuffer | Client-side PDFDownloadLink | Már működik a server-side, konzisztens a send-brief-fel |
| Google Fonts URL Archivo | Self-hosted TTF | Google Fonts URL egyszerűbb, nincs font fájl karbantartás |

**Installation:**
Nincs új dependency — minden megvan a package.json-ban.

## Architecture Patterns

### Jelenlegi struktúra és szükséges változtatások
```
components/
├── BriefEditor.tsx          # ÁTÍRÁS: szerkeszthető form → read-only áttekintés
├── Logo.tsx                 # SVG logó — ÚJ: PDF-kompatibilis verzió is kell

lib/
├── pdf-template.tsx         # ÁTÍRÁS: flat séma + dinamikus szekciók + arculat
├── email-template.ts        # ÁTÍRÁS: flat séma + dinamikus szekciók
├── pdf-fonts.ts             # ÚJ: Font.register() Archivo betűtípushoz
├── pdf-logo.tsx             # ÚJ: @react-pdf/renderer SVG logó komponens

app/
├── api/send-brief/route.tsx # ÁTÍRÁS: flat séma, csak ROI-nak küld (nem az érdeklődőnek)
├── brief/page.tsx           # MÓDOSÍTÁS: flow átírás (chat → áttekintés → jóváhagyás → siker)
```

### Pattern 1: Dinamikus szekció renderelés (BriefData flat séma alapján)
**What:** A BriefData flat sémából (company_name, campaign_goal, stb.) kiszűri a kitöltött mezőket, és kampánytípus-specifikus szekciókat renderel.
**When to use:** BriefEditor read-only nézet, PDF template, email template — mindhárom ugyanazt a logikát használja.

**Megvalósítási stratégia:**
```typescript
// Közös helper: "van-e értéke ennek a mezőnek?"
function hasValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

// Szekció definíció típusonként
interface SectionField {
  key: string;          // BriefData mező kulcs (pl. "company_name")
  label: string;        // Magyar megjelenítési címke
}

interface Section {
  title: string;
  fields: SectionField[];
  condition?: (data: BriefData) => boolean;  // Mikor jelenik meg
}

// Pl. media_specific szekció csak ha campaign_types tartalmazza "media_buying"-ot
const MEDIA_SECTION: Section = {
  title: "Médiavásárlás részletek",
  fields: [
    { key: "media_specific.grp_target", label: "Célzott GRP" },
    { key: "media_specific.reach_target", label: "Elvárt elérés" },
    // ...
  ],
  condition: (data) => data.campaign_types.includes("media_buying"),
};
```

### Pattern 2: Font regisztráció @react-pdf/renderer-ben
**What:** Archivo és Archivo SemiExpanded betűtípusok regisztrálása a PDF generáláshoz.
**When to use:** Az összes PDF template fontFamily hivatkozás előtt.

**Megvalósítás:**
```typescript
// lib/pdf-fonts.ts
import { Font } from "@react-pdf/renderer";

// Google Fonts gstatic direct TTF URL-ek
// FONTOS: Ezeket a konkrét URL-eket a Google Fonts API-ból kell kinyerni
Font.register({
  family: "Archivo",
  fonts: [
    { src: "https://fonts.gstatic.com/s/archivo/v19/k3kPo8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTNDJp8B1oJ0vyVQ.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/archivo/v19/k3kPo8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTBDNp8B1oJ0vyVQ.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/archivo/v19/k3kPo8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTkDRp8B1oJ0vyVQ.ttf", fontWeight: 700 },
    { src: "https://fonts.gstatic.com/s/archivo/v19/k3kPo8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTT9zRp8B1oJ0vyVQ.ttf", fontWeight: 900 },
  ],
});

// Archivo SemiExpanded — headline-okhoz
Font.register({
  family: "Archivo SemiExpanded",
  fonts: [
    // Hasonló pattern, SemiExpanded variáns URL-ek
  ],
});
```

**FONTOS megjegyzés:** A Google Fonts URL-ek konkrét hash-t tartalmaznak ami változhat. Az implementáció során a pontos URL-eket a Google Fonts CSS-ből kell kinyerni (curl -A "Mozilla/5.0" "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700;900"). React-pdf csak TTF/WOFF formátumot támogat.

**Fallback:** Ha az Archivo nem elérhető (hálózati hiba), a @react-pdf/renderer beépített Helvetica font-ot használ — ez elfogadható fallback.

### Pattern 3: ROI Works logó SVG a PDF-ben
**What:** A Logo.tsx SVG-jét át kell fordítani @react-pdf/renderer SVG komponensekre.
**When to use:** PDF fejléc.

```typescript
// lib/pdf-logo.tsx
import { Svg, Path, Text, G } from "@react-pdf/renderer";

export function PdfLogo({ width = 120 }: { width?: number }) {
  return (
    <Svg viewBox="0 0 200 50" width={width}>
      <G>
        <Path d="M0 40 L0 22 L10 12 L10 40 Z" fill="#FF6400" />
        <Path d="M14 40 L14 14 L24 4 L24 40 Z" fill="#FF6400" />
        <Path d="M28 40 L28 26 L38 16 L38 40 Z" fill="#FF6400" />
      </G>
      {/* Text elemek Archivo SemiExpanded-del */}
    </Svg>
  );
}
```

**SVG Text gotcha:** A @react-pdf/renderer SVG `<Text>` eleme eltérhet a HTML SVG-től. Tesztelni kell hogy a fontFamily és fontWeight helyesen renderelődik-e SVG text-ben. Ha nem, a logó text részét rajzolt Path-ként kell megoldani, vagy Image komponenst használni PNG-vel.

### Pattern 4: Server-side PDF letöltés endpoint
**What:** Külön API route a PDF letöltéshez (nem email, csak PDF buffer visszaadás).
**When to use:** A jóváhagyás utáni "PDF letöltés" gombhoz.

```typescript
// app/api/download-pdf/route.tsx
export async function POST(request: Request) {
  const { briefData } = await request.json();
  const pdfBuffer = await renderToBuffer(<BriefPDF data={briefData} />);

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="roi-works-brief.pdf"`,
    },
  });
}
```

### Anti-Patterns to Avoid
- **Client-side PDF generálás PDFDownloadLink-kel:** A szerver-oldalon már működik a renderToBuffer, ne keverjük a kliens-oldali megoldást. Konzisztensebb ha mind a letöltés, mind az email ugyanazt a szerver-oldali template-et használja.
- **Arculati elemek hardcode-olása az összes template-be:** Közös konstansokat/helper-eket kell definiálni (színek, betűméretek, margók) amiket mind a PDF, mind az email template használ.
- **Üres mezők megjelenítése:** A döntés szerint CSAK a kitöltött mezők jelennek meg. Soha ne rendereljünk "—" vagy "N/A" tartalmú sorokat.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF generálás | Custom PDF byte manipulation | @react-pdf/renderer (már van) | Komplex bináris formátum, tipográfiai szabályok |
| Email HTML | Kézzel írt responsive email | Meglévő email-template.ts minta (inline CSS, table layout) | Email HTML rendering engine-specifikus, a jelenlegi template jó referencia |
| Font betöltés PDF-be | Kézzel letöltött TTF fájlok | Font.register() Google Fonts URL-lel | Automatikus cache, nem kell verziózni |
| Schema validáció | Kézi type check | Zod BriefDataSchema (már van) | A séma már definiált, parse() automatikus |

**Key insight:** A meglévő kódbázis minden szükséges library-t tartalmaz. A Phase 3 lényege nem új tech bevezetése, hanem a meglévő komponensek (BriefEditor, pdf-template, email-template, send-brief route) átírása az új flat BriefData sémához, dinamikus szekciók hozzáadása, és arculati elemek alkalmazása.

## Common Pitfalls

### Pitfall 1: Régi nested séma maradványok
**What goes wrong:** A BriefEditor, pdf-template, email-template, és send-brief route mind a régi nested sémát használja (data.company.name, data.campaign.goal), de a BriefData már flat (company_name, campaign_goal). Ez ~60 TS hibát okoz.
**Why it happens:** A Phase 1-2 átírta a BriefDataSchema-t flat struktúrára, de a fogyasztó komponenseket Phase 3-ra halasztotta.
**How to avoid:** Ez az ELSŐ feladat legyen. Addig semmi más nem tesztelhető amíg a TS hibák nem javulnak.
**Warning signs:** `npx tsc --noEmit` — 60+ error a BriefEditor, pdf-template, email-template, send-brief fájlokban.

### Pitfall 2: @react-pdf/renderer SVG Text + custom font
**What goes wrong:** Az SVG `<Text>` elemben a fontFamily nem mindig működik a regisztrált fontokkal. A @react-pdf/renderer SVG renderelője eltérhet a normál szöveg renderelőtől.
**Why it happens:** Az SVG text és a normál PDF text különböző kódúton megy keresztül.
**How to avoid:** A logó szöveges részét előbb teszteld izoláltan. Ha nem működik, készíts PNG-t a logóból és használd az Image komponenst. Vagy a logó text részét Path-ként rajzold meg.
**Warning signs:** A PDF-ben a logó szöveg alapértelmezett fontban jelenik meg, nem Archivo-ban.

### Pitfall 3: Google Fonts TTF URL-ek változása
**What goes wrong:** A fonts.gstatic.com URL-ek hash-t tartalmaznak ami a font újabb verziójával megváltozhat.
**Why it happens:** Google nem garantálja a statikus URL-ek állandóságát.
**How to avoid:** Tegyük a font URL-eket konstansba, és ha a build/PDF generálás elszáll, először a font URL-eket ellenőrizzük. Alternatíva: self-hosted TTF fájlok a public/ mappában.
**Warning signs:** A PDF-ben Helvetica jelenik meg Archivo helyett, vagy a renderToBuffer hibát dob.

### Pitfall 4: Email HTML template eltérő renderelés
**What goes wrong:** Az email kliensek (Gmail, Outlook, Apple Mail) különbözően renderelnek — CSS support korlátozott.
**Why it happens:** Email kliensek saját CSS rendszerét használják, nem a web standardot.
**How to avoid:** A jelenlegi email-template.ts jó mintát követ (inline CSS, table layout, role="presentation"). Folytassuk ezt a pattern-t. NE használjunk CSS Flexbox-ot, Grid-et, vagy external stylesheet-et az emailben.
**Warning signs:** Az email Gmailben jól néz ki, de Outlookban szétesik.

### Pitfall 5: Dinamikus PDF tartalom túlcsordulás
**What goes wrong:** Ha a brief sok adatot tartalmaz (multi-típus, hosszú szövegek), a PDF egyetlen oldalra nem fér el.
**Why it happens:** A @react-pdf/renderer nem automatikusan lapoz, hacsak nem Page break-eket használunk.
**How to avoid:** A @react-pdf/renderer automatikusan kezel page break-eket a View elemek között. De explicit `break` prop-pal is lehet szabályozni. Tesztelni kell sok adattal.
**Warning signs:** A PDF-ben a tartalom levágódik az oldal alján.

### Pitfall 6: SendGrid email küldés — érdeklődő vs. ROI Works
**What goes wrong:** A jelenlegi send-brief route az érdeklődőnek IS küld emailt (clientEmail benne van a recipient listában).
**Why it happens:** A régi logika szerint az érdeklődő is kap másolatot.
**How to avoid:** A döntés szerint az email CSAK a ROI Works csapatnak megy. A clientEmail-t meg kell kérni (a jóváhagyás oldalon), de az emailt csak a BRIEF_RECIPIENT_1, BRIEF_RECIPIENT_2 címekre kell küldeni. Az érdeklődő email címe a brief adataiban szerepeljen (a ROI Works csapat így éri el).
**Warning signs:** Az érdeklődő kap egy briefet email-ben (nem kívánt).

## Code Examples

### Dinamikus szekció renderelés (közös helper)
```typescript
// lib/brief-sections.ts
import { BriefData, CampaignType, CAMPAIGN_TYPE_LABELS } from "@/types/brief";

interface FieldDef {
  key: string;
  label: string;
}

interface SectionDef {
  title: string;
  fields: FieldDef[];
  condition?: (data: BriefData) => boolean;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc, key) =>
    (acc as Record<string, unknown>)?.[key], obj);
}

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

// Alapszekciók (minden típusnál megjelennek)
const BASE_SECTIONS: SectionDef[] = [
  {
    title: "Cégadatok",
    fields: [
      { key: "company_name", label: "Cégnév" },
      { key: "industry", label: "Iparág" },
    ],
  },
  {
    title: "Kampány",
    fields: [
      { key: "campaign_goal", label: "Kampány célja" },
      { key: "timing", label: "Időzítés" },
      { key: "budget_range", label: "Büdzsé" },
      { key: "target_audience", label: "Célcsoport" },
    ],
  },
];

// Típusspecifikus szekciók
const TYPE_SECTIONS: Record<CampaignType, SectionDef> = {
  media_buying: {
    title: "Médiavásárlás részletek",
    fields: [
      { key: "media_specific.grp_target", label: "Célzott GRP" },
      { key: "media_specific.reach_target", label: "Elvárt elérés" },
      { key: "media_specific.frequency_cap", label: "Frekvencia limit" },
      { key: "media_specific.media_types", label: "Médiatípusok" },
      { key: "media_specific.daypart_preferences", label: "Napszak preferenciák" },
      { key: "media_specific.viewability_requirements", label: "Viewability elvárások" },
    ],
    condition: (data) => data.campaign_types.includes("media_buying"),
  },
  // ... hasonlóan a többi típushoz
};

// Szekciók összegyűjtése a BriefData alapján (üres mezők kiszűrve)
export function getActiveSections(data: BriefData): Array<{ title: string; fields: Array<{ label: string; value: string }> }> {
  const allSections = [
    ...BASE_SECTIONS,
    ...data.campaign_types.map(t => TYPE_SECTIONS[t]).filter(Boolean),
    // Egyéb szekciók (versenytársak, megjegyzések)
  ];

  return allSections
    .filter(s => !s.condition || s.condition(data))
    .map(section => ({
      title: section.title,
      fields: section.fields
        .map(f => ({
          label: f.label,
          value: formatValue(getNestedValue(data as unknown as Record<string, unknown>, f.key)),
        }))
        .filter(f => f.value !== null),
    }))
    .filter(s => s.fields.length > 0);
}
```

### Font regisztráció
```typescript
// lib/pdf-fonts.ts
import { Font } from "@react-pdf/renderer";

// Font.register() EGYSZER kell meghívni, modul szinten
Font.register({
  family: "Archivo",
  fonts: [
    { src: "[GOOGLE_FONTS_TTF_URL_REGULAR]", fontWeight: 400 },
    { src: "[GOOGLE_FONTS_TTF_URL_BOLD]", fontWeight: 700 },
    { src: "[GOOGLE_FONTS_TTF_URL_BLACK]", fontWeight: 900 },
  ],
});

// Hyphenation kikapcsolása (magyar szövegnél fontos)
Font.registerHyphenationCallback(word => [word]);
```

### PDF letöltés API route
```typescript
// app/api/download-pdf/route.tsx
import { renderToBuffer } from "@react-pdf/renderer";
import { BriefPDF } from "@/lib/pdf-template";

export async function POST(request: Request) {
  const { briefData } = await request.json();

  const pdfElement = <BriefPDF data={briefData} />;
  const pdfBuffer = await renderToBuffer(pdfElement);

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=\"roi-works-brief.pdf\"",
    },
  });
}
```

### Kliens-oldali PDF letöltés trigger
```typescript
async function downloadPdf(briefData: BriefData) {
  const response = await fetch("/api/download-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ briefData }),
  });

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `roi-works-brief-${Date.now()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Nested BriefData (company.name) | Flat BriefData (company_name) | Phase 2 (02-01) | BriefEditor, pdf-template, email-template mind át kell írni |
| Szerkeszthető BriefEditor | Read-only brief áttekintés | Phase 3 döntés | Teljes BriefEditor újraírás |
| Email az érdeklődőnek is | Email csak ROI Works-nek | Phase 3 döntés | send-brief route recipient lista módosítás |
| Statikus szekciók (mindig ugyan az) | Dinamikus szekciók (típus alapján) | Phase 3 cél | Szekció konfig + conditional rendering |
| Helvetica a PDF-ben | Archivo betűtípus | Phase 3 branding | Font.register() szükséges |

**Deprecated/outdated:**
- A jelenlegi BriefEditor.tsx TELJES EGÉSZÉBEN cserélendő — a Phase 3 döntés szerint read-only nézet, nem szerkeszthető form
- A jelenlegi pdf-template.tsx és email-template.ts a régi sémát használja — TS hibák

## ROI Works Arculat — összefoglaló a PDF-hez

Az arculati kézikönyvből (docs/demand/roi_arculat_2026.pdf, 20 oldal) a következő elemek relevánsak:

### Színek
| Szín | HEX | Használat |
|------|-----|----------|
| Narancs (elsődleges) | #FF6400 | Logó, szekció címek, kiemelések |
| Kék (elsődleges) | #0022D2 | Linkek, másodlagos kiemelések |
| Szürke (háttér) | #E3E3E3 | Elválasztó vonalak, háttér szekciók |
| Sötétszürke | #3C3E43 | Szöveg (másodlagos) |
| Sötét | #2A2B2E | Fejléc/lábléc háttér, fő szöveg |
| Fekete | #000000 | Erős szöveg |
| Fehér | #FFFFFF | Fő háttér, fehér szöveg sötét alapon |

### Tipográfia
| Elem | Font | Vastagság | Méret (referencia) |
|------|------|-----------|-------------------|
| Headline | Archivo SemiExpanded | Black (900) | 40pt (nyomtatott) |
| Kenyérszöveg | Archivo | Regular (400) | 8-10pt (nyomtatott) |
| Másodlagos | Arial | Regular/Bold | Fallback |

### Logó elhelyezés
- Nyomtatott anyagokon: bal felső sarok
- Minimum méret digitálisan: x = 100px
- Eltartás: 1/4 x a logó körül minden irányban
- Engedélyezett változatok: fekete logó fehér háttéren, fehér logó sötét/narancs/kék háttéren
- **PDF-ben:** Fehér háttér → fekete logó + narancs ikon VAGY sötét fejléc → fehér logó

### Layout guideline a levélpapírból (referencia a PDF-hez)
- Margók: 10mm (kb. 28pt) minden oldalon
- Fejléc: logó bal felső + elérhetőség jobb felső
- Szövegtörzs: Archivo Regular 10pt/16pt sormagasság

## Recommendation: Multi-típus brief struktúra (Claude's Discretion)

A döntés szerint Claude határozza meg a struktúrát, de a PDF renderelés szempontjából ajánlott pattern:

**Ajánlás: Közös fejléc + típusonként külön szekció**

Indoklás:
1. A PDF-ben a vizuális elkülönítés fontos — az olvasó (ROI Works csapat) gyorsan azonosítsa melyik típusról van szó
2. A flat séma természetesen támogatja: base fields → type-specific fields
3. Implementáció szempontjából egyszerűbb: iterálni a campaign_types-on és renderelni az adott TYPE_SECTION-t

```
┌─────────────────────────────────┐
│ ROI Works logó        Dátum     │  ← Fejléc
├─────────────────────────────────┤
│ Executive Summary               │  ← Cég, cél, büdzsé, célcsoport
│   Cégnév: ...                   │
│   Kampány célja: ...            │
│   Büdzsé: ...                   │
├─────────────────────────────────┤
│ Performance/PPC részletek       │  ← Típus 1 szekció
│   Cél ROAS: ...                 │
│   Konverziós események: ...     │
├─────────────────────────────────┤
│ Social Media részletek          │  ← Típus 2 szekció
│   Platformok: ...               │
│   Tartalom típusok: ...         │
├─────────────────────────────────┤
│ Egyéb                           │  ← Versenytársak, megjegyzések
│   Versenytársak: ...            │
│   Megjegyzések: ...             │
├─────────────────────────────────┤
│ ROI Works © 2026     Oldalszám  │  ← Lábléc
└─────────────────────────────────┘
```

## Recommendation: PDF Layout részletek (Claude's Discretion)

- **Margók:** 40pt (hasonló a levélpapír 10mm-hez, de PDF-ben kényelmesebb)
- **Fejléc:** Logó (bal) + dátum (jobb) + narancs elválasztó vonal alatta — a jelenlegi pdf-template.tsx mintája jó
- **Lábléc:** Oldalszám (jobb) + "ROI Works AI Brief" (közép) — position: absolute bottom
- **Szekció címek:** Archivo SemiExpanded Black 14pt, narancs szín, alávonás #E3E3E3
- **Label-ek:** Archivo Regular 10pt, #3C3E43
- **Értékek:** Archivo Regular 10pt, #2A2B2E (vagy #000000)
- **Page break:** Automatikus @react-pdf/renderer kezelés, nincs explicit break szükség

## Open Questions

1. **Archivo font TTF URL-ek**
   - What we know: Google Fonts-on elérhető, Font.register() TTF/WOFF URL-t vár
   - What's unclear: A pontos gstatic URL-ek (hash-t tartalmaznak) — implementáció során kell kinyerni
   - Recommendation: `curl -A "Mozilla/5.0" "https://fonts.googleapis.com/css2?family=Archivo:wght@400;700;900&family=Archivo+SemiExpanded:wght@400;700;900"` paranccsal kinyerhető a TTF URL

2. **SVG Text a PDF logóban**
   - What we know: @react-pdf/renderer támogatja az SVG Text elemet
   - What's unclear: A custom fontFamily (Archivo SemiExpanded) SVG Text-ben működik-e
   - Recommendation: Tesztelni. Ha nem működik, két alternatíva: (a) logó text-et Path-ként rajzolni, (b) PNG képet használni Image komponenssel

3. **BriefEditor read-only nézet — a jelenlegi "Brief kész!" gomb működése**
   - What we know: Jelenleg briefData !== null trigger-eli a BriefEditor-t (brief/page.tsx:46)
   - What's unclear: Az áttekintő nézet pontosan mikor jelenjen meg — a "Brief áttekintése" gomb megtartható a jelenlegi "Brief megtekintése" gomb helyén
   - Recommendation: Ugyanaz a flow, de a gomb szövege "Brief áttekintése", és a BriefEditor → read-only BriefReview komponens

## Sources

### Primary (HIGH confidence)
- Codebase analysis: package.json, BriefDataSchema, BriefEditor.tsx, pdf-template.tsx, email-template.ts, send-brief/route.tsx, chat/route.ts — közvetlen fájl olvasás
- ROI Works arculati kézikönyv: docs/demand/roi_arculat_2026.pdf (20 oldal, teljes áttekintés)
- TypeScript hiba lista: `npx tsc --noEmit` — 60+ hiba azonosítva a régi séma miatt
- @react-pdf/renderer hivatalos docs: https://react-pdf.org/fonts, https://react-pdf.org/svg, https://react-pdf.org/components

### Secondary (MEDIUM confidence)
- @react-pdf/renderer Next.js kompatibilitás: GitHub issues (#2460, #2356, #3074) — a projekt Next.js 16-on van és a renderToBuffer már működik a send-brief route-ban
- Google Fonts Archivo: https://fonts.google.com/specimen/Archivo — elérhető

### Tertiary (LOW confidence)
- Google Fonts gstatic TTF URL-ek: konkrét hash-ek nem ellenőrizhetők előre — implementáció során kell validálni

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — minden library már a projektben van, verziók ismertek
- Architecture: HIGH — a jelenlegi kódbázis alapos ismerete, egyértelmű átírási terv
- Pitfalls: HIGH — TS hibák empirikusan azonosítva, @react-pdf/renderer font/SVG gotchák dokumentáltak
- Arculat: HIGH — a teljes 20 oldalas PDF áttekintve, konkrét értékek kinyerve

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (stabil stack, nincs gyorsan változó dependency)
