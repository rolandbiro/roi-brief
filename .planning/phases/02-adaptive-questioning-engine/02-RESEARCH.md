# Phase 2: Adaptive Questioning Engine - Research

**Researched:** 2026-02-10
**Domain:** Anthropic tool use, streaming + tool execution loop, adaptív kérdezés prompt engineering, multi-típus séma, quick-reply gombok
**Confidence:** HIGH

## Summary

A Phase 2 célja, hogy az AI felismerje a kampánytípus(oka)t az érdeklődő válaszaiból, megerősíttesse, majd típusspecifikus adaptív kérdéseket tegyen fel. A jelenlegi rendszer (Phase 1) streaming chat + különálló extraction hívást használ. A Phase 2 két kritikus új képességet igényel: (1) **tool use a streaming válaszon belül** a típusdetektáláshoz és brief state frissítéshez, és (2) **séma átalakítás** a multi-típus brief támogatáshoz.

A kutatás megerősíti, hogy az Anthropic API streaming + tool use teljesen kompatibilis: Claude egy streaming válaszban text blokkot ÉS tool_use blokkot is tud adni. A `stop_reason: "tool_use"` jelzi a szervernek, hogy tool-t kell végrehajtani. A szerver oldali "agentic loop" (hívás → tool végrehajtás → tool_result visszaküldés → újabb hívás) az SSE stream-en belül megvalósítható, de a kliens számára transzparensen kell kezelni (a kliens csak a text deltákat látja, a tool_use/tool_result a szerveren marad).

A multi-típus brief séma a jelenlegi `z.discriminatedUnion("campaign_type", [...])` helyett egy **összetett sémára** cserélendő: `campaign_types: z.array(CampaignTypeEnum)` tömbbel és opcionális típusspecifikus blokkokkal. Ez kompatibilis a structured output-tal és megoldja a multi-típus problémát.

**Primary recommendation:** Prompt-driven adaptív kérdezés tool use-szal. A tool-ök (`classify_campaign`, `update_brief_state`) a szerveren futnak mint "virtual tools" (nem valódi API hívások, hanem state mutation-ök). Az agentic loop a chat route-on belül fut, a kliens csak text stream-et lát. Quick-reply gombok a szerver SSE-n keresztül küldött metaadatokból renderelődnek.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- A jelenlegi nyitó üzenet marad (cégnév kérdéssel indul, nem kampánytípus-választóval)
- A típusdetektálás a beszélgetés során történik organikusan, nem upfront
- Ha az érdeklődő nem ért egyet a felismert típussal: az AI újrakezdés nélkül vált típust, az eddig összegyűjtött adatokat megtartja ami releváns
- Tónus: baráti szakmai — tegező, közvetlen de professzionális, mint egy tapasztalt account manager
- Lezárás: az AI összefoglalja a briefet és megkérdezi "Ez így jó? Van még valami?" — csak utána zár
- Bármennyi típus kombinálható egyetlen briefben (mind a 4 is)
- Menet közben is hozzáadható új típus — ha az érdeklődő újat említ, az AI rugalmasan felveszi

### Claude's Discretion
- Típusmegerősítés módja és időzítése (explicit vs soft, hány válasz után)
- Visszakérdezés stratégia vékony válaszokra (kérdés fontossága alapján mérlegeli)
- Kérdések száma típusonként (típustól és válaszok mélységétől függően)
- Quick-reply gombok: mikor jelennek meg, technikai megvalósítás, kattintás viselkedés, szabad szöveg kezelés
- Multi-típus kérdéssorrend (szekvenciális vs kevert)
- Multi-típus összefoglaló struktúrája

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | ^0.74.0 | Tool use, streaming, structured output | Már telepítve Phase 1-ből. Tool use + streaming natívan támogatott. |
| zod | ^4.3.6 | Séma validáció, multi-típus brief séma | Már telepítve Phase 1-ből. `zodOutputFormat` kompatibilis a tool use `strict: true`-val is. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @anthropic-ai/sdk/helpers/zod | (part of SDK) | `zodOutputFormat()` helper | Structured output extraction híváshoz (brief összefoglaló) |

### Nincs Új Dependency
A Phase 2 **nem igényel új npm csomagot**. Minden a meglévő stack-kel megoldható:
- Tool use: Anthropic SDK natív
- Quick-reply gombok: egyedi React komponens (néhány button, semmi library)
- Prompt management: TypeScript string template-ek (megvan Phase 1-ből)

**Installation:**
```bash
# Nincs új telepítés szükséges
```

## Architecture Patterns

