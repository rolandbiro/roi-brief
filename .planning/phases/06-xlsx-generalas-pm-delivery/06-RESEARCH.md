# Phase 6: Xlsx generálás és PM delivery - Research

**Researched:** 2026-02-12
**Domain:** XLSX template filling + email delivery pipeline
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Subject line formátum: „Új brief: [Ügyfél neve] — [Kampány neve]"
- Email body: rövid összefoglaló (3-5 sor) — ügyfél neve, kampány cél, büdzsé, időszak — alatta a csatolt xlsx
- Plain text formátum (nem HTML)
- A kutatási források (URL-ek) az email body-ban jelennek meg, nem az xlsx-ben
- 1 db kombinált xlsx melléklet (Agency Brief + Mediaplan külön sheet-eken)
- Mind a 3 KPI érték megjelenik: Min | Likely | Max — külön oszlopokban
- Ha egy KPI metrika nem releváns: üres cella
- Nincs AI-becslés jelölés
- Hibaértesítés közepes részletességgel: melyik lépés bukott el + mi a teendő
- Részleges siker: ami elkészült, azt elküldi + jelzi, mi hiányzik
- Retry link az email-ben
- PM címzett env változóból (PM_EMAIL) — később admin felületről konfigurálható
- Feladó: info@valueonboard.com
- Több PM támogatás: fő címzett + opcionális CC címek
- SendGrid marad

### Claude's Discretion
- Xlsx library kiválasztása (ExcelJS, SheetJS, stb.)
- Template formázás megőrzésének technikai megoldása
- Retry link implementáció (egyedi token, session ID, stb.)
- Email szöveg pontos megfogalmazása

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

## Summary

Ez a phase a pipeline végső lépése: az AI kutatási eredményeket és a brief adatokat xlsx template-ekbe írja, majd emailben elküldi a PM-nek. A fő technikai kihívás az xlsx template-ek formázásának megőrzése az adatbeírás során, különösen az összevont cellák, checkbox-ok és képletek kezelése.

Az xlsx template-ek (5 db: 1 Agency Brief + 4 Mediaplan variáns) komplex struktúrájúak: összevont cellák, Excel képletek, checkbox-hoz kötött boolean cellák, és dinamikus PPC Channel Mix sorok. A Mediaplan template kiválasztása a `ResearchResults.template_type` alapján történik (`ppc_traffic` | `ppc_reach` | `ppc_mixed` | `all_channels`).

A decision szerint 1 kombinált xlsx-ben kell mindkét sheet-et elküldeni (Agency Brief + Mediaplan), ami ExcelJS-ben a worksheet model copy pattern-nel megoldható. A SendGrid attachment API base64-kódolt buffer-t vár, amit az ExcelJS `writeBuffer()` közvetlenül biztosít.

**Primary recommendation:** ExcelJS 4.4.0 az xlsx kezeléshez — read template → fill cells → combine sheets → writeBuffer → SendGrid attachment. A retry-hoz egyedi token generálás + dedikált API route.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| exceljs | 4.4.0 | XLSX read/write/modify | Legjobb formázás-megőrzés Node.js-ben. Támogatja: merged cells, styles, formulas, `load(buffer)` / `writeBuffer()`. 3.7M+ weekly downloads. |
| @sendgrid/mail | 8.1.6 | Email küldés attachment-tel | Már telepítve a projektben. Attachment API: base64 content + MIME type. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto (Node built-in) | — | Retry token generálás | `randomUUID()` vagy `randomBytes()` a retry linkhez |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ExcelJS | xlsx-populate | Utolsó release 2020 — de jobb style preservation. Nem karbantartott, kockázatos. |
| ExcelJS | xlsx-template | Friss (2026.01), de template placeholder syntax-ot igényel — nem kompatibilis a meglévő template-ekkel. |
| ExcelJS | SheetJS (xlsx) | Ingyenes verzió nem tartja meg a style-okat. Pro verzió fizetős. |

