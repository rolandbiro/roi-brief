# Architecture Patterns

**Domain:** Adaptive AI questioning system with dynamic data schemas and flexible report generation
**Researched:** 2026-02-10

## Current Architecture (What We're Refactoring)

```
User -> [ChatInput] -> useChat hook -> /api/chat -> Claude API (single system prompt)
                                                         |
                                                    Streams text + BRIEF_JSON_START/END tags
                                                         |
                          useChat.checkForBriefData() <- parses JSON from streamed text
                                                         |
                          BriefEditor (fixed fields) -> /api/send-brief -> PDF + Email
```

**Core problems:**
1. `lib/prompts.ts` is a single monolithic prompt with fixed 13-field sequence
2. `types/chat.ts` has one rigid `BriefData` interface for all campaign types
3. `BriefEditor` renders all sections unconditionally
4. `pdf-template.tsx` and `email-template.ts` have hardcoded sections
5. JSON extraction uses brittle `BRIEF_JSON_START/END` regex tags in streamed text

## Recommended Architecture

### High-Level System Flow

```
User enters chat (no PDF upload)
        |
   [1. Discovery Phase]
   System prompt: generic opener + type detection instructions
   Claude asks 2-3 broad questions (industry, goal, budget range)
        |
   [2. Type Classification]
   Claude calls `classify_campaign` tool -> returns detected type(s)
   Server injects type-specific prompt segments
        |
   [3. Adaptive Questioning Phase]
   System prompt: base + type-specific question modules
   Claude asks deep questions based on campaign type(s)
   Each answer triggers `update_brief` tool with partial data
        |
   [4. Brief Assembly]
   Server accumulates structured data from tool calls
   Claude signals completion -> final brief assembled from tool data
        |
   [5. Dynamic Report]
   BriefEditor renders only sections present in accumulated data
   PDF/email templates compose from section registry
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Prompt Registry** (`lib/prompts/`) | Stores base prompt + type-specific modules, composes final system prompt from detected types | Chat API route |
| **Campaign Type Definitions** (`lib/campaign-types/`) | Defines question sets, field schemas, report sections per type (media, PPC, brand, social) | Prompt Registry, Schema system, Report system |
| **Chat API Route** (`app/api/chat/`) | Orchestrates Claude calls with tools, manages prompt composition, handles tool execution | Claude API, Prompt Registry, Brief State |
| **Tool Definitions** (`lib/tools/`) | Defines `classify_campaign` and `update_brief` tools with Zod schemas for structured output | Chat API Route |
| **Brief State Manager** (`hooks/useBrief.ts`) | Accumulates partial brief data from tool calls, tracks completion status, manages type state | Chat hook, Editor, Report |
| **Dynamic Editor** (`components/BriefEditor.tsx`) | Renders editable form sections based on which data fields exist in the brief | Brief State Manager |
| **Report Generator** (`lib/report/`) | Composes PDF sections and email sections from a section registry based on brief data shape | Campaign Type Definitions, Brief State |

### Data Flow (Detailed)

```
[Client]                    [Server /api/chat]              [Claude API]
   |                              |                              |
   |-- POST {messages} ---------> |                              |
   |                              |-- Compose system prompt:     |
   |                              |   base + type modules        |
   |                              |-- messages + tools --------> |
   |                              |                              |
   |                              | <-- stream: text + tool_use  |
   |                              |                              |
   | <-- SSE: text chunks ------- |                              |
   |                              |                              |
   |                              |-- If tool_use: execute tool  |
   |                              |   classify_campaign:         |
   |                              |     -> store type in session |
   |                              |     -> recompose prompt      |
   |                              |   update_brief:              |
   |                              |     -> merge partial data    |
   |                              |     -> return to Claude      |
   |                              |                              |
   | <-- SSE: {tool_result} ----- |                              |
   |     + brief_update event     |                              |
   |                              |                              |
   |-- Update useBrief state      |                              |
```

**Critical insight:** The server acts as tool executor. When Claude decides to call `update_brief`, the server extracts structured data and sends it back as a `tool_result`. The client receives both the text stream (for chat UI) AND structured data events (for brief accumulation).

## Patterns to Follow

### Pattern 1: Modular Prompt Composition

**What:** Break the monolithic system prompt into a base module + composable type-specific modules. The server composes the final prompt dynamically based on detected campaign type(s).

**When:** Every Claude API call. The system prompt changes as types are detected.

**Why:** A single prompt for all types either gets too long (confusing the model) or too generic (missing domain depth). Modular composition lets each type define its own expert-level questions while sharing the common brief structure.

**Example:**

```typescript
// lib/prompts/base.ts
export const BASE_PROMPT = `Te a ROI Works marketing ügynökség brief asszisztense vagy...
[communication style, general rules]`;

