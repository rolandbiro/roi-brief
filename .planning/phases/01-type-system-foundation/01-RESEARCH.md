# Phase 1: Type System & Foundation - Research

**Researched:** 2026-02-10
**Domain:** Zod sémák, Anthropic SDK structured outputs, moduláris prompt rendszer, entry flow átalakítás
**Confidence:** HIGH

## Summary

A Phase 1 célja a technikai alapok lefektetése: a jelenlegi fix 13-mezős `BriefData` interface-t Zod sémákkal definiált, kampánytípus-specifikus struktúrára cseréljük, az Anthropic SDK-t structured outputs-ra frissítjük (a törékeny `BRIEF_JSON_START/END` regex helyett), moduláris prompt rendszert építünk, és átalakítjuk a belépési flow-t (PDF feltöltés eltávolítása, landing + chat layout).

A kutatás megerősíti, hogy mindez megoldható minimális dependency-bővítéssel: **Zod v4** (4.3.6) a séma-rendszerhez, és az **@anthropic-ai/sdk** upgrade (0.71.2 -> 0.74.0) a structured outputs GA támogatáshoz. A `zodOutputFormat` helper a `@anthropic-ai/sdk/helpers/zod` path-on elérhető, és közvetlenül Zod sémákat alakít `output_config.format` paraméterre. A Zod `z.discriminatedUnion()` NEM támogatja a nested discriminator key-eket (pl. `"campaign.type"`), ezért top-level `campaign_type` mezőt kell használni, vagy `z.union()` fallback-et (ami `anyOf`-ra fordul JSON schema-ban -- az Anthropic ezt támogatja).

**Primary recommendation:** Zod sémák legyenek az egyetlen forrás (single source of truth): belőlük származik a TypeScript típus (`z.infer`), a structured output séma (`zodOutputFormat`), és a runtime validáció (`schema.parse()`). A brief adatgyűjtés dual-call pattern-nel működjön: streaming chat a beszélgetéshez, külön structured output hívás az adatkinyeréshez.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Landing szekció + chat layout: felső hero szekció, alatta/mellette a chat felület
- Hero tartalom: rövid értékajánlat (mi ez, hogyan működik, miért jó -- 3 pontos struktúra) + adatkezelési irányelvek elfogadása
- Adatkezelés: kötelező checkbox + link az adatkezelési tájékoztatóra, checkbox nélkül nem indul a chat
- Mobil: hero felcsúsztatható -- először a hero látszik, CTA-ra kattintva/lefelé scrollva a chat kitölti a képernyőt
- 4 típus megerősítve: Médiavásárlás, Performance/PPC, Brand/Awareness, Social Media
- Bővebb base mezők: cégnév, iparág, kampány célja, időzítés, büdzsékeret, célcsoport + meglévő anyagok, korábbi kampány tapasztalatok, versenytársak
- Típusspecifikus mezők számossága és tartalma: Claude's Discretion (a requirements TYPE-04 alapján dolgozza ki)
- Nincs extra must-have mező a requirements-en túl
- Megszólítás: kontextusfüggő -- alapból magáz, de ha az érdeklődő tegez, átváll tegezésre
- Személyiség: barátságos segítő -- kedves, türelmes, könnyedebb hang, nem nyomasztó
- Bemutatkozás: ROI Works névvel -- "Üdvözöljük! A ROI Works brief asszisztense vagyok..."
- Szakmai mélység: szakmai de nem ijesztő -- használ szakmai kifejezéseket, de megmagyarázza ha kell

