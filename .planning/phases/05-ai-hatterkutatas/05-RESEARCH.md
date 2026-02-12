# Phase 5: AI háttérkutatás - Research

**Researched:** 2026-02-12
**Domain:** Anthropic Claude API (web_search + structured outputs), Next.js background processing
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Kampánycél alapú szűrés: először a brief-ben megadott kampánycél határozza meg a releváns csatornákat, utána a büdzsé szűri a megvalósíthatóságot
- Nincs fix csatornaszám korlát — az AI a brief alapján dönti el, hány csatorna releváns
- Szabad csatorna javaslat — az AI bármit javasolhat ami releváns (nem csak Google/Meta/TikTok), kivéve ha az xlsx template-ek fixálják a csatorna listát (a researcher ellenőrizze)
- A brief-ben megadott célpiac(ok) határozzák meg a lokalizációt — magyar kampányhoz magyar piaci adatok, multi-country esetén az adott piac(ok) specifikus adatai
- Több ország esetén Claude dönt: kevés ország → országonként külön targeting, sok ország → regionális összevonás
- Tartomány + ajánlott érték: min-max tartomány és egy kiemelt "valószínű" érték
- Kampánycéltól függő metrikák: Awareness kampánynak Reach/Frequency, Conversion kampánynak CPA/ROAS — adaptív metrika készlet, nem fix lista
- Csatornánkénti részletezés + kampány szintű összegzés — mindkét szinten

### Claude's Discretion
- Büdzsé elosztás formátuma (százalék, Ft, vagy mindkettő)
- Targeting részletesség (téma szintű vs konkrét szegmens nevek — brief alapján)
- Platformonkénti vs összevont targeting struktúra
- Konzervatív vs reális becslés megközelítés
- Web search típusok (benchmark, versenytárs, trend — brief alapján)
- Web search hívások száma (költség/minőség egyensúly)
- Forrás hivatkozások szükségessége
- Hiányzó adatok kezelése (becslés jelzéssel vs üresen hagyás)

### Deferred Ideas (OUT OF SCOPE)
None — a megbeszélés a fázis scope-ján belül maradt

</user_constraints>

## Summary

A Phase 5 lényege: a jóváhagyott brief adatok alapján háttérben (fire-and-forget) egy AI kutatási pipeline fut le, ami csatorna mix javaslatot, targeting ajánlásokat és KPI becsléseket generál strukturált formátumban. Az eredmény közvetlenül mappelhető az xlsx mediaplan template mezőire.

A technikai megvalósítás három fő pillérre épül:
1. **Next.js `after()` API** — a jóváhagyás után a háttérben indul a pipeline, az ügyfélnek azonnal válaszolunk
2. **Anthropic `web_search_20250305` server tool** — valós idejű piaci adatok, benchmark-ok, versenytárs kutatás
3. **Két lépéses Claude pipeline** — először web search-ös kutatás, aztán structured output-os formázás (mert web_search citations és `output_config.format` incompatible)

**KRITIKUS MEGÁLLAPÍTÁS:** A web_search tool mindig bekapcsolja a citations-t, ami inkompatibilis a structured outputs (`output_config.format`) feature-rel. Ezért a pipeline-nak KÉT lépésben kell működnie:
- **Step 1 (Research):** Claude + web_search → szabad szöveges kutatási eredmények
- **Step 2 (Structure):** Claude + `output_config: { format: { type: "json_schema" } }` → a kutatás eredményeinek strukturált JSON-ná alakítása