// lib/prompts/types/media-buying.ts
export const MEDIA_BUYING_MODULE = `
MÉDIAVÁSÁRLÁS SPECIFIKUS KÉRDÉSEK:
Amikor médiavásárlási kampányról van szó, az alábbi területeket kérdezd ki:
- Célzott GRP (Gross Rating Point)
- Elvárt reach és frequency
- Médiatípusok preferenciája (TV, rádió, outdoor, digital)
- OTS (Opportunity To See) target
- Viewability elvárások
- Adblock penetráció relevanciája
...`;

// lib/prompts/compose.ts
export function composeSystemPrompt(
  detectedTypes: CampaignType[]
): string {
  const typeModules = detectedTypes
    .map(type => TYPE_MODULES[type])
    .join('\n\n');

  return `${BASE_PROMPT}\n\n${typeModules}\n\n${TOOL_INSTRUCTIONS}`;
}
```

**Confidence:** HIGH -- This is the standard modular prompt architecture pattern, verified across multiple sources (PromptLayer blog, Anthropic docs patterns).

### Pattern 2: Claude Tool Use for Structured Data Extraction

**What:** Replace the brittle `BRIEF_JSON_START/END` tag parsing with Claude's native tool use. Define `classify_campaign` and `update_brief` tools with strict Zod schemas. Claude calls these tools naturally during conversation, producing guaranteed-valid structured output.

**When:** Throughout the conversation. Claude calls `classify_campaign` after initial discovery, and `update_brief` incrementally as it gathers information.

**Why:**
1. Tag-based extraction (`BRIEF_JSON_START/END`) is fragile -- partial JSON in streamed responses causes parse failures
2. Tool use with `strict: true` guarantees schema-compliant output via Anthropic's constrained decoding
3. Incremental `update_brief` calls capture data as it's gathered, not just at the end
4. Claude naturally decides WHEN to capture data vs. when to keep asking

**Example:**

```typescript
// lib/tools/classify-campaign.ts
import { z } from 'zod';

export const CampaignTypeSchema = z.object({
  primary_type: z.enum(['media_buying', 'performance', 'brand', 'social']),
  secondary_types: z.array(
    z.enum(['media_buying', 'performance', 'brand', 'social'])
  ),
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string(),
});

export const classifyCampaignTool = {
  name: 'classify_campaign',
  description: 'Classify the campaign type based on conversation so far. Call this after the first 2-3 questions when you understand the campaign nature.',
  strict: true,
  input_schema: zodToJsonSchema(CampaignTypeSchema),
};

// lib/tools/update-brief.ts
export const UpdateBriefSchema = z.object({
  section: z.enum([
    'company', 'campaign_basics', 'target_audience',
    'channels', 'timeline', 'budget', 'competitors',
    'media_specifics', 'performance_specifics',
    'brand_specifics', 'social_specifics', 'notes'
  ]),
  data: z.record(z.string(), z.unknown()),
});

export const updateBriefTool = {
  name: 'update_brief',
  description: 'Save gathered brief data for a specific section. Call this when you have confirmed data for a section. Can be called multiple times.',
  strict: true,
  input_schema: zodToJsonSchema(UpdateBriefSchema),
};
```

**Confidence:** HIGH -- Anthropic structured outputs with `strict: true` are GA, Zod integration is officially supported in the TypeScript SDK via `zodOutputFormat()`. Streaming is compatible with tool use.

### Pattern 3: Discriminated Union for Campaign-Specific Data

**What:** Use TypeScript discriminated unions to model campaign-type-specific brief data. A `BriefData` type has shared fields (company, timeline, budget) plus type-specific extension fields gated by a `campaign_types` discriminant.

**When:** Type definitions, editor rendering, report generation.

**Why:** The current flat `BriefData` interface cannot represent "media buying has GRP fields but PPC doesn't." Discriminated unions let TypeScript narrow the type at compile time, preventing impossible field access and guiding editor/report rendering.

**Example:**

```typescript
// types/brief.ts