### Claude's Discretion
- Típusspecifikus mezők pontos listája és részletessége (TYPE-04 alapján)
- Chat felület pontos kinézete és spacing
- Hero szekció vizuális design
- Mobile átmeneti animáció
- AI bemutatkozó üzenet pontos szövege

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | 4.3.6 | Schema validation, discriminated unions, Anthropic structured output bridge | Anthropic SDK `zodOutputFormat` helper közvetlenül Zod sémákat fogad. Zod v4 14x gyorsabb string parsingnál mint v3. Zero-dependency, 13KB gzipped. |
| @anthropic-ai/sdk | 0.74.0 (upgrade from 0.71.2) | Structured outputs GA, `output_config.format`, streaming | GA support for `output_config.format` parameter. A 0.71.2 nem tartalmazza a GA structured output támogatást. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @anthropic-ai/sdk/helpers/zod | (part of SDK) | `zodOutputFormat()` helper | Zod schema -> JSON schema konverzió az `output_config.format`-hoz |

### Remove
| Package | Version | Why Remove |
|---------|---------|------------|
| ai (Vercel AI SDK) | ^6.0.31 | Zero imports a codebase-ben. Nincs használatban. Bundle size csökkentés. |
| pdf-parse | ^2.4.5 | PDF feltöltés eltávolítása miatt nem szükséges (Phase 1 scope: FLOW-02) |
| unpdf | ^1.4.0 | PDF feltöltés eltávolítása miatt nem szükséges (Phase 1 scope: FLOW-02) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod v4 `z.discriminatedUnion()` | Zod `z.union()` | `discriminatedUnion` gyorsabb (O(1) lookup) de csak top-level key-t támogat. `z.union()` mindent tud (`anyOf`-ra fordul), de lassabb (sorra próbál). **Recommendation: `z.union()` használata ha a top-level discriminator nem praktikus.** |
| `zodOutputFormat()` | Kézzel írt JSON schema | `zodOutputFormat()` automatikusan kezeli az unsupported constraint-ek eltávolítását és description-be írását. Kézzel írni error-prone. |
| `output_config.format` (structured output) | Tool use `strict: true` | Mindkettő garantált schema-compliance. Structured output a **response formátumot** szabályozza, tool use a **tool input-ot**. A Phase 1-ben structured output kell (brief adat kinyerés). Phase 2-ben tool use is jön (classify_campaign, update_brief). |

**Installation:**
```bash
npm install zod @anthropic-ai/sdk@latest
npm uninstall ai pdf-parse unpdf
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
  schemas/
    brief-base.ts          # BriefBase Zod schema (shared fields)
    campaign-types.ts       # CampaignType enum, type definitions
    media-buying.ts         # MediaBuying type-specific schema
    performance.ts          # Performance/PPC type-specific schema
    brand.ts               # Brand/Awareness type-specific schema
    social.ts              # Social Media type-specific schema
    brief-data.ts          # Composed BriefData union schema + z.infer export
    index.ts               # Re-exports
  prompts/
    base.ts                # Base system prompt (hangvétel, szabályok, flow)
    types/
      media-buying.ts      # Médiavásárlás kérdések + kontextus
      performance.ts       # PPC kérdések + kontextus
      brand.ts             # Brand/awareness kérdések + kontextus
      social.ts            # Social media kérdések + kontextus
    compose.ts             # composeSystemPrompt(types) assembler
    extraction.ts          # Brief extraction prompt (structured output-hoz)
    index.ts               # Re-exports
types/
  brief.ts                 # z.infer<> re-export (backward compat)
  chat.ts                  # Message interface (megtartva)
```

### Pattern 1: Zod as Single Source of Truth
**What:** Egyetlen Zod séma definiálja a brief adatstruktúrát, ebből deriválódik a TypeScript típus, a structured output JSON schema, és a runtime validáció.
**When to use:** Minden brief-adat definíciónál.
**Example:**
```typescript
// Source: Anthropic Structured Outputs docs + Zod v4 docs
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

// 1. Define schema
const BriefBaseSchema = z.object({
  company_name: z.string(),
  industry: z.string(),
  campaign_goal: z.string(),
  timing: z.string(),
  budget_range: z.string(),
  target_audience: z.string(),
  existing_materials: z.string().optional(),
  previous_campaigns: z.string().optional(),
  competitors: z.array(z.string()),
});

// 2. Derive TypeScript type
type BriefBase = z.infer<typeof BriefBaseSchema>;

// 3. Use for structured output
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  messages: [...],
  output_config: { format: zodOutputFormat(BriefBaseSchema) },
});

// 4. Runtime validation
const data = BriefBaseSchema.parse(JSON.parse(response.content[0].text));
```