### Recommended Project Structure Changes
```
lib/
  schemas/
    brief-base.ts          # BriefBase — MÓDOSUL: campaign_types tömb
    campaign-types.ts       # CampaignTypeEnum — MARAD
    media-buying.ts         # MediaBuyingSpecific — MARAD (de standalone)
    performance.ts          # PerformanceSpecific — MARAD (de standalone)
    brand.ts               # BrandSpecific — MARAD (de standalone)
    social.ts              # SocialSpecific — MARAD (de standalone)
    brief-data.ts          # BriefDataSchema — MÓDOSUL: union → egyetlen schema
    index.ts               # Re-exports
  prompts/
    base.ts                # MÓDOSUL: tegező hang, account manager stílus
    types/                 # MARAD, de prompt-ok adaptálódnak
    compose.ts             # MÓDOSUL: dinamikus type-aware összeállítás
    extraction.ts          # MÓDOSUL: multi-típus extraction
    questioning.ts         # ÚJ: adaptív kérdezés stratégia prompt
    index.ts
  tools/                   # ÚJ mappa
    definitions.ts         # Tool definíciók (classify_campaign, update_brief)
    handlers.ts            # Tool execution logic (server-side)
    types.ts               # Tool input/output típusok
    index.ts
app/
  api/
    chat/
      route.ts             # MÓDOSUL: tool use loop + SSE metadata
types/
  chat.ts                  # MÓDOSUL: Message típus bővítés (quickReplies)
hooks/
  useChat.ts               # MÓDOSUL: quick-reply kezelés, SSE metadata parse
components/
  chat/
    ChatContainer.tsx       # MÓDOSUL: quick-reply gombok renderelés
    ChatMessage.tsx         # MARAD
    ChatInput.tsx           # MÓDOSUL: quick-reply kattintás → input
    QuickReplies.tsx        # ÚJ: quick-reply gombok komponens
```