// Shared across all campaign types
interface BriefBase {
  company: CompanyInfo;
  campaign_basics: CampaignBasics;
  target_audience: TargetAudience;
  channels: string[];
  timeline: Timeline;
  budget: Budget;
  competitors: string[];
  notes: string;
}

// Type-specific extensions
interface MediaBuyingFields {
  grp_target: string;
  reach_target: string;
  frequency_target: string;
  media_types: string[];
  ots_target: string;
  viewability_requirements: string;
}

interface PerformanceFields {
  landing_pages: string[];
  ad_accounts: string[];
  conversion_tracking: string;
  roas_target: string;
  cpa_target: string;
  creative_timeline: string;
}

interface BrandFields {
  brand_lift_goals: string;
  message_recall_target: string;
  creative_concept: string;
  tonality: string;
  positioning: string;
}

interface SocialFields {
  organic_paid_mix: string;
  platforms: string[];
  content_types: string[];
  community_management: string;
  influencer_strategy: string;
}

// The actual brief type -- supports multi-type campaigns
interface BriefData extends BriefBase {
  campaign_types: CampaignType[];
  type_specific: {
    media_buying?: Partial<MediaBuyingFields>;
    performance?: Partial<PerformanceFields>;
    brand?: Partial<BrandFields>;
    social?: Partial<SocialFields>;
  };
}
```

**Why `Partial<>` + optional keys instead of discriminated union:** A brief is built incrementally during conversation. Fields arrive piece by piece. A strict discriminated union would require all fields or nothing. `Partial<>` + optional type-specific blocks lets us accumulate data progressively AND support multi-type campaigns (one brief covering both media buying and performance).

**Confidence:** HIGH -- TypeScript discriminated unions are a well-documented pattern. The `Partial<>` approach for incremental accumulation is a practical adaptation.

### Pattern 4: Section Registry for Dynamic Reports

**What:** Define a registry mapping section keys to their render functions (for both PDF and email). The report generator iterates over sections present in the brief data and renders only those.

**When:** PDF generation, email template generation, BriefEditor rendering.

**Why:** The current `pdf-template.tsx` and `email-template.ts` have hardcoded sections. Adding a new campaign type would require modifying every template. A section registry decouples "what sections exist" from "how sections render."

**Example:**

```typescript
// lib/report/section-registry.ts
interface SectionRenderer {
  key: string;
  label: string;
  order: number;
  appliesTo: CampaignType[] | 'all';
  renderPdf: (data: Record<string, unknown>) => React.ReactElement;
  renderEmail: (data: Record<string, unknown>) => string;
  renderEditor: (data: Record<string, unknown>, onChange: UpdateFn) => React.ReactElement;
}

const SECTION_REGISTRY: SectionRenderer[] = [
  {
    key: 'company',
    label: 'Cegadatok',
    order: 1,
    appliesTo: 'all',
    renderPdf: (data) => <CompanySectionPdf data={data} />,
    renderEmail: (data) => companyEmailHtml(data),
    renderEditor: (data, onChange) => <CompanySectionEditor data={data} onChange={onChange} />,
  },
  {
    key: 'media_specifics',
    label: 'Mediavásárlás részletek',
    order: 10,
    appliesTo: ['media_buying'],
    renderPdf: (data) => <MediaSpecificsPdf data={data} />,
    // ...
  },
  // ...
];