### Pattern 2: Campaign Type Discriminated Union with Top-Level Key
**What:** A `campaign_type` mező top-level-en áll, nem nested object-ben, mert a `z.discriminatedUnion()` nem támogatja a nested key-eket.
**When to use:** A BriefData union schema definíciónál.
**Example:**
```typescript
// Source: Zod docs + GitHub Issue #1868
const CampaignTypeEnum = z.enum([
  'media_buying',
  'performance_ppc',
  'brand_awareness',
  'social_media',
]);
type CampaignType = z.infer<typeof CampaignTypeEnum>;

const MediaBuyingBriefSchema = BriefBaseSchema.extend({
  campaign_type: z.literal('media_buying'),
  media_specific: z.object({
    grp_target: z.string().optional(),
    reach_target: z.string().optional(),
    frequency_cap: z.string().optional(),
    media_types: z.array(z.string()),
    daypart_preferences: z.string().optional(),
    viewability_requirements: z.string().optional(),
  }),
});

const PerformanceBriefSchema = BriefBaseSchema.extend({
  campaign_type: z.literal('performance_ppc'),
  performance_specific: z.object({
    target_roas: z.string().optional(),
    target_cpa: z.string().optional(),
    conversion_events: z.array(z.string()),
    landing_pages: z.array(z.string()),
    ad_accounts: z.string().optional(),
    attribution_model: z.string().optional(),
  }),
});

// discriminatedUnion on top-level key
const BriefDataSchema = z.discriminatedUnion('campaign_type', [
  MediaBuyingBriefSchema,
  PerformanceBriefSchema,
  BrandBriefSchema,
  SocialBriefSchema,
]);

type BriefData = z.infer<typeof BriefDataSchema>;
```

**FONTOS:** A `z.discriminatedUnion()` csak top-level discriminator key-t támogat. A `campaign_type` mező kötelezően a root object szintjén kell legyen, nem `campaign.type` nested path-on. Ez eltérés a korábbi research javaslatától, de a Zod limitation egyértelmű.

### Pattern 3: Modular Prompt Composition
**What:** A system prompt base modul + típusspecifikus modulokból áll össze. A compose függvény a detektált típusok alapján építi a teljes promptot.
**When to use:** Minden Claude API hívásnál.
**Example:**
```typescript
// lib/prompts/base.ts
export const BASE_PROMPT = `Te a ROI Works marketing ügynökség brief asszisztense vagy.
Barátságos, segítőkész tanácsadóként viselkedsz.

MEGSZÓLÍTÁS:
- Alapból magázódj (Ön, Önök)
- Ha az érdeklődő tegez, válts tegezésre

STÍLUS:
- Magyar nyelv
- Kedves, türelmes, könnyedebb hang
- Szakmai kifejezéseket használsz, de megmagyarázod ha kell
- MINDIG csak egy kérdés egyszerre
- Minden kérdéshez adj rövid kontextust

