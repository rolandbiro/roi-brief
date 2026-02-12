# Technology Stack

**Project:** ROI Brief v2 - Extended Data Collection, AI Research Pipeline, XLSX Generation
**Researched:** 2026-02-12
**Scope:** Stack kiegeszitesek a meglevo Next.js apphoz: xlsx generalas, AI kutatas, email csatolmanyok

## Meglevo Stack (NEM kutatott ujra)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.1 | App framework |
| React | 19.2.3 | UI |
| TypeScript | ^5 | Type safety |
| @anthropic-ai/sdk | ^0.74.0 | Claude API |
| @react-pdf/renderer | ^4.3.2 | PDF generalas |
| @sendgrid/mail | ^8.1.6 | Email kuldes |
| Tailwind CSS | v4 | Styling |
| Zod | ^4.3.6 | Schema validacio |

## Ajanlott Kiegeszitesek

### 1. ExcelJS - XLSX Generalas Sablonbol

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| exceljs | ^4.4.0 | XLSX fajlok generalasa meglevo sablonokbol (Agency Brief + Mediaplan) | A legjobb Node.js konyvtar meglevo xlsx fajlok betoltesere, cellak modositasara es bufferbe irasra. Megorizti a formatazast, stilusokat, temakat. Tamogatja a `workbook.xlsx.load(buffer)` es `workbook.xlsx.writeBuffer()` muveleteket -- teljesen buffer-alapu, nincs fajlrendszer-fuggoseg, igy Vercel serverless-ben problemamentesen mukodik. |