**Installation:**
```bash
npm install exceljs@4.4.0
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── xlsx/
│   ├── fill-agency-brief.ts    # Agency Brief template kitöltés
│   ├── fill-mediaplan.ts       # Mediaplan template kitöltés (4 variáns)
│   ├── combine-workbook.ts     # 2 sheet → 1 workbook
│   └── template-paths.ts       # Template fájl útvonalak
├── delivery/
│   ├── send-pm-email.ts        # Sikeres email küldés
│   ├── send-error-email.ts     # Hiba email küldés
│   └── retry-token.ts          # Retry token generálás/validálás
app/
├── api/
│   ├── approve/route.ts        # Meglévő — bővíteni a delivery pipeline-nal
│   └── retry/[token]/route.ts  # Retry endpoint
```

### Pattern 1: Template Fill — Read, Modify, Buffer
**What:** Xlsx template betöltés fájlból, cellák kitöltése, buffer-be írás
**When to use:** Minden template kitöltésnél
**Example:**
```typescript
// Source: ExcelJS README + npm docs
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

async function fillTemplate(templateName: string, fillFn: (ws: ExcelJS.Worksheet) => void): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const templatePath = path.join(process.cwd(), 'docs', 'ROI_Mediaplan', templateName);
  const templateBuffer = fs.readFileSync(templatePath);
  await wb.xlsx.load(templateBuffer);

  const ws = wb.worksheets[0];
  fillFn(ws);

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
```

### Pattern 2: Combine Two Workbooks Into One
**What:** Agency Brief és Mediaplan sheet-ek 1 workbook-ba másolása
**When to use:** A kombinált xlsx melléklet készítésekor
**Example:**
```typescript
// Source: ExcelJS GitHub Discussion #1707 + Issue #591
async function combineWorkbooks(briefBuffer: Buffer, mediaplanBuffer: Buffer): Promise<Buffer> {
  const combined = new ExcelJS.Workbook();

  const briefWb = new ExcelJS.Workbook();
  await briefWb.xlsx.load(briefBuffer);
  const briefSheet = combined.addWorksheet('Agency Brief');
  briefSheet.model = Object.assign(
    {},
    briefWb.worksheets[0].model,
    { mergeCells: briefWb.worksheets[0].model.merges }
  );
  briefSheet.name = 'Agency Brief';

  const mediaWb = new ExcelJS.Workbook();
  await mediaWb.xlsx.load(mediaplanBuffer);
  const mediaSheet = combined.addWorksheet('Mediaplan');
  mediaSheet.model = Object.assign(
    {},
    mediaWb.worksheets[0].model,
    { mergeCells: mediaWb.worksheets[0].model.merges }
  );
  mediaSheet.name = 'Mediaplan';

  return Buffer.from(await combined.xlsx.writeBuffer());
}
```

### Pattern 3: SendGrid Attachment
**What:** Xlsx buffer elküldése email mellékletként
**When to use:** PM értesítésnél
**Example:**
```typescript
// Source: SendGrid docs/use-cases/attachments.md
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

await sgMail.send({
  to: process.env.PM_EMAIL!,
  cc: process.env.PM_CC_EMAILS?.split(',').map(e => e.trim()).filter(Boolean),
  from: 'info@valueonboard.com',
  subject: `Új brief: ${companyName} — ${campaignName}`,
  text: emailBody,
  attachments: [{
    content: xlsxBuffer.toString('base64'),
    filename: `${companyName}-brief-mediaplan.xlsx`,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    disposition: 'attachment',
  }],
});
```