BEMUTATKOZÁS:
"Üdvözöljük! A ROI Works brief asszisztense vagyok..."
`;

// lib/prompts/types/media-buying.ts
export const MEDIA_BUYING_MODULE = `
## MÉDIAVÁSÁRLÁS SPECIFIKUS KÉRDÉSEK
Amikor médiavásárlási kampányról van szó, kérdezz rá:
- Célzott GRP (Gross Rating Point) -- ha az ügyfél nem ismeri, magyarázd el röviden
- Elvárt reach és frequency
- Médiatípusok preferenciája (TV, rádió, outdoor, digital display)
- Viewability elvárások
- Napszak-preferenciák (dayparting)
`;

// lib/prompts/compose.ts
import { CampaignType } from '@/lib/schemas/campaign-types';
import { BASE_PROMPT } from './base';
import { MEDIA_BUYING_MODULE } from './types/media-buying';
import { PERFORMANCE_MODULE } from './types/performance';
import { BRAND_MODULE } from './types/brand';
import { SOCIAL_MODULE } from './types/social';

const TYPE_MODULES: Record<CampaignType, string> = {
  media_buying: MEDIA_BUYING_MODULE,
  performance_ppc: PERFORMANCE_MODULE,
  brand_awareness: BRAND_MODULE,
  social_media: SOCIAL_MODULE,
};

export function composeSystemPrompt(types: CampaignType[]): string {
  const typeModules = types
    .map(type => TYPE_MODULES[type])
    .join('\n\n');
  return `${BASE_PROMPT}\n\n${typeModules}`;
}
```

### Pattern 4: Dual-Call Pattern (Chat + Extraction)
**What:** Streaming chat a beszélgetéshez (nincs structured output), külön non-streaming hívás a brief adat kinyeréséhez (structured output Zod sémával).
**When to use:** A chat flow-ban. Chat turn: streaming, szabad formátumú válasz. Brief extraction: non-streaming, `output_config.format`.
**Why two calls:**
- Chat közben a felhasználónak természetes magyar nyelvű válaszok kellenek
- Az adatkinyerésnél gépi feldolgozásra alkalmas JSON kell
- A kettő keverése (BRIEF_JSON_START/END) törékeny és token-pazarló
**Example:**
```typescript
// Chat turn: streaming, no structured output
const stream = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  system: composeSystemPrompt(detectedTypes),
  messages: conversationHistory,
  max_tokens: 2048,
  stream: true,
});

// Extraction: non-streaming, structured output
const extraction = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  system: EXTRACTION_PROMPT,
  messages: [
    ...conversationHistory,
    { role: "user", content: "Kérlek, foglald össze a brief adatokat a beszélgetés alapján." }
  ],
  max_tokens: 4096,
  output_config: { format: zodOutputFormat(BriefDataSchema) },
});
const briefData = BriefDataSchema.parse(
  JSON.parse(extraction.content[0].text)
);
```

### Pattern 5: Landing + Chat Layout (FLOW-01, FLOW-03)
**What:** A home page átalakítása: PDF feltöltés helyett hero szekció + adatkezelési checkbox + chat felület.
**When to use:** Az entry flow teljes átalakításánál.
**Structure:**
```
┌─────────────────────────────┐
│         HERO SECTION        │
│  Értékajánlat (3 pont)      │
│  + Adatkezelési checkbox    │
│  [Indítás CTA]              │
├─────────────────────────────┤
│                             │
│       CHAT FELÜLET          │
│  (checkbox után aktív)      │
│                             │
└─────────────────────────────┘

Mobile:
┌───────────────────┐
│   HERO (teljes    │  <- Először ez látszik
│    képernyő)      │
│   [Indítás CTA]   │
├───────────────────┤
│                   │  <- CTA-ra/scrollra
│   CHAT (teljes    │     felcsúszik
│    képernyő)      │
│                   │
└───────────────────┘
```