**Confidence:** HIGH - Verified via [npm registry](https://www.npmjs.com/package/exceljs) (v4.4.0), [GitHub repo](https://github.com/exceljs/exceljs), es tobb osszehasonlito forras.

**Miert ExcelJS es NEM mas:**

| Alternativa | Miert nem |
|-------------|-----------|
| SheetJS (xlsx) | A Community Edition nem tamogatja a stilusok megorzeset irasnalÍ - csak adat-szintu muveletekre jo. A Pro verzio fizetős. Biztonsagi sebezhetosegek is felmerultek. |
| xlsx-populate | Jo template-kezeleshez, DE 2020 ota nincs frissitve (v1.21.0). Karbantartasi kockazat. |
| xlsx-template | Placeholder-alapu (`{{field}}`) megkozelites -- kenyelmesebb egyszeru behelyettesitesekhez, de korlátozott: nem tamogat feltételes cellákat, szinezest, komplex logikát. A Mediaplan sheet komplex cellalogikát igényel. |

**Sablonbol generalas mintaja:**

```typescript
import ExcelJS from "exceljs";

async function generateXlsx(templateBuffer: Buffer, data: BriefData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  const sheet = workbook.getWorksheet("Brief");
  sheet.getCell("B3").value = data.company_name;
  sheet.getCell("B5").value = data.campaign_goal;
  // ... tovabbi cellak kitoltese

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
```

**Merete es Vercel kompatibilitas:**
- Csomag merete: ~1.08 MB (unzipped). A Vercel serverless limit 250 MB unzipped -- bovem belfer.
- FONTOS: Node.js runtime-ot hasznal (nem Edge Runtime). A jelenlegi app route-jai mar Node.js runtime-on futnak (`send-brief` PDF generalaassal), tehat nincs valtozas.
- A `load(buffer)` / `writeBuffer()` metodusok nem hasznalnak `fs`-t, teljesen memoria-alapuak.

**Sablon tarolasa:**
A `.xlsx` sablonfajlok a `public/templates/` vagy `lib/templates/` mappaban tarolhatok. Vercel serverless-ben `fs.readFileSync` hasznalhato a sablon betoltesehez build-time-ban, VAGY a sablon importalhato mint asset. Az egyszerubb megoldas: `public/templates/agency-brief.xlsx` es `public/templates/mediaplan.xlsx` -- a serverless function fetch-eli oket.

**Telepites:**
```bash
npm install exceljs
```

---

### 2. Anthropic Web Search Tool - AI Kutatas Pipeline

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Anthropic Web Search Tool | `web_search_20250305` | AI-alapu hatterkulatas: versenytars-elemzes, celzasi javaslatok, KPI benchmarkok, csatorna-mix | Beepitett Anthropic API tool -- nincs kulon konyvtar. A `@anthropic-ai/sdk` ^0.74.0 mar tamogatja. Claude maga donti el mikor keressen, automatikus citalassal. $10/1000 kereses + token koltseg. |

**Confidence:** HIGH - Verified via [Anthropic Web Search Tool documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) (teljes API doc elolvasva).

**NINCS uj fugosseg.** A web search egy server-side tool a meglevo `@anthropic-ai/sdk`-n belul. A konfiguracio:

```typescript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  messages: researchMessages,
  tools: [{
    type: "web_search_20250305",
    name: "web_search",
    max_uses: 10,
    user_location: {
      type: "approximate",
      country: "HU",
      city: "Budapest",
      timezone: "Europe/Budapest",
    },
  }],
});
```

**Tamogatott modellek:**
- Claude Opus 4.6, Opus 4.5, Opus 4.1, Opus 4
- Claude Sonnet 4.5, Sonnet 4
- Claude Haiku 4.5

**Fontos API reszletek:**
- **Tool type:** `"web_search_20250305"` (fix string, nem verziofuggo az SDK-tol)
- **`max_uses`:** Korlatozza a keresek szamat egy keresen belul. A kutatas pipeline-hoz 10-15 javasolt.
- **`allowed_domains` / `blocked_domains`:** Opcionalis domain-szures. Hasznos ha megbizhato marketing-forrasokra akarunk szukiteni.
- **`user_location`:** Lokalizalt talalatok Magyarorszagra -- fontos a magyar piaci adatokhoz.
- **Valasz:** `server_tool_use` block-ok a streamben. A `web_search_tool_result` tartalmazza az `encrypted_content`-et amit multi-turn-ben vissza kell kuldeni.
- **`pause_turn` stop reason:** Hosszu kutatas eseten az API szuneteltetheti a turn-t. A valaszt valtozatlanul vissza kell kuldeni a kovetkezo keresben.
- **Streaming:** Tamogatott. A kereses kozben szunet van a streamben amig a talalatok megjonnek.
- **Prompt caching:** Mukodik web search-csel egyutt. `cache_control` breakpoint a `web_search_tool_result` blokk utan.
- **Arazas:** $10 / 1000 kereses + standard token koltseg a talalatok feldolgozasaert (input tokenek).

**Integracio a meglevo agentic loop-pal:**
A jelenlegi `chat/route.ts` mar kezeli a tool use loop-ot (stream -> tool detection -> server-side execution -> continuation). A web search tool AZONBAN `server_tool_use` tipusu (nem sima `tool_use`), mert az API maga hajtja vegre. Ez azt jelenti:
1. NEM kell kliens-oldali tool execution
2. A `server_tool_use` es `web_search_tool_result` blokkok automatikusan megjelennek a streamben
3. A loop logika MARAD, de a web search tool-t NEM kell kulon kezelni -- az API maga valaszol ra

**Kulonvalasztott kutatas endpoint:**
A web search NEM a chat endpoint-ba kerul. Kulon `/api/research` route, ami:
- Megkapja a veglegesitett brief adatokat
- Nem streamed a kliensnek (vagy korlátozott progress-t streamel)
- Egyetlen research prompt + web search tool = teljes kutatas
- Visszaadja a strukturalt kutatas eredmenyt

---

### 3. SendGrid Email Csatolmanyokkal - Meglevo Pattern Bovitese

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @sendgrid/mail | ^8.1.6 (meglevo) | XLSX fajlok csatolasa az emailhez | Mar hasznalatban a projektben PDF csatolashoz. UGYANAZ a pattern, csak mas MIME type es tartalom. Nulla uj fugosseg. |

**Confidence:** HIGH - Verified via [SendGrid Node.js attachment docs](https://github.com/sendgrid/sendgrid-nodejs/blob/main/docs/use-cases/attachments.md) es a meglevo `send-brief/route.tsx` implementacio.

**A meglevo pattern mar tamogatja:**
A jelenlegi `send-brief/route.tsx` PONT igy csatol PDF-et:

```typescript
attachments: [{
  content: pdfBase64,           // Buffer -> base64
  filename,                     // "brief-company.pdf"
  type: "application/pdf",      // MIME type
  disposition: "attachment" as const,
}],
```

Az XLSX csatolashoz SEMMI ujat nem kell telepiteni. Csak kiegeszitjuk:

```typescript
attachments: [
  {
    content: pdfBase64,
    filename: `brief-${slug}.pdf`,
    type: "application/pdf",
    disposition: "attachment" as const,
  },
  {
    content: xlsxBase64,  // ExcelJS writeBuffer() -> Buffer.toString("base64")
    filename: `agency-brief-${slug}.xlsx`,
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    disposition: "attachment" as const,
  },
  {
    content: mediaplanBase64,
    filename: `mediaplan-${slug}.xlsx`,
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    disposition: "attachment" as const,
  },
],
```

**MIME type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` az `.xlsx` fajlokhoz.

**Meretkorlat:** SendGrid max 30 MB csatolmany-meret. Egy kitoltott Excel sablon tipikusan 50-200 KB -- nem jelent problemat.

---

## Amit NEM Kell Hozzaadni

| Technology | Miert nem |
|------------|-----------|
| Puppeteer / Playwright | Nehanyan server-side web scraping-hez hasznaljak kutatasi pipeline-okban. FELESLEGES: az Anthropic Web Search Tool ezt megoldja API szinten, nincs szukseg sajat scraper-re. Raadasul Puppeteer ~400 MB + Chromium -- Vercel-en nem fer el. |
| SerpAPI / Google Custom Search | Kulon kereso API-k. FELESLEGES: az Anthropic Web Search Tool beepitett es jobb, mert Claude maga dolgozza fel az eredmenyeket context-ben. |
| LangChain / LangGraph | Tulzas egy egyszeru research pipeline-hoz. Egyetlen Claude hivas web search tool-lal megoldja. |
| xlsx-populate | Utolso release 2020. Karbantartatlan. ExcelJS aktivan karbantartott es jobb API-val rendelkezik. |
| xlsx / SheetJS Community | Nem oriez meg stilusokat. Biztonsagi aggalyok. |
| Komplex queue rendszer (BullMQ, stb.) | A kutatas pipeline egyetlen Claude hivas, nem kell job queue. Ha timeout lenne (Vercel 60s limit), egyszerubb megoldas: a kutataast tobb kisebb hivasra bontani. |
| Database (Prisma, stb.) | A kutatas eredmenyet az xlsx-be es emailbe olvasztjuk. Nincs szukseg perzisztenciara. |

## Osszefoglalo

### Telepites

```bash
# Egyetlen uj fugosseg
npm install exceljs
```

### Teljes v2 Stack

| Kategoria | Technology | Version | Uj? | Purpose |
|-----------|-----------|---------|-----|---------|
| **XLSX generalas** | exceljs | ^4.4.0 | UJ | Sablon betoltese, cellak kitoltese, buffer generalas |
| **AI kutatas** | Anthropic Web Search Tool | `web_search_20250305` | UJ (config) | Hatterkulatas: versenytarsak, celzas, KPI-k |
| **Email csatolmany** | @sendgrid/mail | ^8.1.6 | MEGLEVO | XLSX fajlok csatolasa base64 encoding-gal |
| **AI API** | @anthropic-ai/sdk | ^0.74.0 | MEGLEVO | Web search tool tamogatas mar benne van |
| **Schema** | zod | ^4.3.6 | MEGLEVO | Kutatas eredmeny validalasa |
| **Framework** | Next.js | 16.1.1 | MEGLEVO | API routes a kutatas es xlsx endpoint-okhoz |

### Fo Elv: Egyetlen Uj Fugosseg

A harom uj kepesseg (xlsx, AI kutatas, email csatolmany) kozul **csak az xlsx generalas igenyel uj npm package-et** (exceljs). A tobbi a meglevo stack kibovitesevel valosithato meg:
- AI kutatas = meglevo `@anthropic-ai/sdk` + web search tool konfiguracio
- Email csatolmany = meglevo `@sendgrid/mail` + XLSX MIME type

Ez kozvetlen kovetkezmenye a KISS elvnek: ne adj hozza amit nem kell.

## Forrasok

- [ExcelJS npm](https://www.npmjs.com/package/exceljs) - v4.4.0
- [ExcelJS GitHub](https://github.com/exceljs/exceljs) - Template loading, buffer I/O
- [Anthropic Web Search Tool docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) - Teljes API referencia
- [Anthropic Web Search API announcement](https://www.anthropic.com/news/web-search-api) - Arazas, tamogatott modellek
- [SendGrid Node.js attachments](https://github.com/sendgrid/sendgrid-nodejs/blob/main/docs/use-cases/attachments.md) - Csatolmany pattern
- [Vercel Serverless Function limits](https://vercel.com/docs/functions/limitations) - 250 MB unzipped limit, 60s timeout
- [npm-compare: ExcelJS vs xlsx vs xlsx-populate](https://npm-compare.com/excel4node,exceljs,node-xlsx,xlsx,xlsx-populate) - Konyvtar osszehasonlitas
- [ExcelJS Bundlephobia](https://bundlephobia.com/package/exceljs) - ~1.08 MB csomag meret