**Primary recommendation:** Két lépéses (search → structure) pipeline, `after()` callback-ben, `pause_turn` kezeléssel, Vercel timeout-ok figyelembevételével.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | ^0.74.0 | Claude API client (web_search + structured outputs) | Már a projektben van, támogatja a `web_search_20250305`-öt és a structured outputs-ot |
| `next/server` (`after`) | 16.1.1 | Fire-and-forget háttérfeldolgozás | Már használva az approve route-ban, Next.js natív megoldás |
| `zod` | ^4.3.6 | ResearchResults schema definíció | Már a projektben van, az SDK `zodOutputFormat` helper-rel együtt használható structured outputs-hoz |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@anthropic-ai/sdk/helpers/zod` | built-in | Zod schema → JSON Schema konverzió structured outputs-hoz | A Step 2-ben a ResearchResults Zod schema-ból automatikusan generálja az `output_config.format` schema-t |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Két lépéses pipeline | Egy lépéses (web_search + prompt-based JSON) | Nem garantált a JSON formátum, structured outputs nélkül parsing hibák lehetségesek |
| `output_config.format` (structured outputs) | Tool use mint "fake" output extraction | A structured outputs constrained decoding-ot használ — 100% garancia a schema megfelelésre |
| `after()` | Külső queue (Redis/SQS) | Túlzás erre a use case-re, `after()` pont erre van |

**Installation:**
```bash
# Nincs új dependency — minden már installálva van
# Az SDK 0.74.0 támogatja a web_search_20250305-öt és a structured outputs-ot
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── research/
│   ├── pipeline.ts          # runResearchPipeline() — a fő orchestrator
│   ├── search.ts            # Step 1: web search kutatás
│   ├── structure.ts         # Step 2: structured output formázás
│   ├── prompts.ts           # Research system prompt-ok
│   ├── types.ts             # ResearchResults interface + Zod schema
│   └── template-mapper.ts   # Melyik xlsx template típust használjuk
```

### Pattern 1: Két lépéses Pipeline (Search → Structure)
**What:** A kutatás két külön Claude API hívásban történik.
**When to use:** Mindig — web_search citations és structured outputs inkompatibilisek.
**Example:**
```typescript
// Source: Anthropic official docs — web_search + structured outputs incompatibility
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const anthropic = new Anthropic();

// Step 1: Research with web_search
async function runWebSearch(briefData: BriefData): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildResearchPrompt(briefData) }
  ];

  let fullContent = "";
  let continueLoop = true;

  while (continueLoop) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: RESEARCH_SYSTEM_PROMPT,
      messages,
      tools: [{
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
        user_location: {
          type: "approximate",
          country: "HU",
          city: "Budapest",
          timezone: "Europe/Budapest"
        }
      }]
    });

    // Handle pause_turn (long-running web search)
    if (response.stop_reason === "pause_turn") {
      messages.length = 0;
      messages.push(
        { role: "user", content: buildResearchPrompt(briefData) },
        { role: "assistant", content: response.content }
      );
      continue;
    }

    // Extract text content from response
    for (const block of response.content) {
      if (block.type === "text") {
        fullContent += block.text;
      }
    }
    continueLoop = false;
  }

  return fullContent;
}

// Step 2: Structure with output_config
const ResearchResultsSchema = z.object({
  // ... schema definition
});

async function structureResults(
  rawResearch: string,
  briefData: BriefData
): Promise<ResearchResults> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [{
      role: "user",
      content: `Az alábbi kutatási eredmények alapján strukturáld a mediaplan adatokat:\n\n${rawResearch}`
    }],
    output_config: {
      format: zodOutputFormat(ResearchResultsSchema)
    }
  });

  return JSON.parse(response.content[0].text);
}
```

### Pattern 2: fire-and-forget `after()` callback
**What:** A jóváhagyás után azonnal válaszolunk, a pipeline háttérben fut.
**When to use:** Az approve route-ban — az ügyfélnek nem kell várnia.
**Example:**
```typescript
// Source: Next.js official docs — after() API
// File: app/api/approve/route.ts
import { after } from 'next/server';
import { runResearchPipeline } from '@/lib/research/pipeline';