### Pattern 4: Retry Token + API Route
**What:** Egyedi token generálás a retry linkhez, validálás a retry endpoint-on
**When to use:** Hiba email-ben a retry link, és annak feldolgozása
**Example:**
```typescript
// retry-token.ts
import { randomUUID } from 'crypto';

// In-memory store (egyszerű, de Vercel serverless miatt nem persist)
// Alternatíva: token = briefData hash, nem kell store
const retryTokens = new Map<string, { briefData: unknown; createdAt: number }>();

export function createRetryToken(briefData: unknown): string {
  const token = randomUUID();
  retryTokens.set(token, { briefData, createdAt: Date.now() });
  return token;
}
```

### Anti-Patterns to Avoid
- **Ne generálj xlsx-t nulláról:** Mindig a meglévő template-ből indulj — a formázás reprodukálása kódból lehetetlen.
- **Ne használj insertRows-t a PPC Channel Mix-hez:** Az insertRows elcsúsztatja a merged cell referenciákat és a képleteket. Inkább a template-ben lévő placeholder sorok felülírása + felesleges sorok ürítése a jó megoldás.
- **Ne tárolj state-et memóriában Vercel-en:** A serverless function-ök között nincs megosztott memória. A retry token-t a briefData-ból kell újra generálni, vagy az URL-ben kell kódolni a briefData-t.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Xlsx generálás | Saját XML builder | ExcelJS | Az xlsx formátum ~20 xml fájl egy zip-ben — rengeteg edge case |
| Email küldés | Raw SMTP | @sendgrid/mail | Deliverability, SPF/DKIM, retry logic beépítve |
| Base64 kódolás | Manuális buffer kezelés | `Buffer.from(x).toString('base64')` | Node.js natív, nincs npm dependency |
| UUID generálás | Manuális random string | `crypto.randomUUID()` | Kriptográfiailag biztonságos, Node.js natív |

**Key insight:** Az xlsx template fill a projekt legbonyolultabb része — minden egyéb (email, retry) standard pattern.

## Common Pitfalls

### Pitfall 1: Vercel nem találja a template fájlokat
**What goes wrong:** A `docs/ROI_Mediaplan/*.xlsx` fájlok nem kerülnek be a Vercel deployment-be, mert a Node File Trace nem ismeri fel az `fs.readFileSync` hívásban a dinamikus path-t.
**Why it happens:** Vercel statikus analízissel dönti el, milyen fájlokat bundleljen. Ha a path dinamikus (változóból jön), nem veszi bele.
**How to avoid:** `next.config.ts`-ben explicit `outputFileTracingIncludes` konfiguráció:
```typescript
const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/approve': ['./docs/ROI_Mediaplan/**/*'],
    '/api/retry/*': ['./docs/ROI_Mediaplan/**/*'],
  },
};
```
**Warning signs:** Lokálisan működik, Vercel-en ENOENT error.

### Pitfall 2: ExcelJS merged cell copy veszteség
**What goes wrong:** A `worksheet.model` copy nem viszi át a merged cell-eket.
**Why it happens:** Az ExcelJS `model` property-ben a merge-ök a `merges` key-en vannak, de a `model` assign nem mappeli automatikusan a `mergeCells` property-re.
**How to avoid:** Explicit `mergeCells` hozzáadás: `Object.assign({}, source.model, { mergeCells: source.model.merges })`.
**Warning signs:** A combined xlsx-ben a cellák nincsenek összevonva.

### Pitfall 3: Checkbox (boolean) cellák kezelése
**What goes wrong:** A template boolean (`false`) celláit nem tudjuk `true`-ra állítani, mert nem ismerjük az Excel checkbox control binding-ot.
**Why it happens:** Az ExcelJS nem támogatja az Excel form control checkbox-okat — a `false`/`true` értékek a cellában vannak, de a vizuális checkbox egy overlay.
**How to avoid:** Egyszerűen felülírjuk a boolean cellák értékét `true`-ra ahol szükséges. A checkbox vizuálisan frissül, mert a linked cell értéke változott.
**Warning signs:** A checkbox vizuálisan nem frissül (de az adat helyes).