### Pattern 1: Server-Side Agentic Loop within SSE Stream
**What:** Az API route egy agentic loop-ot futtat: streaming Claude hívás → ha `stop_reason === "tool_use"`, végrehajtja a tool-t szerveren → tool_result-tal folytatja → ezt ismétli amíg `stop_reason === "end_turn"`. A kliens az egész idő alatt csak text deltákat kap SSE-n keresztül.
**When to use:** Minden chat turn-nél ahol tool use engedélyezve van.
**Why this pattern:** A tool execution a szerveren történik (nincs kliens round-trip), a kliens SSE stream egyszerű marad, és a felhasználó folyamatos streaming szöveget lát.
**Example:**
```typescript
// Source: Anthropic Tool Use docs + Streaming docs (verified 2026-02-10)
// app/api/chat/route.ts

import Anthropic from "@anthropic-ai/sdk";
import { TOOL_DEFINITIONS } from "@/lib/tools";
import { handleToolExecution } from "@/lib/tools/handlers";
import { composeSystemPrompt } from "@/lib/prompts";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const { messages, briefState } = await request.json();

  const encoder = new TextEncoder();
  let currentBriefState = briefState || {};

  const readableStream = new ReadableStream({
    async start(controller) {
      let conversationMessages = [...messages];
      let continueLoop = true;

      while (continueLoop) {
        const stream = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: composeSystemPrompt(currentBriefState),
          messages: conversationMessages,
          tools: TOOL_DEFINITIONS,
          stream: true,
        });

        let textContent = "";
        let toolUseBlocks: Array<{id: string; name: string; input: unknown}> = [];
        let currentToolUse: {id: string; name: string; partialJson: string} | null = null;
        let stopReason = "";

        for await (const event of stream) {
          // Stream text deltas to client
          if (event.type === "content_block_delta") {
            if (event.delta.type === "text_delta") {
              textContent += event.delta.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              );
            }
            // Accumulate tool input JSON (NOT sent to client)
            if (event.delta.type === "input_json_delta") {
              if (currentToolUse) {
                currentToolUse.partialJson += event.delta.partial_json;
              }
            }
          }

          // Track content block starts for tool_use
          if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
            currentToolUse = {
              id: event.content_block.id,
              name: event.content_block.name,
              partialJson: "",
            };
          }

          // Complete tool_use block
          if (event.type === "content_block_stop" && currentToolUse) {
            toolUseBlocks.push({
              id: currentToolUse.id,
              name: currentToolUse.name,
              input: JSON.parse(currentToolUse.partialJson),
            });
            currentToolUse = null;
          }

          // Track stop reason
          if (event.type === "message_delta") {
            stopReason = event.delta.stop_reason || "";
          }
        }

        if (stopReason === "tool_use" && toolUseBlocks.length > 0) {
          // Build assistant message with content blocks
          const assistantContent: Array<unknown> = [];
          if (textContent) {
            assistantContent.push({ type: "text", text: textContent });
          }
          for (const tool of toolUseBlocks) {
            assistantContent.push({
              type: "tool_use",
              id: tool.id,
              name: tool.name,
              input: tool.input,
            });
          }

          // Execute tools server-side
          const toolResults = [];
          for (const tool of toolUseBlocks) {
            const result = handleToolExecution(tool.name, tool.input, currentBriefState);
            currentBriefState = result.updatedState;
            toolResults.push({
              type: "tool_result",
              tool_use_id: tool.id,
              content: JSON.stringify(result.output),
            });
          }

          // Send brief state update + quick replies to client
          if (currentBriefState) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ briefState: currentBriefState })}\n\n`)
            );
          }

          // Continue conversation with tool results
          conversationMessages = [
            ...conversationMessages,
            { role: "assistant", content: assistantContent },
            { role: "user", content: toolResults },
          ];

          // Reset for next iteration
          textContent = "";
          toolUseBlocks = [];
        } else {
          // end_turn — conversation complete for this turn
          continueLoop = false;
        }
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### Pattern 2: Virtual Tools (Server-Side State Mutation)
**What:** A tool-ök nem valódi külső API hívások — hanem szerver-oldali state mutation-ök. A `classify_campaign` tool a felismert típust rögzíti, az `update_brief` tool az összegyűjtött adatot frissíti. Mindkettő szinkron, in-process.
**When to use:** Amikor a tool execution nincs external API dependency — tisztán adat-manipuláció.
**Why this pattern:** Nincs hálózati latency, nincs timeout risk, és az LLM strukturált adatot ad (tool input) ahelyett hogy szabad szöveget parsolnánk.
**Example:**
```typescript
// lib/tools/definitions.ts
export const TOOL_DEFINITIONS = [
  {
    name: "classify_campaign",
    description: `Amikor felismerted a kampánytípus(oka)t az érdeklődő válaszaiból,
    használd ezt a tool-t a típus(ok) rögzítésére. Lehetséges típusok:
    media_buying (médiavásárlás), performance_ppc (performance/PPC),
    brand_awareness (brand/awareness), social_media (social media).
    Több típus is megadható egyszerre.`,
    input_schema: {
      type: "object",
      properties: {
        campaign_types: {
          type: "array",
          items: {
            type: "string",
            enum: ["media_buying", "performance_ppc", "brand_awareness", "social_media"],
          },
          description: "A felismert kampánytípus(ok)",
        },
        confidence: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Mennyire vagy biztos a típusfelismerésben",
        },
        reasoning: {
          type: "string",
          description: "Miért gondolod hogy ez(ek) a típus(ok) — rövid indoklás",
        },
      },
      required: ["campaign_types", "confidence"],
    },
  },
  {
    name: "update_brief",
    description: `Amikor az érdeklődő válaszából kinyertél konkrét brief adatot,
    használd ezt a tool-t az adat rögzítésére. Ne várd meg amíg minden adat megvan —
    minden értékes információt azonnal rögzíts ahogy elhangzik.`,
    input_schema: {
      type: "object",
      properties: {
        field: {
          type: "string",
          description: "Melyik mező frissüljön (pl. 'company_name', 'campaign_goal', 'media_specific.grp_target')",
        },
        value: {
          type: "string",
          description: "A mező új értéke",
        },
      },
      required: ["field", "value"],
    },
  },
];

// lib/tools/handlers.ts
interface ToolResult {
  output: unknown;
  updatedState: BriefState;
}

export function handleToolExecution(
  toolName: string,
  input: unknown,
  currentState: BriefState
): ToolResult {
  switch (toolName) {
    case "classify_campaign": {
      const { campaign_types, confidence } = input as ClassifyCampaignInput;
      return {
        output: {
          status: "ok",
          message: `Típus(ok) rögzítve: ${campaign_types.join(", ")}`
        },
        updatedState: {
          ...currentState,
          detectedTypes: campaign_types,
          typeConfidence: confidence,
        },
      };
    }
    case "update_brief": {
      const { field, value } = input as UpdateBriefInput;
      // Deep set the field in brief data
      const updatedBrief = deepSet(currentState.briefData || {}, field, value);
      return {
        output: { status: "ok", message: `${field} frissítve` },
        updatedState: {
          ...currentState,
          briefData: updatedBrief,
        },
      };
    }
    default:
      return {
        output: { status: "error", message: `Ismeretlen tool: ${toolName}` },
        updatedState: currentState,
      };
  }
}
```