### Anti-Patterns to Avoid
- **Nested discriminator key:** Ne használj `z.discriminatedUnion("campaign.type", ...)` -- nem működik. Top-level `campaign_type` kell.
- **Single god-schema:** Ne csinálj egy hatalmas sémát minden opcionális mezővel. Típusspecifikus sémák + union a helyes.
- **Client-side prompt assembly:** A system prompt a serveren álljon össze, ne a kliensről jöjjön.
- **BRIEF_JSON_START/END megtartása:** Ne tartsd meg "fallback"-ként. Teljes mértékben structured output-ra kell váltani.
- **Runtime type assumptions:** Ne bízz abban, hogy a Claude kimenet TypeScript-kompatibilis. MINDIG Zod.parse() legyen a kapocs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema generation Zod-ból | Kézi JSON schema writer | `zodOutputFormat()` from `@anthropic-ai/sdk/helpers/zod` | Az SDK helper automatikusan kezeli az unsupported constraint-ek eltávolítását, description enrichment-et, és `additionalProperties: false` hozzáadását |
| Schema validation at runtime | Kézi `typeof` / `in` check-ek | `ZodSchema.parse()` / `.safeParse()` | Zod pontos hibaüzeneteket ad, partial parse-t támogat, és a TypeScript type narrowing-gel integrálódik |
| TypeScript type derivation from schema | Párhuzamos interface + schema maintenance | `z.infer<typeof Schema>` | Egyetlen forrás, nincs desync lehetőség |
| Prompt template concatenation | String concatenation kézi escape-eléssel | TypeScript template literal + compose function | Típusbiztos, tesztelhető, a compose function unit-tesztelhető |

**Key insight:** A Zod az egyetlen dependency ami igazán szükséges a Phase 1-hez. Minden más a meglévő stack-kel megoldható.

## Common Pitfalls

### Pitfall 1: Zod discriminatedUnion Nested Key Trap
**What goes wrong:** A fejlesztő `z.discriminatedUnion("campaign.type", [...])` formátumban próbálja definiálni a union-t, mert a korábbi `BriefData` interface-ben a `type` a `campaign` objektumon belül volt.
**Why it happens:** A korábbi research és az eredeti kódbázis `campaign.type` struktúrát használt. A Zod API hasonlónak tűnik az TS discriminated union-höz, de nem támogatja a nested path-okat.
**How to avoid:** A `campaign_type` mezőt top-level-re kell emelni a sémában. Ez API-level változás, de a structured output-nak ez szükséges.
**Warning signs:** `ZodError: Invalid discriminator value` hiba a schema definíciónál.

### Pitfall 2: Structured Output First Request Latency
**What goes wrong:** Az első API hívás egy adott sémával lassabb, mert az Anthropic grammar-t compilál és cache-eli.
**Why it happens:** Constrained decoding a schema-t compiled grammar-rá alakítja. Ez 24 órán át cached.
**How to avoid:** Fejlesztés közben számíts rá. Production-ben a cache stabil 24h-ra. Ha a schema változik (struktúra, nem csak name/description), a cache invalidálódik.
**Warning signs:** Első hívás 2-5 másodperccel lassabb mint a következők.

### Pitfall 3: output_config vs output_format Parameter Confusion
**What goes wrong:** A régi `output_format` parameter használata az újabb `output_config.format` helyett.
**Why it happens:** A structured outputs először beta-ban jelent meg `output_format` parameterrel. GA-ban `output_config.format`-ra migrált. A régi még működik ideiglenesen de deprecated.
**How to avoid:** Mindig `output_config: { format: zodOutputFormat(schema) }` formátumot használj. Az SDK helper ezt automatikusan kezeli.
**Warning signs:** Deprecation warning a console-ban.

### Pitfall 4: Streaming + Structured Output Összetévesztése
**What goes wrong:** A chat streaming híváshoz is structured output-ot akarnak adni, ami JSON-t streamel a felhasználónak szöveges válasz helyett.
**Why it happens:** A structured output kompatibilis a streaming-gel, de a JSON streaming nem felhasználó-barát.
**How to avoid:** Dual-call pattern: chat turn-öknél NINCS `output_config`, az extraction hívás NEM streaming.
**Warning signs:** A felhasználó JSON részleteket lát a chatben.