### Pitfall 4: Dinamikus PPC Channel Mix — sormennyiség eltérés
**What goes wrong:** Az AI több vagy kevesebb channel row-t generál, mint amennyi hely van a template-ben.
**Why it happens:** A template-ek fix számú placeholder sort tartalmaznak (pl. PPC Traffic: 3 sor), de az AI 2-8 sort is generálhat.
**How to avoid:** Stratégia:
1. Ha kevesebb sor kell: a felesleges sorok celláit ürítjük (de a sor megmarad a formázással)
2. Ha több sor kell: a template-et előre több placeholder sorral készítjük el, VAGY az `insertRows` metódust használjuk — de ÓVATOSAN, mert ez elronthatja a képleteket
3. **Javasolt megoldás:** Maximum sort definiálni (pl. 10) és ennyi üres sort tartani a template-ekben. Az AI output-ot limitálni ennyi channel-re.
**Warning signs:** Az xlsx-ben hiányzó sorok vagy elcsúszott formázás.

### Pitfall 5: Vercel serverless retry — in-memory state elvész
**What goes wrong:** A retry token memóriában van, de a serverless function újraindul → a token elvész.
**Why it happens:** Vercel serverless = stateless, nincs megosztott memória.
**How to avoid:** A retry megoldás NE tároljon state-et. Opciók:
1. **Signed URL:** A briefData-t JWT-ben kódolni az URL-be (ha elég rövid)
2. **Re-submit pattern:** A retry link a frontend-re mutat, ami újra POST-olja a briefData-t az approve endpoint-ra
3. **briefData hash token:** A token = a briefData hash-je, és az approve route cache-eli a briefData-t a /tmp könyvtárba (de ez sem garantáltan persist)
**Javasolt megoldás:** A retry link a frontend-re mutat egy `retry?briefId=...` route-ra, ahol a briefData a kliens localStorage-ból jön. Ez megkerüli a serverless state problémát.
**Warning signs:** Retry link 404 vagy "invalid token" hiba.

### Pitfall 6: SendGrid feladó verifikáció
**What goes wrong:** SendGrid 403 Forbidden — "The from address does not match a verified Sender Identity."
**Why it happens:** Az `info@valueonboard.com` feladó nincs verifikálva a SendGrid fiókban.
**How to avoid:** Deployment ELŐTT elvégezni a Single Sender Verification-t vagy Domain Authentication-t a SendGrid dashboard-on.
**Warning signs:** Lokálisan nem tesztelhető a valódi küldés — csak staging/production-ben derül ki.

## Code Examples