export async function POST(request: Request) {
  const { briefData } = await request.json();

  // Fire-and-forget
  after(async () => {
    try {
      const results = await runResearchPipeline(briefData);
      // Phase 6: store/send results
    } catch (error) {
      console.error('[research] Pipeline error:', error);
      // Phase 6: PM error notification
    }
  });

  return Response.json({ approved: true });
}
```

### Pattern 3: pause_turn kezelés
**What:** Web search sokáig tarthat → az API `pause_turn`-nel megszakíthatja.
**When to use:** Mindig a web search loopban.
**Example:**
```typescript
// Source: Anthropic official docs — handling stop reasons
if (response.stop_reason === "pause_turn") {
  // Send the response back as-is to continue
  messages = [
    { role: "user", content: originalQuery },
    { role: "assistant", content: response.content }
  ];
  // Loop continues with updated messages
}
```

### Anti-Patterns to Avoid
- **Web search + structured output egy hívásban:** Citations (web_search) és `output_config.format` inkompatibilisek. 400-as hibát kapunk. MINDIG két lépés kell.
- **Streaming a háttérben:** Az `after()` callback-ben nincs kinek streamelni — nem kell streaming, sima `.create()` hívás.
- **Fix csatorna lista hardcode-olása:** A context döntés szerint az AI szabadon javasol csatornákat. Ne korlátozzuk.
- **Egy nagy monolitikus prompt:** A kutatás és a strukturálás két külön feladat, két külön prompt-tal, két külön API hívással.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema garantálás | `JSON.parse()` + retry loop | `output_config: { format: zodOutputFormat(schema) }` | Constrained decoding — 100% garancia, 0 retry |
| Web search | Saját scraper/API | `web_search_20250305` server tool | Anthropic szerveroldali, Brave Search, cached, no infra cost |
| Zod → JSON Schema konverzió | Kézi JSON schema írás | `zodOutputFormat()` from `@anthropic-ai/sdk/helpers/zod` | Automatikus, típusbiztos, SDK-supported |
| Timeout/background processing | Custom queue + worker | `after()` from `next/server` | Next.js natív, Vercel natív támogatás, már használjuk |

**Key insight:** A pipeline core-ja két Claude API hívás, semmi több. Ne építsünk köré extra infrastruktúrát.

## Common Pitfalls

### Pitfall 1: Web search + Structured Output egy hívásban
**What goes wrong:** 400-as HTTP error — "Citations are incompatible with output_config.format"
**Why it happens:** A web_search tool mindig engedélyezi a citations-t. A structured outputs (output_config.format) inkompatibilis a citations-szal, mert a citations interleaved citation block-okat szúr a text közé, ami sérti a JSON schema constraint-et.
**How to avoid:** Mindig két külön API hívás: (1) web_search kutatás, (2) structured output formázás.
**Warning signs:** Ha valaki megpróbálja a `tools: [web_search]` és `output_config: { format: ... }` kombót egy kérésben.

### Pitfall 2: Vercel timeout az after() callback-ben
**What goes wrong:** A pipeline timeout-ol mielőtt befejezné a kutatást.
**Why it happens:** Vercel Hobby plan: 10s timeout. Pro plan: max 60s (konfigurálható 300s-ig). Az AI kutatás (2 Claude hívás + web search) könnyen 30-60+ másodperc.
**How to avoid:** (1) `maxDuration` route segment config beállítása, (2) hatékony prompt-ok (ne legyen 10 web search), (3) Fluid Compute engedélyezése ha szükséges.
**Warning signs:** `FUNCTION_INVOCATION_TIMEOUT` Vercel logokban.

### Pitfall 3: pause_turn kezelés hiánya
**What goes wrong:** A web search közben az API `pause_turn`-nel megáll, a kód nem folytatja → részleges eredmény.
**Why it happens:** Ha Claude sok web search-öt futtat, a server-side sampling loop eléri az iteráció limitet (default 10).
**How to avoid:** Loop-ban kezelni a `stop_reason === "pause_turn"` esetet, és a response-t visszaküldeni a messages array-be.
**Warning signs:** `stop_reason: "pause_turn"` a response-ban, amit nem kezelünk.

### Pitfall 4: Template típus hibás kiválasztása
**What goes wrong:** A research output nem illeszkedik az xlsx template struktúrájára.
**Why it happens:** 4 különböző mediaplan template van, mindegyiknek más a metrika struktúrája.
**How to avoid:** A pipeline elején a brief `campaign_goal` és `campaign_types` alapján kiválasztani a megfelelő template típust, és a ResearchResults schema-t ehhez igazítani.
**Warning signs:** A structured output-ban olyan mezők vannak, amik a kiválasztott template-ben nem léteznek.

### Pitfall 5: Structured outputs schema túl komplex
**What goes wrong:** 400-as error — "Schema is too complex"
**Why it happens:** A structured outputs-nak vannak JSON Schema limitációi (no recursive, no minLength/maxLength, additionalProperties: false kötelező).
**How to avoid:** A Zod schema-t egyszerűen tartani, `zodOutputFormat()` automatikusan kezeli a transzformációt, de érdemes figyelni a komplexitásra.
**Warning signs:** Mélyen nested, sok optional mezővel rendelkező schema.

## Code Examples

### Template típus meghatározása

```typescript
// Az xlsx template-ek elemzése alapján:
// 1. "PPC only, Traffic only"  — Traffic kampányok: Impr, CTR, Clicks, CPC
// 2. "PPC only, Reach only"   — Awareness kampányok: Impr/View, Freq, Reach, CPM/CPV
// 3. "PPC only, Traffic & Reach" — Mindkettő kombinálva
// 4. "All channels"           — PPC + eDM + Egyéb média + Gyártás + Ügynökségi díj