### Pitfall 5: BriefBase Schema Mezők Hiánya
**What goes wrong:** A bővített base mezők (iparág, meglévő anyagok, korábbi kampány tapasztalatok) kimaradnak a sémából, mert a jelenlegi `types/chat.ts` BriefData nem tartalmazza őket.
**Why it happens:** A CONTEXT.md locked decision bővebb base mezőket specifikál mint a jelenlegi kód.
**How to avoid:** A CONTEXT.md-ben felsorolt bővebb base mezőket mind be kell venni: cégnév, iparág, kampány célja, időzítés, büdzsékeret, célcsoport, meglévő anyagok, korábbi kampány tapasztalatok, versenytársak.
**Warning signs:** A requirements-hez képest hiányos a schema.

## Code Examples

Verified patterns from official sources:

### Anthropic Structured Output with Zod
```typescript
// Source: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

const BriefSchema = z.object({
  company_name: z.string(),
  industry: z.string(),
  campaign_type: z.enum(['media_buying', 'performance_ppc', 'brand_awareness', 'social_media']),
  campaign_goal: z.string(),
  target_audience: z.string(),
  budget_range: z.string(),
});

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "Extract brief data from this conversation..." }
  ],
  output_config: { format: zodOutputFormat(BriefSchema) },
});

// response.content[0].text is guaranteed valid JSON matching schema
const data = BriefSchema.parse(JSON.parse(response.content[0].text));
```

### Zod Schema Extension Pattern
```typescript
// Source: https://zod.dev/api
const BriefBaseSchema = z.object({
  company_name: z.string(),
  industry: z.string(),
  campaign_type: z.enum(['media_buying', 'performance_ppc', 'brand_awareness', 'social_media']),
  campaign_goal: z.string(),
  timing: z.string(),
  budget_range: z.string(),
  target_audience: z.string(),
  existing_materials: z.string().optional(),
  previous_campaigns: z.string().optional(),
  competitors: z.array(z.string()),
  notes: z.string().optional(),
});

// Extend for specific campaign type
const MediaBuyingBriefSchema = BriefBaseSchema.extend({
  campaign_type: z.literal('media_buying'),
  media_specific: z.object({
    grp_target: z.string().optional(),
    reach_target: z.string().optional(),
    frequency_cap: z.string().optional(),
    media_types: z.array(z.string()),
  }),
});

// Union with discriminator
const FullBriefSchema = z.discriminatedUnion('campaign_type', [
  MediaBuyingBriefSchema,
  PerformanceBriefSchema,
  BrandBriefSchema,
  SocialBriefSchema,
]);

// Derive TypeScript type
type FullBrief = z.infer<typeof FullBriefSchema>;
```