### Agency Brief Template Mapping
```typescript
// Cella mapping a template inspekciója alapján (Row → Cell → BriefData field)
// Template: "ROIworks _ TEMPLATE_ Agency campaign brief.xlsx" — Sheet1
function fillAgencyBrief(ws: ExcelJS.Worksheet, brief: BriefData): void {
  // Alapvető információk
  ws.getCell('B7').value = brief.company_name;
  ws.getCell('B9').value = brief.contact_name || '';
  // B11:C11 = Email, D11:E11 = Tel. — ezek nincs a BriefData-ban
  ws.getCell('B13').value = brief.industry || '';
  ws.getCell('B15').value = brief.brand_positioning || '';

  // Kampány részletek
  ws.getCell('B19').value = brief.campaign_name || '';
  ws.getCell('B21').value = brief.campaign_goal || '';  // Kampány típusa sor
  ws.getCell('B23').value = brief.main_message || '';

  // Kampány kreatívok — checkbox cellák (C25-C26, E25-E26)
  // C25 = "Ügyfél biztosítja" checkbox, C26 = "ROIworks készíti" checkbox
  // E25 = "Statikus kreatívok", E26 = "Videós kreatívok"
  if (brief.creative_source) {
    ws.getCell('C25').value = brief.creative_source.includes('client');
    ws.getCell('C26').value = brief.creative_source.includes('agency');
  }

  // Kommunikációs stílus
  ws.getCell('B28').value = brief.communication_style || '';

  // Online hirdetési csatornák — checkbox cellák (C30-C33, E30-E33)
  const channels = brief.ad_channels || [];
  ws.getCell('C30').value = channels.includes('Facebook ads');
  ws.getCell('E30').value = channels.includes('Instagram ads');
  ws.getCell('C31').value = channels.includes('Google GDN');
  ws.getCell('E31').value = channels.includes('Google Search');
  ws.getCell('C32').value = channels.includes('Tiktok ads');
  ws.getCell('E32').value = channels.includes('Microsoft ads');
  ws.getCell('C33').value = channels.includes('YouTube ads');
  // E33 = Egyéb — ha van más csatorna

  // Kampány célja
  ws.getCell('B37').value = brief.campaign_goal || '';

  // KPI-k — checkbox cellák (C39-C42, E39)
  const kpis = brief.kpis || [];
  ws.getCell('C39').value = kpis.includes('Elérés');
  ws.getCell('E39').value = kpis.includes('Website event');
  ws.getCell('C40').value = kpis.includes('Megjelenés');
  ws.getCell('E40').value = kpis.includes('Social aktivitás');
  ws.getCell('C41').value = kpis.includes('Link kattintás');

  // Célcsoport
  const genders = brief.gender || [];
  ws.getCell('C46').value = genders.includes('Nő') || genders.includes('nő');
  ws.getCell('E46').value = genders.includes('Férfi') || genders.includes('férfi');
  ws.getCell('C47').value = brief.location || '';  // Merged C47:E47
  ws.getCell('C48').value = brief.age_range || '';  // Merged C48:E48

  ws.getCell('B50').value = brief.psychographics || '';
  ws.getCell('B52').value = brief.persona || '';

  // Időzítés
  ws.getCell('B56').value = brief.start_date || '';
  ws.getCell('B58').value = brief.end_date || '';
  ws.getCell('B60').value = brief.key_events || '';
}
```

### PPC Traffic Mediaplan Mapping
```typescript
// Template: "ROIworks _ TEMPLATE_ Mediaplan PPC only, Traffic only 2026.xlsx"
// Header: R3-R5 (Campaign, Duration, Budget, Department, Goal, Contact)
// PPC Channel Mix: R9 headers, R10 metric labels, R11+ data rows
// Metrics: Impr | CTR | Clicks | CPC | Total cost (HUF) | TOTAL cost (HUF)
// Targeting: R17+ header, R19+ data
function fillMediaplanTraffic(ws: ExcelJS.Worksheet, research: ResearchResults, brief: BriefData): void {
  // Header kitöltés
  ws.getCell('E3').value = research.campaign_name;
  ws.getCell('E4').value = research.campaign_period;
  ws.getCell('E5').value = research.summary.total_budget_huf;
  ws.getCell('J3').value = brief.company_name;
  ws.getCell('J4').value = research.campaign_goal;
  ws.getCell('J5').value = brief.contact_name || '';

  // PPC Channel Mix sorok — R11-től
  const DATA_START_ROW = 11;
  research.channels.forEach((ch, i) => {
    const row = DATA_START_ROW + i;
    ws.getCell(`A${row}`).value = ch.campaign_target;
    ws.getCell(`B${row}`).value = ch.campaign_type;
    ws.getCell(`C${row}`).value = ch.ad_network;
    ws.getCell(`D${row}`).value = ch.ad_type;
    ws.getCell(`E${row}`).value = research.campaign_period;
    // Traffic metrikák: Min | Likely | Max (3 oszlop a "Metrics" alatt)
    // A template-ben Impr, CTR, Clicks → F, G, H oszlopok
    ws.getCell(`F${row}`).value = ch.impressions?.likely;
    ws.getCell(`G${row}`).value = ch.ctr?.likely;
    ws.getCell(`H${row}`).value = ch.clicks?.likely;
    ws.getCell(`I${row}`).value = ch.cpc?.likely;
    ws.getCell(`J${row}`).value = ch.budget_allocation_huf;
    ws.getCell(`K${row}`).value = ch.budget_allocation_huf; // TOTAL
  });

  // Targeting sorok — R19-től
  const TARGETING_START = 19;
  research.targeting.forEach((t, i) => {
    const row = TARGETING_START + i;
    ws.getCell(`A${row}`).value = t.ad_network;
    ws.getCell(`B${row}`).value = t.age;
    ws.getCell(`C${row}`).value = t.gender;
    ws.getCell(`D${row}`).value = t.location;
    ws.getCell(`E${row}`).value = t.interest;
  });
}
```