// Usage: filter applicable sections for this brief
function getSectionsForBrief(brief: BriefData): SectionRenderer[] {
  return SECTION_REGISTRY
    .filter(section =>
      section.appliesTo === 'all' ||
      section.appliesTo.some(type => brief.campaign_types.includes(type))
    )
    .filter(section => {
      // Only show if data exists for this section
      const sectionData = getSectionData(brief, section.key);
      return sectionData && Object.keys(sectionData).length > 0;
    })
    .sort((a, b) => a.order - b.order);
}
```

**Confidence:** MEDIUM -- This is a standard registry/strategy pattern applied to React rendering. No library-specific concerns, but the exact interface will need iteration based on how `@react-pdf/renderer` handles conditional Page elements (known issue: conditional rendering can cause `Eo is not a function` errors in some versions).

### Pattern 5: Server-Side Tool Execution with Client-Side Data Streaming

**What:** The `/api/chat` route handles Claude tool calls server-side and streams BOTH text content AND structured data events to the client via SSE. The client receives two types of events: `text` (for chat UI) and `brief_update` (for data accumulation).

**When:** Every chat API call where Claude uses tools.

**Why:**
- Tool execution must happen server-side (Claude expects `tool_result` in the conversation)
- But the client needs the structured data to update `useBrief` state in real-time
- Dual-channel SSE keeps the existing streaming architecture while adding structured data

**Example:**

```typescript
// app/api/chat/route.ts (simplified)
async function handleStream(claudeStream, controller, encoder, briefState) {
  for await (const event of claudeStream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      // Stream text to client for chat UI
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`)
      );
    }
  }

  // After stream ends, check for tool use
  if (response.stop_reason === 'tool_use') {
    const toolUse = response.content.find(b => b.type === 'tool_use');

    if (toolUse.name === 'classify_campaign') {
      const types = toolUse.input;
      // Recompose prompt with type-specific modules
      briefState.setCampaignTypes(types);
      // Send type update to client
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'type_detected', ...types })}\n\n`)
      );
    }

    if (toolUse.name === 'update_brief') {
      const { section, data } = toolUse.input;
      briefState.updateSection(section, data);
      // Send data update to client
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'brief_update', section, data })}\n\n`)
      );
    }

    // Continue conversation with tool_result
    // ... recursive call or loop
  }
}
```

**Confidence:** MEDIUM -- Streaming + tool use is officially supported (GA), but the multi-turn tool execution loop within a single SSE connection needs careful implementation. The server must handle the Claude -> tool_result -> Claude cycle while maintaining the stream open.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Prompt Assembly

**What:** Building the system prompt on the client and sending it with the messages.
**Why bad:** Exposes prompt engineering to the client, allows manipulation, makes prompts larger in transit. The system prompt should be composed server-side in the API route.
**Instead:** Client sends `{ messages, campaignTypes? }`. Server composes the full system prompt.

### Anti-Pattern 2: End-of-Conversation JSON Dump

**What:** Keeping the current pattern where Claude outputs a single JSON blob with all data at the end of the conversation.
**Why bad:** If the conversation is long, Claude may hallucinate or forget earlier answers. If the user refreshes, all progress is lost. If JSON parsing fails, everything is lost.
**Instead:** Incremental `update_brief` tool calls capture data as it's confirmed. Data accumulates throughout the conversation, not just at the end.

### Anti-Pattern 3: Type Detection via Explicit User Selection

**What:** Showing a dropdown or buttons asking the user to pick their campaign type before the conversation starts.
**Why bad:** Users often don't know the exact marketing taxonomy. "I want more customers" could be performance, brand, or both. The AI should infer type from context and confirm.
**Instead:** Let the AI detect types from the first few conversational answers, then confirm with the user: "Ugy tunik, on [mediavasarlas] + [performance] tipusu kampanyt tervez. Stimmel?"

### Anti-Pattern 4: Single God-Schema for All Types

**What:** One massive Zod schema with all possible fields, most optional.
**Why bad:** No type safety -- you can never know which fields are expected for a given campaign type. Editors and reports can't determine what to show.
**Instead:** Type-specific schemas composed from shared base + extensions (Pattern 3 above).

### Anti-Pattern 5: Hardcoded Campaign Type List

**What:** Defining campaign types as string literals scattered across files.
**Why bad:** Adding a new type requires changes in 6+ files (prompts, types, tools, editor, PDF, email).
**Instead:** Single source of truth in `lib/campaign-types/` -- each type is a self-contained definition with its prompt module, field schema, and section renderers.

## Server-Side State Management for Multi-Turn Tool Use

**Key decision:** Where to store brief accumulation state between API calls?

Since the app is stateless (no database, no user auth), and each `/api/chat` call is independent, the brief state must be reconstructed or passed with each request.

**Recommended approach:** Client-side state with server-side validation.

```
Client (useBrief hook):
  - Accumulates brief data from SSE events
  - Sends current briefState with each message request
  - Displays current progress in editor

Server (/api/chat):
  - Receives {messages, briefState, campaignTypes}
  - Composes prompt from campaignTypes
  - Includes briefState summary in system prompt so Claude knows what's already collected
  - Handles tool calls, returns updates to client
```

This keeps the architecture stateless on the server while letting Claude see what data has already been gathered (via prompt context).

**Confidence:** HIGH -- This follows the existing pattern (client sends full message history), extended to include brief state.

## Build Order (Dependencies)

The following sequence respects dependencies between components:

```
Phase 1: Foundation (no dependencies)
  ├── Campaign type definitions (types, prompts, field schemas)
  ├── Zod tool schemas (classify_campaign, update_brief)
  └── New BriefData type system (base + extensions)

Phase 2: Core Engine (depends on Phase 1)
  ├── Prompt composition system (base + type modules)
  ├── Chat API refactor (tool use loop, SSE dual-channel)
  └── useBrief hook (replaces briefData in useChat)

Phase 3: UI Adaptation (depends on Phase 2)
  ├── Remove PDF upload flow, add direct chat entry
  ├── Dynamic BriefEditor (section registry, conditional rendering)
  └── Type detection UX (confirmation UI when types detected)

Phase 4: Report System (depends on Phase 1 + 3)
  ├── Section registry for PDF
  ├── Section registry for email
  └── PDF download functionality
```

**Phase ordering rationale:**
1. **Phase 1 first** because types/schemas are the foundation everything imports
2. **Phase 2 next** because prompt composition and tool use are the core behavioral change -- without these, the AI still asks generic questions
3. **Phase 3 after** because UI changes are cosmetic until the engine produces type-specific data
4. **Phase 4 last** because reports consume data from the new schema, which must be stable first

**Parallel work opportunities:**
- Phase 1 tasks are fully independent of each other
- Within Phase 3, PDF upload removal is independent of editor refactor
- Phase 4 PDF and email templates can be done in parallel

## Scalability Considerations

| Concern | Current (1 type) | Target (4 types) | Future (10+ types) |
|---------|-------------------|-------------------|---------------------|
| Prompt length | ~800 tokens | ~1500 tokens (base + 1-2 type modules) | Risk: >4K tokens if too many modules loaded. Mitigation: only load active type modules |
| Type definitions | 1 file | 4 files in `campaign-types/` | Registry pattern scales linearly. Each type is self-contained |
| Tool schemas | None | 2 tools (classify + update) | Could add type-specific tools, but keep simple -- `update_brief` with section param handles any type |
| Report sections | 8 hardcoded | ~15-20 (shared + type-specific) | Section registry scales linearly. New type = add entries to registry |
| Token cost | ~2K in/out per turn | ~3K in/out (larger prompt + tools overhead) | Monitor: tool use adds ~350 token overhead. Brief state context grows with conversation |

## File Structure (Proposed)

```
lib/
  prompts/
    base.ts              -- shared prompt (style, rules, flow)
    compose.ts           -- composeSystemPrompt(types)
    types/
      media-buying.ts    -- media buying question module
      performance.ts     -- PPC question module
      brand.ts           -- brand awareness module
      social.ts          -- social media module
  campaign-types/
    index.ts             -- CampaignType enum, registry
    media-buying.ts      -- fields, sections, validation
    performance.ts
    brand.ts
    social.ts
  tools/
    classify-campaign.ts -- tool definition + Zod schema
    update-brief.ts      -- tool definition + Zod schema
    index.ts             -- export all tools
  report/
    section-registry.ts  -- section renderer registry
    pdf-sections/        -- individual PDF section components
    email-sections/      -- individual email section templates
types/
  brief.ts               -- BriefBase, type-specific fields, BriefData
  campaign.ts            -- CampaignType, type guards
hooks/
  useBrief.ts            -- brief state accumulation + management
  useChat.ts             -- refactored: no more JSON extraction, uses tools
```

## Sources

- [Anthropic Structured Outputs Documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) - HIGH confidence: official GA docs, Zod integration, streaming compatibility
- [Anthropic Tool Use Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) - HIGH confidence: official docs, multi-turn patterns, pricing
- [PromptLayer: Prompt Routers and Modular Prompt Architecture](https://blog.promptlayer.com/prompt-routers-and-modular-prompt-architecture-8691d7a57aee/) - MEDIUM confidence: well-established pattern, multiple sources agree
- [TypeScript Discriminated Unions for React Props](https://oneuptime.com/blog/post/2026-01-15-typescript-discriminated-unions-react-props/view) - MEDIUM confidence: standard TS pattern
- [Zod Discriminated Union Discussion](https://github.com/colinhacks/zod/discussions/4735) - MEDIUM confidence: GitHub issue confirms Zod approach for dynamic schemas
- [@react-pdf/renderer Conditional Rendering Issue](https://github.com/diegomura/react-pdf/issues/3164) - MEDIUM confidence: known issue to watch for

---

*Architecture research: 2026-02-10*