### Pattern 3: Multi-Type Brief Schema
**What:** A jelenlegi `discriminatedUnion` egy-típusú brief-et támogat. Multi-típushoz egyetlen, egyesített sémát használunk `campaign_types: z.array(...)` tömbbel és opcionális típusspecifikus blokkokkal.
**When to use:** A BriefData séma újradefiniálásakor.
**Why this pattern:** A `discriminatedUnion` nem támogat multi-value discriminator-t. Az array + opcionális blokkok flexibilisek és a structured output is támogatja.
**Example:**
```typescript
// lib/schemas/brief-data.ts — ÚJ VERZIÓ
import { z } from "zod";
import { CampaignTypeEnum } from "./campaign-types";
import { BriefBaseSchema } from "./brief-base";
import { MediaSpecificSchema } from "./media-buying";
import { PerformanceSpecificSchema } from "./performance";
import { BrandSpecificSchema } from "./brand";
import { SocialSpecificSchema } from "./social";

export const BriefDataSchema = BriefBaseSchema.extend({
  campaign_types: z.array(CampaignTypeEnum)
    .min(1)
    .describe("Kampánytípus(ok) — egy vagy több"),
  media_specific: MediaSpecificSchema.optional()
    .describe("Médiavásárlás specifikus adatok (ha campaign_types tartalmazza a media_buying-ot)"),
  performance_specific: PerformanceSpecificSchema.optional()
    .describe("Performance/PPC specifikus adatok (ha campaign_types tartalmazza a performance_ppc-t)"),
  brand_specific: BrandSpecificSchema.optional()
    .describe("Brand/awareness specifikus adatok (ha campaign_types tartalmazza a brand_awareness-t)"),
  social_specific: SocialSpecificSchema.optional()
    .describe("Social media specifikus adatok (ha campaign_types tartalmazza a social_media-t)"),
});

export type BriefData = z.infer<typeof BriefDataSchema>;
```