### Streaming Chat Route (Existing Pattern, Kept)
```typescript
// Source: existing app/api/chat/route.ts - kept for chat turns
const stream = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  system: composeSystemPrompt(campaignTypes),
  messages: claudeMessages,
  stream: true,
  // NO output_config -- this is free-form conversation
});

const readableStream = new ReadableStream({
  async start(controller) {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
      }
    }
    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    controller.close();
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `output_format` parameter (beta) | `output_config.format` parameter (GA) | 2026 Q1 | Deprecated header nem szükséges, de a régi param ideiglenesen működik |
| `BRIEF_JSON_START/END` regex parsing | Structured outputs with `output_config` | 2025 Nov (beta) -> 2026 Q1 (GA) | Garantált schema compliance, nincs parse error |
| `@anthropic-ai/sdk ^0.71.2` | `@anthropic-ai/sdk ^0.74.0` | 2026-02-08 | GA structured outputs support |
| Zod v3 | Zod v4 (4.3.6) | 2025 | 14x gyorsabb string parsing, jobb TypeScript inference |
| `betaZodTool` from `helpers/beta/zod` | `zodOutputFormat` from `helpers/zod` | 2026 Q1 | GA path, nem beta |
| Flat `BriefData` interface | Zod discriminated union with type-specific extensions | Phase 1 | Típusbiztos, runtime validated, schema-driven |

**Deprecated/outdated:**
- `output_format` parameter: Deprecated, `output_config.format`-ra kell migrálni
- `BRIEF_JSON_START/END` pattern: Teljesen elhagyandó
- `betaZodTool` helper: Migrálni a GA `zodOutputFormat`-ra
- `ai` (Vercel AI SDK) package: Unused, eltávolítandó
- `pdf-parse` / `unpdf`: PDF feltöltés eltávolítása miatt szükségtelen

## Open Questions

1. **Típusspecifikus mezők pontos listája**
   - What we know: A CONTEXT.md-ben TYPE-04 szerint "médiavásárlás: GRP, reach, frequency; PPC: ROAS, CPA, landing page, fiókok; brand: lift, recall, positioning; social: organic/paid, platformok, influencer" -- de ez Claude's Discretion
   - What's unclear: Az egyes típusok mezőinek pontos listája és részletessége
   - Recommendation: A planner dolgozza ki a TYPE-04 requirement és a research/FEATURES.md alapján. 5-8 mező típusonként, mind opcionális (a brief fokozatosan töltődik)

2. **Mobile hero->chat átmeneti animáció**
   - What we know: A hero felcsúsztatható, CTA-ra kattintva a chat kitölti a képernyőt
   - What's unclear: Konkrét animáció típus (slide-up, fade, scroll-snap?)
   - Recommendation: CSS `scroll-snap` vagy egyszerű `translateY` transition. Tailwind CSS v4-ben ezek natívan elérhetők. Claude's Discretion terület.

3. **AI bemutatkozó üzenet pontos szövege**
   - What we know: "Üdvözöljük! A ROI Works brief asszisztense vagyok..." kezdet
   - What's unclear: A teljes szöveg
   - Recommendation: A prompt base.ts-ben definiálni. Claude's Discretion -- a planner dolgozza ki.

## Sources

### Primary (HIGH confidence)
- [Anthropic Structured Outputs Documentation (GA)](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) -- `output_config.format`, `zodOutputFormat`, streaming compatibility, JSON schema limitations, grammar caching
- [Anthropic Tool Use Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) -- tool definition, multi-turn tool_result handling, `stop_reason: "tool_use"`, strict mode
- [@anthropic-ai/sdk npm registry](https://www.npmjs.com/package/@anthropic-ai/sdk) -- version 0.74.0 (published 2026-02-08), verified via `npm view`
- [Zod v4 Release Notes](https://zod.dev/v4) -- version 4.3.6, verified via `npm view`
- [Zod API Documentation](https://zod.dev/api) -- `z.discriminatedUnion()`, `z.union()`, `z.object().extend()`, `z.infer<>`
- [Zod GitHub Issue #1868](https://github.com/colinhacks/zod/issues/1868) -- nested discriminator key not supported, confirmed

### Secondary (MEDIUM confidence)
- [Existing codebase analysis](file:///Users/biroroland/roi-brief) -- `types/chat.ts`, `lib/prompts.ts`, `hooks/useChat.ts`, `app/api/chat/route.ts`, `app/page.tsx`, `app/brief/page.tsx`, `components/BriefEditor.tsx` -- all read and analyzed
- [Project research STACK.md](.planning/research/STACK.md) -- prior research verified
- [Project research ARCHITECTURE.md](.planning/research/ARCHITECTURE.md) -- patterns confirmed
- [Project research PITFALLS.md](.planning/research/PITFALLS.md) -- pitfalls validated

### Tertiary (LOW confidence)
- Zod v4 `z.discriminatedUnion` deprecation plans (switch API) -- [GitHub Issue #2106](https://github.com/colinhacks/zod/issues/2106) -- planned but not yet implemented, doesn't affect current usage

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All versions verified via npm, API patterns verified via official Anthropic docs
- Architecture: HIGH -- Patterns validated against official Anthropic structured outputs docs, Zod docs, and existing codebase analysis
- Pitfalls: HIGH -- Based on direct codebase reading, official docs limitations sections, and verified GitHub issues

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (30 days -- stable stack, no fast-moving dependencies)