### KPI Min | Likely | Max Pattern
```typescript
// A decision szerint mind a 3 érték megjelenik külön oszlopokban.
// A template-ekben jelenleg 1 oszlop van metrikiánként.
// FONTOS: A template-eket MÓDOSÍTANI kell, hogy 3 oszlop legyen (Min|Likely|Max).
// VAGY: Csak a "likely" értéket írjuk be (egyszerűbb, a template nem változik).
//
// Javasolt kompromisszum: A Mediaplan template-eket frissíteni kell —
// oszlopot bővíteni Min|Likely|Max-ra. Ez template szerkesztés, nem kód.
// Alternatív: A "likely" érték megy a fő oszlopba, Min és Max egy megjegyzésbe.
```

### Email küldés — Sikeres
```typescript
// Source: @sendgrid/mail docs + project conventions
import sgMail from '@sendgrid/mail';

export async function sendPmEmail(
  briefData: BriefData,
  research: ResearchResults,
  xlsxBuffer: Buffer,
): Promise<void> {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

  const companyName = briefData.company_name;
  const campaignName = briefData.campaign_name || `${companyName} kampány`;

  const body = [
    `Új brief érkezett: ${companyName}`,
    `Kampány: ${campaignName}`,
    `Cél: ${briefData.campaign_goal}`,
    `Büdzsé: ${briefData.budget_range || 'nem megadott'}`,
    `Időszak: ${briefData.start_date || '?'} – ${briefData.end_date || '?'}`,
    '',
    'Források:',
    ...research.sources.map(url => `- ${url}`),
    '',
    'A kitöltött Agency Brief és Mediaplan xlsx csatolva.',
  ].join('\n');

  await sgMail.send({
    to: process.env.PM_EMAIL!,
    cc: process.env.PM_CC_EMAILS?.split(',').map(e => e.trim()).filter(Boolean),
    from: 'info@valueonboard.com',
    subject: `Új brief: ${companyName} — ${campaignName}`,
    text: body,
    attachments: [{
      content: xlsxBuffer.toString('base64'),
      filename: `${companyName}-brief-mediaplan.xlsx`,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment',
    }],
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| xlsx-populate (style preservation) | ExcelJS (aktívan karbantartott) | xlsx-populate utolsó release: 2020 | ExcelJS biztonságosabb választás |
| SheetJS ingyenes + xlsx-style fork | ExcelJS vagy SheetJS Pro | Régóta | Az ingyenes SheetJS nem tartja meg a stílusokat |
| Template generálás nulláról | Template fill (read → modify → write) | Best practice | Formázás megőrzés a fő előny |

**Deprecated/outdated:**
- xlsx-populate: 2020 óta nincs karbantartva, npm audit vulnerability-k lehetségesek
- xlsx-style: Fork, nem aktív, nem ajánlott production-ben

## Template Structure — Inspekciós eredmények

### Agency Brief Template
- **Fájl:** `ROIworks _ TEMPLATE_ Agency campaign brief.xlsx`
- **Sheet:** Sheet1 (79 sor, 5 oszlop)
- **38 merged cell** — szekció headerek és value mezők
- **Checkbox cellák:** Boolean (`false`) — R25-R26 (kreatívok), R30-R33 (csatornák), R39-R42 (KPI-k), R46 (nem)
- **Szekciók:** Alapvető információk (R5-R15), Kampány részletek (R17-R33), Kampány célja (R35-R42), Célcsoport (R44-R52), Időzítés (R54-R60)
- **Nincs képlet** — minden cella statikus

### Mediaplan PPC Traffic Template
- **Fájl:** `ROIworks _ TEMPLATE_ Mediaplan PPC only, Traffic only 2026.xlsx`
- **Sheet:** Sheet1 (969 sor, 26 oszlop — de adatok csak R1-R21)
- **25 merged cell**
- **Header:** R3-R5 (Campaign, Duration, Budget, Department, Goal, Contact)
- **PPC Channel Mix:** R9-R10 headerek, R11-R13 adatsorok (3 sor), R14 SUM formulák
- **Metrikák:** Impr (F) | CTR (G) | Clicks (H) | CPC (I) | Total cost (J) | TOTAL cost (K)
- **Targeting:** R16 header, R18-R19 headerek, R19-R20 adatsorok (2 sor)
- **Képletek:** R14: SUM(F11:F13), SUM(H11:H13), SUM(J11:J13)

### Mediaplan PPC Reach Template
- **Fájl:** `ROIworks _ TEMPLATE_ Mediaplan PPC only, Reach only 2026.xlsx`
- **Sheet:** Sheet1 (21 sor, 11 oszlop)
- **23 merged cell**
- **Header:** Ugyanaz mint Traffic
- **PPC Channel Mix:** R11-R14 adatsorok (4 sor), R15 SUM formulák
- **Metrikák:** Impr/View (F) | Freq (G) | Reach (H) | CPM/CPV (I) | Total cost (J)
- **Targeting:** R17-R21

### Mediaplan PPC Mixed Template
- **Fájl:** `ROIworks _ TEMPLATE_ Mediaplan PPC only, Traffic & Reach 2026.xlsx`
- **Sheet:** Sheet1 (31 sor, 26 oszlop)
- **31 merged cell**
- **KÉT BLOKK:** Reach (R9-R15) + Traffic (R18-R23)
- **Reach metrikák:** Impr/View | Freq | Reach | CPM/CPV | Total cost
- **Traffic metrikák:** Impr | CTR | Clicks | CPC | Total cost | TOTAL cost
- **Targeting:** R27-R31

### Mediaplan All Channels Template
- **Fájl:** `ROIworks _ TEMPLATE_ Mediaplan all channels.xlsx`
- **Sheetek:** Media_plan + Munkalap4
- **Media_plan:** 982 sor, 26 oszlop, 43 merged cell
- **Szekciók:** PPC Marketing (R11-R20), eDM (R22-R26), Egyéb média (R28-R32), Gyártás (R34-R39), Ügynökségi díj (R41-R43), Teljes budget (R45)
- **Metrikák:** Megjelenés | Kattintás | Conversion/Lead | CPM/CPC/CPT | Teljes ár
- **Munkalap4:** Másik kampány variáns (CAMPAIGN OFFER) — ezt Phase 6-ban nem töltjük ki

## Open Questions

1. **Min | Likely | Max oszlopok a template-ekben**
   - What we know: A decision szerint mind a 3 KPI érték megjelenik külön oszlopokban, de a jelenlegi template-ek csak 1 oszlopot tartalmaznak metrikánként
   - What's unclear: Módosítani kell-e a template-eket (új oszlopok hozzáadása), vagy elegendő csak a "likely" értéket beírni?
   - Recommendation: A template-ek módosítása (oszlopbővítés) a planner feladat legyen — egy sub-task, ami a template xlsx-eket frissíti. Ha ez túl bonyolult, fallback: csak a likely érték kerül be.

2. **Retry link — serverless state probléma**
   - What we know: Vercel serverless = stateless, in-memory token store nem működik. A /tmp könyvtár sem persist-ens.
   - What's unclear: Mi a legjobb retry pattern serverless environment-ben adatbázis nélkül?
   - Recommendation: A retry link a frontend-re mutat, a frontend localStorage-ból újra POST-olja a briefData-t. Ez a legegyszerűbb, nem igényel server-side state-et. Alternatíva: a briefData-t base64-kódolva az URL query param-ban — de méretkorlát lehet.

3. **Dinamikus sormennyiség a Mediaplan-ben**
   - What we know: A PPC Traffic template 3 channel sort tartalmaz, a Reach 4-et, de az AI akárhányat generálhat.
   - What's unclear: Mi történik, ha több sort kell beírni mint amennyi hely van?
   - Recommendation: A template-eket előre bővíteni max. 8-10 placeholder sorral. A felesleges sorok üresek maradnak. Ha az AI ennél többet generál, a channel listát trimmelni az utolsó N-re. A SUM formulákat is frissíteni kell a bővített tartományra.

4. **Feladó email verifikáció**
   - What we know: Az `info@valueonboard.com` címet verifikálni kell a SendGrid-ben
   - What's unclear: Van-e már Domain Authentication beállítva a valueonboard.com domainre?
   - Recommendation: A tervezés során deployment checklist-be felvenni. Fallback: az `.env.example`-ben lévő `SENDGRID_FROM_EMAIL` env-ből olvasni, ami már verifikált.

5. **ExcelJS worksheet model copy megbízhatósága**
   - What we know: A `worksheet.model` copy + `mergeCells: source.model.merges` pattern működik az ExcelJS community szerint
   - What's unclear: Megőrzi-e a conditional formatting-ot, print area-t, és egyéb advanced feature-öket?
   - Recommendation: A combined workbook approach-ot tesztelni kell a konkrét template-ekkel. Fallback: 2 külön xlsx mellékletként küldeni (a decision 1 kombinált xlsx-et mond, de ez fallback).

## Sources

### Primary (HIGH confidence)
- ExcelJS npm package — v4.4.0 (2023-10-19), 3.7M+ weekly downloads — verzió, API, képességek ellenőrizve
- ExcelJS GitHub README — `readFile`, `writeBuffer`, `getCell`, `insertRow`, `model` copy pattern
- @sendgrid/mail v8.1.6 — attachment API (content, filename, type, disposition)
- Vercel Knowledge Base: "How can I use files in Vercel Functions?" — `process.cwd()`, `outputFileTracingIncludes`
- Projekt xlsx template-ek — közvetlenül ExcelJS-sel inspektálva (cellaértékek, merged cells, képletek)

### Secondary (MEDIUM confidence)
- ExcelJS GitHub Issue #591 — worksheet model copy with merged cells workaround
- ExcelJS GitHub Discussion #1707 — combine workbooks pattern (JSON.parse/stringify)
- ExcelJS PR #1324 — insertRow/insertRows style inherit parameter ('i', 'o', 'n')
- SendGrid docs/use-cases/attachments.md — attachment structure

### Tertiary (LOW confidence)
- Retry pattern Vercel serverless-ben — nincs egyértelmű best practice adatbázis nélkül, a localStorage-alapú frontend retry a legegyszerűbb de nem ideális

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — ExcelJS az egyértelmű választás, npm stats és aktív karbantartás alátámasztja
- Architecture: HIGH — Template fill pattern jól dokumentált, SendGrid attachment API egyszerű
- Pitfalls: HIGH — Template struktúrák közvetlenül inspektálva, Vercel file handling dokumentált
- Combined workbook: MEDIUM — Community pattern, de nem hivatalos API, tesztelés szükséges
- Retry mechanism: LOW — Serverless state management nincs egyszerű megoldás DB nélkül

**Research date:** 2026-02-12
**Valid until:** 2026-03-14 (stabil domain, lassan változó library-k)