type MediaplanTemplate =
  | "ppc_traffic"      // Traffic only
  | "ppc_reach"        // Reach only
  | "ppc_mixed"        // Traffic & Reach
  | "all_channels";    // Full mediaplan

function selectTemplate(briefData: BriefData): MediaplanTemplate {
  const goal = briefData.campaign_goal?.toLowerCase() || "";
  const types = briefData.campaign_types || [];

  const hasMedia = types.includes("media_buying");
  const hasSocial = types.includes("social_media");

  // Ha több csatorna típus van (média + social + PPC), all_channels
  if (hasMedia || hasSocial || types.length > 2) {
    return "all_channels";
  }

  // Kampánycél alapú PPC template kiválasztás
  const isTraffic = /traffic|forgalom|kattintás|click|konverzió|conversion|lead/i.test(goal);
  const isReach = /awareness|ismertség|reach|elérés|megjelenés|brand/i.test(goal);

  if (isTraffic && isReach) return "ppc_mixed";
  if (isReach) return "ppc_reach";
  return "ppc_traffic"; // default
}
```

### XLSX Template struktúra — PPC Channel Mix sorok
```typescript
// Source: xlsx template elemzés (docs/ROI_Mediaplan/)
// Minden PPC template közös sor struktúrája:

interface PpcChannelRow {
  campaign_target: string;     // "Traffic" | "Awareness" | "Conversion"
  campaign_type: string;       // "Prospecting" | "Retargeting" | "Remarketing"
  ad_network: string;          // "Google Display" | "Google Ads" | "Meta" | "TikTok" | "Youtube"
  ad_type: string;             // "Banner" | "Video" | "Search" | "Banner/Video"
  date: string;                // "2025.03.31 - 05.04."
  // Traffic metrics:
  impressions?: number;
  ctr?: string;                // "1.30%"
  clicks?: number;
  cpc?: number;                // Ft25
  // Reach metrics:
  impressions_views?: number;
  frequency?: number;          // 3.0
  reach?: number;
  cpm_cpv?: number;            // Ft250
  // Common:
  total_cost: number;          // Ft385,000
}

// Campaign Targeting sorok:
interface TargetingRow {
  ad_network: string;          // "Google" | "Meta" | "TikTok"
  age: string;                 // "20 - 62"
  gender: string;              // "Male / Female"
  location: string;            // "Budapest - HU"
  interest: string;            // Szabad szöveg platform-specifikus targeting-gel
  // Google: "Affinity: ..., In-market: ..., Life events: ..."
  // Meta: "Interests: ..."
}
```

### ResearchResults schema terv
```typescript
// A ResearchResults Zod schema a pipeline output-ja
// Ez mappelődik közvetlenül az xlsx template mezőire

import { z } from "zod";

const KpiEstimate = z.object({
  min: z.number(),
  likely: z.number(),
  max: z.number(),
});

const ChannelRow = z.object({
  campaign_target: z.string(),    // "Traffic" | "Awareness" | "Conversion"
  campaign_type: z.string(),      // "Prospecting" | "Retargeting"
  ad_network: z.string(),         // "Google Display" | "Meta" | "TikTok" stb.
  ad_type: z.string(),            // "Banner" | "Video" | "Search"
  budget_allocation_pct: z.number(),  // 0-100
  budget_allocation_huf: z.number(),
  // Metrikák — kampánycéltól függően töltődnek ki
  impressions: KpiEstimate.optional(),
  ctr: KpiEstimate.optional(),
  clicks: KpiEstimate.optional(),
  cpc: KpiEstimate.optional(),
  frequency: KpiEstimate.optional(),
  reach: KpiEstimate.optional(),
  cpm: KpiEstimate.optional(),
  cpv: KpiEstimate.optional(),
  conversions: KpiEstimate.optional(),
  cpa: KpiEstimate.optional(),
});

const TargetingRow = z.object({
  ad_network: z.string(),
  age: z.string(),
  gender: z.string(),
  location: z.string(),
  interest: z.string(),     // Platform-specifikus targeting szöveg
});