### Pattern 4: Quick-Reply Buttons via SSE Metadata
**What:** A szerver az SSE stream-en keresztül quick-reply opciókat küld a szöveges válasz mellett. A kliens ezeket gombokként rendereli.
**When to use:** Amikor az AI kérdésére előre definiált válaszlehetőségek adhatók.
**Why this pattern:** Nincs külön API endpoint szükséges, a quick-reply opciók a válasszal együtt érkeznek és kontextuálisan relevánsak. Az AI dönti el mikor ajánl quick-reply-okat (tool use-szal vagy a prompt alapján).
**Example:**
```typescript
// SSE data format — szerver oldalon
controller.enqueue(
  encoder.encode(`data: ${JSON.stringify({
    quickReplies: [
      { label: "Facebook & Instagram", value: "Facebook és Instagram" },
      { label: "Google Ads", value: "Google Ads" },
      { label: "TV + Online", value: "TV és online display" },
      { label: "Egyéb", value: null }, // null = free text input
    ]
  })}\n\n`)
);

// Kliens oldalon — QuickReplies.tsx
interface QuickReply {
  label: string;
  value: string | null;
}

function QuickReplies({
  options,
  onSelect,
  disabled
}: {
  options: QuickReply[];
  onSelect: (value: string | null) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-3">
      {options.map((option) => (
        <button
          key={option.label}
          onClick={() => onSelect(option.value)}
          disabled={disabled}
          className="px-4 py-2 rounded-xl border border-roi-orange/30
                     text-roi-orange text-sm font-medium
                     hover:bg-roi-orange/10 hover:border-roi-orange/60
                     transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

### Pattern 5: Prompt-Based Adaptive Questioning
**What:** A system prompt tartalmazza a kérdezési stratégiát: nagy kép először, aztán részletek; visszakérdezés vékony válaszokra; skip ha már elhangzott. A prompt a brief state-et is megkapja, így tudja mit kérdezett már.
**When to use:** A system prompt összeállításánál minden chat turn-ben.
**Why this pattern:** A kérdezés logikáját a prompt vezérli (nem hardcoded kérdéslista), mert az AI jobban alkalmazkodik a beszélgetés menetéhez mint bármilyen determinisztikus flow.
**Example:**
```typescript
// lib/prompts/questioning.ts
export function buildQuestioningStrategy(briefState: BriefState): string {
  const collectedFields = Object.keys(briefState.briefData || {}).filter(
    k => briefState.briefData[k] !== undefined && briefState.briefData[k] !== ""
  );
  const detectedTypes = briefState.detectedTypes || [];

  return `
KÉRDEZÉSI STRATÉGIA:

Eddig összegyűjtött adatok: ${collectedFields.length > 0 ? collectedFields.join(", ") : "még semmi"}
Felismert típus(ok): ${detectedTypes.length > 0 ? detectedTypes.join(", ") : "még nem ismert"}

MEGKÖZELÍTÉS:
1. Először a nagy képet értsd meg: mi a cég, mi a cél, mi az üzenet
2. Ha van elég infó a típusfelismeréshez, használd a classify_campaign tool-t
3. Típusmegerősítés után kérdezd a típusspecifikus kérdéseket
4. Ha az érdeklődő válasza vékony (1-2 szavas), kérdezz vissza — de csak ha a kérdés fontos
5. Amit már megtudtál, ne kérdezd újra
6. Minden válaszból ami releváns adatot tartalmaz, használd az update_brief tool-t

TÍPUSMEGERŐSÍTÉS:
- Ha magabiztosan felismerted a típust (high confidence): említsd természetesen a válaszodban
  Példa: "Értem, szóval egy performance kampányról van szó. Ezen a területen a legfontosabb kérdés..."
- Ha bizonytalan (medium/low): kérdezz rá finoman
  Példa: "Ez alapján inkább médiavásárlásra gondolsz, vagy performance kampányt terveztek?"
- Ha az érdeklődő javít: ne ismételd a hibát, fogadd el és folytasd az új típussal

LEZÁRÁS:
Amikor úgy érzed minden fontos kérdést megbeszéltétek:
1. Foglald össze a briefet természetesen (nem JSON, hanem olvasható szöveg)
2. Kérdezd meg: "Ez így jó? Van még valami amit hozzátennél?"
3. Csak a megerősítés után zárd le (extractBrief jelzés)
`;
}
```

### Anti-Patterns to Avoid
- **Tool result küldése a kliensnek:** A tool_use és tool_result blokkok NEM mehetnek a kliensre SSE-n. A kliens csak `text`, `briefState`, `quickReplies` és `[DONE]` event-eket kaphat.
- **Kliens-oldali tool execution:** A tool loop a szerveren fut. Kliens round-trip tool execution-höz lassú és komplex lenne.
- **Fix kérdéslista:** Ne implementálj fix sorrendű kérdéslistát. A prompt vezérli a kérdezést, nem kód.
- **Campaign type upfront választó:** A felhasználói döntés szerint a típusfelismerés organikusan történik, nem dropdown/radio-val.
- **Külön API endpoint tool-oknak:** Egy chat route kezel mindent, a tool loop benne van.
- **Quick-reply generálás kliens oldalon:** A quick-reply opciók a szerveren generálódnak (az AI kontextusában) és SSE-n jönnek.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tool input parsing streaming-ben | Saját JSON parser partial input-hoz | Anthropic SDK `input_json_delta` accumulation + `content_block_stop` parse | A partial JSON parsing komplex, az SDK event-ek megmondják mikor teljes |
| Tool execution loop | Saját rekurzív Promise chain | While loop `stop_reason` check-kel (Pattern 1) | Egyszerű, debuggolható, nincs stack overflow risk |
| Brief state management | Custom Redux-szerű store | Egyszerű object spread + deepSet helper | A brief state egy egyszerű nested object, nincs szükség framework-re |
| Quick-reply UI | Harmadik féles chat UI library | Saját button komponens (10 sor JSX) | Minimális UI, nem ér meg dependency-t |
| Conversation history management | Kliens-oldali history rebuilding tool blokkokkal | Szerver oldali "clean history" (csak user/assistant text) | A kliens nem látja a tool_use/tool_result blokkokat |

**Key insight:** A Phase 2 nem igényel új dependency-t. Az Anthropic SDK tool use + streaming natívan támogatott, és a quick-reply gombok triviális UI komponensek.

## Common Pitfalls

### Pitfall 1: Tool Use Blocks Leaking to Client SSE
**What goes wrong:** A streaming response tool_use content block-jai (JSON input) megjelennek a kliens SSE stream-ben mint szöveges tartalom, és a felhasználó JSON-t lát a chatben.
**Why it happens:** Az SSE handler nem szűri ki a tool_use blokkok deltaját, és mindent egységesen text-ként kezel.
**How to avoid:** A streaming event handler-ben külön kell kezelni a `content_block_start` event-et: ha `type === "tool_use"`, akkor az `input_json_delta`-kat NEM szabad az SSE-re küldeni, hanem akkumulálni és a `content_block_stop`-nál parsolni.
**Warning signs:** A felhasználó `{"campaign_types":["performance_ppc"]...}` szöveget lát a chatben.

### Pitfall 2: Infinite Agentic Loop
**What goes wrong:** Az AI folyamatosan tool-okat hív anélkül hogy text-et generálna, és a stream soha nem ér véget.
**Why it happens:** A tool execution loop nem kap max iteration limitet, vagy a tool result triggerel újabb tool hívást végtelen ciklusban.
**How to avoid:** Max 5-10 iteráció a while loop-ban. Ha elérte a limitet, kényszerített `end_turn`. A tool result-ok legyenek egyértelműek ("státusz: ok, folytasd a kérdezést").
**Warning signs:** A streaming válasz timeout-ol, a felhasználó hosszú ideig "Gondolkodik..." üzenetet lát.

### Pitfall 3: Multi-Type Schema és Extraction Inkonzisztencia
**What goes wrong:** A structured output extraction más sémát használ mint amit a tool use state épít, és az extraction result felülírja a tool use-szal gyűjtött adatokat.
**Why it happens:** Két párhuzamos adatgyűjtési mechanizmus (tool use + extraction) nem szinkronizált.
**How to avoid:** Az extraction hívás kapja meg a tool use-szal gyűjtött state-et is context-ként, és ENRICH-elje azt, ne felülírja. Vagy: az extraction CSAK a tool use state-et formázza Zod sémára (nincs újra-gyűjtés).
**Warning signs:** A brief summary-ban hiányoznak adatok amiket a felhasználó korábban mondott.

### Pitfall 4: Quick-Reply Gomb Állapot Rossz Timing-gal
**What goes wrong:** A quick-reply gombok megjelennek mielőtt az AI üzenete teljesen befejeződne, vagy a gombok nem tűnnek el válasz után.
**Why it happens:** A `quickReplies` SSE event a text stream közben jön, nem utána.
**How to avoid:** A quick-reply opciókat a stream végén (de `[DONE]` előtt) küldje a szerver. A kliens a `quickReplies`-t a streaming befejezése után rendereli, és az első user input (akár gomb, akár szabad szöveg) eltünteti.
**Warning signs:** Gombok villognak, vagy a felhasználó az üzenet közepén kattint rájuk.

### Pitfall 5: Tegező ↔ Magázó Inkonzisztencia
**What goes wrong:** A Phase 1 base prompt magázó stílust ad meg ("Ön, Önök"), de a Phase 2 context tegező stílust kér. Az AI összekeveri a kettőt.
**Why it happens:** A base prompt nem frissül a Phase 2 döntéseknek megfelelően.
**How to avoid:** A base prompt-ot frissíteni kell: tegező, közvetlen, baráti szakmai hang. A bemutatkozás is tegező legyen. Ez a Phase 2 egyik locked decision-je.
**Warning signs:** Az AI egy üzenetben "Te" és "Ön" formát is használ.

### Pitfall 6: BriefState Elvész Kliens-Szerver Között
**What goes wrong:** A briefState objektum nem jut el a klienstől a szerverhez a következő turn-ben, és az AI "elfelejti" a korábban felismert típust.
**Why it happens:** A kliens nem tárolja és nem küldi vissza a briefState-et a `/api/chat` hívásban.
**How to avoid:** A `useChat` hook tárolja a briefState-et (useState), és minden sendMessage hívásban elküldi a body-ban. A szerver a briefState-et a system prompt-ba és a tool context-be is beépíti.
**Warning signs:** Az AI többször kérdezi a kampánytípust, vagy "elfelejti" a korábban gyűjtött adatokat.

## Code Examples

### Streaming Tool Use Event Handling (Verified)
```typescript
// Source: https://platform.claude.com/docs/en/build-with-claude/streaming
// Streaming response with tool use — event sequence:
//
// 1. message_start: {message: {content: [], stop_reason: null}}
// 2. content_block_start: {index: 0, content_block: {type: "text", text: ""}}
// 3. content_block_delta*: {index: 0, delta: {type: "text_delta", text: "..."}}
// 4. content_block_stop: {index: 0}
// 5. content_block_start: {index: 1, content_block: {type: "tool_use", id: "toolu_...", name: "classify_campaign", input: {}}}
// 6. content_block_delta*: {index: 1, delta: {type: "input_json_delta", partial_json: "..."}}
// 7. content_block_stop: {index: 1}
// 8. message_delta: {delta: {stop_reason: "tool_use"}}
// 9. message_stop

// Text + tool_use can appear in the SAME streaming response.
// stop_reason: "tool_use" signals the server should execute the tool.
// stop_reason: "end_turn" signals normal conversation end.
```

### Tool Result Format (Verified)
```typescript
// Source: https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use
// After tool execution, the tool result is sent back as a user message:
const toolResultMessage = {
  role: "user",
  content: [
    {
      type: "tool_result",
      tool_use_id: "toolu_01A09q90qw90lq917835lq9",
      content: JSON.stringify({ status: "ok", campaign_types: ["performance_ppc"] }),
    },
    // Multiple tool results in single user message for parallel tool use
  ],
};
// IMPORTANT: tool_result blocks must come FIRST in the content array.
// Any text must come AFTER all tool results.
```

### Quick-Reply Integration in useChat Hook
```typescript
// hooks/useChat.ts — kiegészítés
const [quickReplies, setQuickReplies] = useState<QuickReply[] | null>(null);

// SSE processing-ben:
if (parsed.quickReplies) {
  setQuickReplies(parsed.quickReplies);
}
if (parsed.briefState) {
  setBriefState(parsed.briefState);
}

// Quick-reply kattintáskor:
const handleQuickReply = (value: string | null) => {
  setQuickReplies(null); // Gombok eltűnnek
  if (value) {
    sendMessage(value); // Előre definiált válasz
  } else {
    // null = "Egyéb" — fókusz az input mezőre
    inputRef.current?.focus();
  }
};
```

## Discretion Recommendations

### Típusmegerősítés Módja és Időzítése
**Recommendation: Soft confirmation, 2-3 válasz után**
- Az AI az első 2-3 válaszból (cégnév, kampány célja, akár utalás a csatornákra) felismeri a típust
- Soft confirmation: természetesen beleszövi a válaszba ("Értem, szóval egy performance kampányra gondolsz...")
- NEM explicit "Te ezt választottad: Performance/PPC" — hanem organikus
- Ha `confidence: "high"` → soft mention; ha `"medium"` → direkt rákérdezés
- `classify_campaign` tool a háttérben fut, a felhasználó nem látja

### Visszakérdezés Stratégia
**Recommendation: Fontossággal súlyozott**
- Kritikus mezők (kampány cél, célcsoport, büdzsé): MINDIG visszakérdez ha vékony a válasz
- Opcionális mezők (dayparting, viewability): elfogadja a rövid választ, nem nyomul
- Visszakérdezés formája: "Ezt egy kicsit ki tudnád fejteni?" / "Például milyen [konkrétum]-ra gondolsz?"
- Max 1 visszakérdezés per mező — ha másodszor is rövid, elfogadja

### Kérdések Száma Típusonként
**Recommendation: 8-15 kérdés típusonként, válaszmélységtől függően**
- Base kérdések (minden típushoz): ~5-7 (cégnév, iparág, cél, célcsoport, büdzsé, timing, versenytársak)
- Típusspecifikus kérdések: ~3-6 (a prompt modul tartalmazza)
- Ha az érdeklődő bőbeszédű és több kérdést is megválaszol egyszerre: kevesebb kérdés
- Ha szűkszavú: több, de rövidebb kérdések

### Quick-Reply Gombok
**Recommendation: Zárt kérdéseknél, kattintás = azonnali küldés**
- **Mikor jelennek meg:** Zárt kérdéseknél ahol ésszerű opciók adhatók (pl. platformok, médiatípusok, igen/nem)
- **Nem jelennek meg:** Nyitott kérdéseknél (kampány célja, kreatív koncepció leírása)
- **Kattintás viselkedés:** Kattintás = azonnali küldés (nem tölti be az input mezőbe)
- **Szabad szöveg:** A gombok mellett az input mező mindig elérhető — nem kell gombot nyomni
- **Eltűnés:** A gombok eltűnnek amint a felhasználó válaszol (akár gombbal, akár szöveggel)
- **Technikai:** Az AI maga generálja a prompt alapján, SSE metadata-ként küldi, NEM tool use

### Multi-Típus Kérdéssorrend
**Recommendation: Szekvenciális, természetes átmenettel**
- Először az általános kérdések (base)
- Aztán az első felismert típus specifikus kérdései
- Ha közben kiderül egy második típus → "Rendben, a social media részhez is lesznek kérdéseim, de előbb fejezzük be a performance részt"
- Típus váltásnál rövid átvezetés: "Remek, a performance rész kész. Most nézzük a social media kampányt!"

### Multi-Típus Összefoglaló Struktúrája
**Recommendation: Típusonként csoportosított, közös rész kiemelve**
```
Összefoglaló:
- Cég: [cégnév], [iparág]
- Kampánytípusok: Performance/PPC + Social Media
- Közös cél: [kampány cél]
- Célcsoport: [célcsoport]
- Büdzsé: [büdzsé keret]
- Időzítés: [mikor]