const CampaignSummary = z.object({
  total_budget_huf: z.number(),
  total_impressions: KpiEstimate.optional(),
  total_clicks: KpiEstimate.optional(),
  total_reach: KpiEstimate.optional(),
  total_conversions: KpiEstimate.optional(),
  overall_ctr: KpiEstimate.optional(),
  overall_cpc: KpiEstimate.optional(),
  overall_cpm: KpiEstimate.optional(),
});

const ResearchResultsSchema = z.object({
  template_type: z.enum(["ppc_traffic", "ppc_reach", "ppc_mixed", "all_channels"]),
  campaign_name: z.string(),
  campaign_period: z.string(),
  campaign_goal: z.string(),
  channels: z.array(ChannelRow),
  targeting: z.array(TargetingRow),
  summary: CampaignSummary,
  research_notes: z.string(),       // AI megjegyzések, bizonytalanságok
  sources: z.array(z.string()),     // Web search források
});

type ResearchResults = z.infer<typeof ResearchResultsSchema>;
```

### Web search prompt minta
```typescript
// A Step 1 research prompt — a brief alapján generáljuk
function buildResearchPrompt(briefData: BriefData): string {
  return `Készíts piackutatást az alábbi kampány briefhez:

BRIEF ADATOK:
- Cég: ${briefData.company_name}
- Iparág: ${briefData.industry || "N/A"}
- Kampánycél: ${briefData.campaign_goal}
- Büdzsé: ${briefData.budget_range || "N/A"}
- Célcsoport: ${briefData.age_range || ""} ${briefData.gender?.join(", ") || ""} ${briefData.location || "Magyarország"}
- Időszak: ${briefData.start_date || "N/A"} - ${briefData.end_date || "N/A"}
- Csatornák: ${briefData.ad_channels?.join(", ") || "nincs megadva — javasolj"}
- Versenytársak: ${briefData.competitors?.join(", ") || "N/A"}

FELADATOK:
1. Keress benchmark adatokat az iparágra (CPM, CPC, CTR, konverziós ráták)
2. Keress versenytárs hirdetési aktivitásra vonatkozó adatokat
3. Javasolj csatorna mixet a kampánycél és büdzsé alapján
4. Adj platformonkénti targeting javaslatot (Google Affinity/In-market, Meta Interests)
5. Becsüld meg a KPI-ket a büdzsé alapján

Minden adatot magyar piacra lokalizálj!`;
}
```

## XLSX Template elemzés eredménye

Az xlsx template-ek vizsgálata feltárta a pontos struktúrát, amire a ResearchResults-nak illeszkednie kell:

### Template típusok és metrikáik

| Template | Metrikák | Mikor használandó |
|----------|----------|-------------------|
| **PPC Traffic only** | Impr, CTR, Clicks, CPC, Total cost | Traffic/Conversion kampányok |
| **PPC Reach only** | Impr/View, Freq, Reach, CPM/CPV, Total cost | Awareness/Brand kampányok |
| **PPC Traffic & Reach** | Mindkettő szekciókra bontva | Vegyes kampányok |
| **All channels** | PPC + eDM + Egyéb média + Gyártás + Ügynökségi díj | Teljes mediaplan |

### Közös struktúra elemek (minden template-ben)
1. **Header:** Kampány név, Időszak, Büdzsé, Partner/Department, Kapcsolattartó
2. **PPC Channel Mix tábla:** Soronként egy csatorna-hirdetés kombináció
3. **Campaign Targeting tábla:** Soronként egy platform targeting

### Csatornák az xlsx template-ekben
A template-ek NEM fixálják a csatorna listát — a példák tartalmazzák a Google Display, Google Ads (Search), Meta, TikTok, YouTube csatornákat, de a sorok száma változó. **Az AI szabadon javasolhat csatornákat** — a context döntés érvényes.

### All Channels template extra szekciói
Az "all_channels" template további szekciókat tartalmaz, amelyek nem PPC-specifikusak:
- **eDM:** sending, Click rate %, Click (est.), CPS — email kampányokhoz
- **Egyéb média:** Influencer, PR, stb. — szabad szöveges sorok
- **Gyártás:** Banner/eDM creation — produkciós költségek
- **Ügynökségi díj:** % alapú fee

Ezek a szekciók az AI kutatás szempontjából opcionálisak — a Phase 5 fókusza a PPC channel mix, targeting és KPI becslés. Az egyéb szekciók a Phase 6 xlsx generálásban tölthetők ki default értékekkel.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `output_format` parameter | `output_config: { format: ... }` | 2025 Q4 → 2026 Q1 | Az `output_format` deprecated, `output_config.format`-ot kell használni |
| Beta header a structured outputs-hoz | GA — nincs szükség beta header-re | 2026 Q1 (Opus 4.6, Sonnet 4.5, Haiku 4.5) | Egyszerűbb kód, stabil API |
| Prompt-based JSON kinyerés | `output_config.format` constrained decoding | 2025 nov | 100% garancia a schema megfelelésre |
| Custom web scraping | `web_search_20250305` server tool | 2025 márc | Anthropic szerveren fut, nincs infra, $10/1000 search |

**Deprecated/outdated:**
- `output_format` top-level paraméter → `output_config.format`-ra migrálni
- `anthropic-beta: structured-outputs-2025-11-13` header → már nem kell

## Vercel Deployment Considerations

### Timeout limitek
| Plan | Default timeout | Max configurable | after() duration |
|------|----------------|------------------|------------------|
| Hobby | 10s | 10s | 10s |
| Pro | 15s | 300s (5 min) | 300s |
| Enterprise | 15s | 900s (15 min) | 900s |

**A research pipeline várható futási ideje:**
- Step 1 (web search): 10-30s (web search latency + token generation)
- Step 2 (structured output): 5-15s (token generation only)
- **Összesen: 15-45s**

**Recommendation:** `maxDuration` beállítása a route-on:
```typescript
// app/api/approve/route.ts
export const maxDuration = 120; // 2 perc — Pro plan-en engedélyezett
```

Hobby plan-en ez problémás lesz — a 10s limit nem elég. Pro plan szükséges production-ben.

## Open Questions

1. **Vercel plan típusa production-ben**
   - What we know: A kód jelenleg nincs `maxDuration` beállítás, nincs `vercel.json`
   - What's unclear: Hobby vagy Pro plan lesz-e
   - Recommendation: `maxDuration = 120` beállítása a route-on, Pro plan feltételezése. Ha Hobby, az `after()` callback 10s-en belül timeout-ol — ez nem elég az AI kutatáshoz.

2. **Web search költség kontroll**
   - What we know: $10/1000 search, a pipeline-ban `max_uses: 5` per request
   - What's unclear: Hány brief fog naponta jóváhagyásra kerülni
   - Recommendation: `max_uses: 5` default, szükség esetén csökkenthető. Egy brief kutatás ára: ~$0.05 web search + ~$0.05-0.15 token cost ≈ $0.10-0.20/brief

3. **Research eredmények tárolása**
   - What we know: Phase 6 fogja feldolgozni az eredményeket
   - What's unclear: Hol tároljuk a kutatás eredményét a Phase 5 és 6 között
   - Recommendation: Ez Phase 6 scope, de a pipeline-nak valahol persistálnia kell az eredményt (file system, DB, vagy in-memory ha Phase 6 közvetlenül hívja)

## Sources

### Primary (HIGH confidence)
- [Anthropic web_search tool docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) — tool definition, pricing, streaming, pause_turn, response format
- [Anthropic structured outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — `output_config.format`, Zod integration, `zodOutputFormat()`, incompatibility with citations
- [Anthropic handling stop reasons](https://platform.claude.com/docs/en/api/handling-stop-reasons) — `pause_turn` continuation pattern
- [Next.js after() docs](https://nextjs.org/docs/app/api-reference/functions/after) — fire-and-forget pattern, Vercel support, maxDuration

### Secondary (MEDIUM confidence)
- [Vercel Functions duration docs](https://vercel.com/docs/functions/configuring-functions/duration) — timeout limitek plan-enként
- Existing codebase analysis — approve route, BriefData schema, xlsx template structure

### Tertiary (LOW confidence)
- Vercel Fluid Compute — az exact `after()` duration limitek plan-enként nem 100%-ig tiszták a public docs-ból

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — minden library már a projektben van, az API-k dokumentáltak
- Architecture (két lépéses pipeline): HIGH — a web_search/citations incompatibility official docs-ban dokumentált
- Pitfalls: HIGH — a fő pitfall-ok (citations incompatibility, pause_turn, Vercel timeout) mind official docs-ból
- XLSX template mapping: HIGH — a template-eket közvetlenül elemeztük
- Vercel timeout specifics: MEDIUM — a plan-specifikus `after()` limitek nem 100% egyértelműek

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (30 nap — stabil API-k, nem változik gyakran)