Performance/PPC:
- ROAS cél: [...]
- Konverziók: [...]
- Landing page: [...]

Social Media:
- Platformok: [...]
- Tartalom típusok: [...]
- Influencer: [...]
```

## State of the Art

| Old Approach (Phase 1) | New Approach (Phase 2) | Impact |
|-------------------------|------------------------|--------|
| Streaming chat CSAK text | Streaming chat + server-side tool use loop | AI strukturáltan gyűjt adatot, nem szabad szövegből parse-ol |
| `discriminatedUnion` (1 típus) | Flat schema `campaign_types` array-vel | Multi-típus brief támogatás |
| `composeSystemPrompt(types)` statikus | Dinamikus prompt briefState-tel | AI tudja mit kérdezett már, merre tartson |
| `extractBrief: true` flag explicit | Automatikus extraction a lezáráskor | Az AI dönti el mikor kész, nem a felhasználó kattint |
| Magázó bemutatkozás | Tegező, account manager stílus | Természetesebb, barátságosabb UX |
| Nincs quick-reply | SSE metadata quick-reply gombok | Gyorsabb kitöltés zárt kérdéseknél |
| `campaignTypes` kliens param | `briefState` szerver-oldali tracking | Az AI tool use-szal építi a state-et, nincs kliens-szerver desync |

## Open Questions

1. **BriefState perzisztencia**
   - What we know: A briefState a szerveren épül (tool use), de a kliensnek is szüksége van rá (UI state). A jelenlegi rendszerben nincs szerver-oldali session storage.
   - What's unclear: Hogyan tároljuk a briefState-et request-ek között? Opcók: (a) kliens tárolja és visszaküldi minden request-ben, (b) szerver-oldali in-memory Map session ID-vel, (c) cookie/header.
   - Recommendation: **(a) kliens tárolja és visszaküldi** — KISS, nincs szerver state management szükség. A briefState mérete kicsi (<5KB). A `useChat` hook `briefState` useState-je tökéletes erre. A conversation messages-ben amúgy is benne van minden (a tool_use/tool_result history), szóval a briefState rebuildelése a messages-ből is lehetséges.

2. **Tool Use Token Cost**
   - What we know: Tool use hozzáad ~346 token system prompt overhead-et (auto `tool_choice`). Plusz a tool definíciók token cost-ja.
   - What's unclear: Mennyivel növeli ez a per-turn cost-ot, és mennyire érzékeny erre a büdzsé.
   - Recommendation: A 2 tool definíció (<500 token) + 346 overhead minimális. Egy tipikus brief ~10-15 turn, ami ~15K-20K input token. Ez claude-sonnet-4 árazással (2026-02 árak) ~$0.06-0.10 per brief. Nem blocker.

3. **Extraction vs Tool Use Adatgyűjtés Dual Path**
   - What we know: A tool use (`update_brief`) turn-by-turn gyűjt adatot. Az extraction hívás (`messages.parse()` + `zodOutputFormat`) a teljes beszélgetésből kinyeri az adatot.
   - What's unclear: Van-e mindkettőre szükség, vagy a tool use-szal gyűjtött state elég a végső brief-hez?
   - Recommendation: **Mindkettő.** A tool use a "working state" — gyors, inkrementális. Az extraction a "final validation" — Zod sémával validált, teljes. A brief lezárásakor az extraction hívás a tool use state-et context-ként kapja és finalizálja. Ez az adatminőség biztosítéka.

## Sources

### Primary (HIGH confidence)
- [Anthropic Tool Use Overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) — tool definition, stop_reason "tool_use", multi-turn conversation, parallel tool use
- [Anthropic Streaming Messages](https://platform.claude.com/docs/en/build-with-claude/streaming) — event types, content_block_start/delta/stop, tool_use streaming example (text + tool_use in same response verified), input_json_delta
- [Anthropic Implement Tool Use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use) — tool_result format, parallel tool results, agentic loop, tool runner SDK (beta), strict: true
- [Existing codebase analysis](/Users/biroroland/roi-brief) — all source files read: route.ts, useChat.ts, schemas/*, prompts/*, components/chat/*
- [Phase 1 Research](/Users/biroroland/roi-brief/.planning/phases/01-type-system-foundation/01-RESEARCH.md) — Zod séma pattern, dual-call pattern, SDK version decisions

### Secondary (MEDIUM confidence)
- [Anthropic SDK TypeScript tool runner (beta)](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/helpers.md#tool-helpers) — `betaZodTool()`, `toolRunner()` API (beta, referenced in docs)
- [Shadcn AI Chatbot](https://www.shadcn.io/blocks/ai-chatbot) — suggestion pills pattern for chat UI

### Tertiary (LOW confidence)
- Quick-reply button UX patterns — based on common chat UI conventions, not verified from a single authoritative source. Recommendation needs validation through user testing.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new dependencies, tool use API fully verified in official docs with streaming examples
- Architecture: HIGH — Server-side agentic loop pattern verified in Anthropic docs (tool runner implements this pattern), streaming event sequence confirmed with real SSE examples
- Pitfalls: HIGH — Based on direct streaming event analysis and Phase 1 experience (dual-call pattern already proven)
- Discretion areas: MEDIUM — Recommendations based on UX patterns and domain knowledge, not A/B tested

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (30 days — stable stack, no fast-moving dependencies)
