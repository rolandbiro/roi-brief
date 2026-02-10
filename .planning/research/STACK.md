# Technology Stack

**Project:** ROI Brief - Adaptive AI Questioning System
**Researched:** 2026-02-10
**Scope:** Incremental additions to existing stack for campaign-type-specific adaptive questioning

## Existing Stack (Not Re-Researched)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.1 | App framework |
| React | 19.2.3 | UI |
| TypeScript | ^5 | Type safety |
| @anthropic-ai/sdk | ^0.71.2 | Claude API direct access |
| @react-pdf/renderer | ^4.3.2 | PDF generation |
| @sendgrid/mail | ^8.1.6 | Email delivery |
| Tailwind CSS | v4 | Styling |
| ai (Vercel AI SDK) | ^6.0.31 | Listed but NOT used in codebase |

## Recommended Additions

### 1. Zod - Schema Validation & Structured Output Bridge

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| zod | ^4.3.6 | Schema validation, dynamic BriefData types, Anthropic structured output integration | Required by `@anthropic-ai/sdk` `zodOutputFormat` helper. Also provides discriminated unions for campaign-type-specific schemas. Zod v4 is 14x faster than v3 at string parsing. |

**Confidence:** HIGH - Verified via [Anthropic structured outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) and [Zod v4 release notes](https://zod.dev/v4).

**Why Zod specifically:**
- The Anthropic TypeScript SDK ships a `zodOutputFormat` helper at `@anthropic-ai/sdk/helpers/zod` that converts Zod schemas directly into the `output_config.format` parameter. This is the officially supported path for structured outputs in TypeScript.
- Zod v4's `z.discriminatedUnion()` maps perfectly to campaign-type-specific brief schemas (e.g., discriminate on `campaign_type` field to get media-buying-specific or performance-specific fields).
- Runtime validation of Claude's JSON output provides a safety net beyond constrained decoding.

**Installation:**
```bash
npm install zod
```

### 2. @anthropic-ai/sdk Upgrade

| Technology | Target Version | Purpose | Why |
|------------|----------------|---------|-----|
| @anthropic-ai/sdk | ^0.74.0 | Structured outputs GA support, `output_config.format` parameter | Current ^0.71.2 may not include GA structured output support. The `output_config.format` API (replacing deprecated `output_format`) and `zodOutputFormat` helper require recent SDK versions. |

**Confidence:** HIGH - Verified via [npm registry](https://www.npmjs.com/package/@anthropic-ai/sdk) (0.74.0 published 2026-02-08) and [Anthropic docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).

**Installation:**
```bash
npm install @anthropic-ai/sdk@latest
```

### 3. Remove Unused `ai` Package

| Action | Package | Why |
|--------|---------|-----|
| Remove | `ai` (^6.0.31) | Listed in package.json but zero imports in codebase. The project uses `@anthropic-ai/sdk` directly with custom SSE streaming. Removing reduces bundle size and avoids confusion. |

**Confidence:** HIGH - Verified by grepping all `.ts` and `.tsx` files for `ai` imports: zero matches found.

```bash
npm uninstall ai
```

## Architecture Decisions

### Approach 1: Prompt Engineering + Structured Outputs (RECOMMENDED)

**Use the Anthropic SDK directly with structured outputs for the adaptive questioning flow.** Do NOT introduce a framework layer (Vercel AI SDK, LangChain, etc.) between the app and Claude.

**Why this approach:**

1. **Prompt-driven adaptivity is simpler than code-driven logic.** Campaign type detection, question depth adaptation, and skip logic are best expressed as natural language instructions in the system prompt, not as branching TypeScript code. Claude excels at following complex multi-step instructions.

2. **Structured outputs replace the current `BRIEF_JSON_START/END` tag-parsing hack.** The current system relies on regex-parsing JSON from free-text responses (`content.match(/BRIEF_JSON_START\s*([\s\S]*?)\s*BRIEF_JSON_END/)`). This is fragile. With `output_config.format` + Zod schema, Claude's response is guaranteed valid JSON at the token level -- no parsing failures, no retries.

3. **The existing streaming architecture works.** The project's custom SSE streaming (`ReadableStream` + `text/event-stream`) is perfectly functional. Structured outputs are compatible with streaming -- the JSON content streams as `text_delta` events and the final result is guaranteed valid.

4. **No new runtime dependency.** Only Zod is added (zero-dependency, 13KB gzipped for zod-mini). The Anthropic SDK already exists.

**Confidence:** HIGH

### Approach 2: Dual-Call Pattern for Chat + Extraction

The adaptive questioning system needs TWO different interaction patterns:

**Pattern A - Conversational streaming (chat turns):**
Keep current approach. System prompt drives the conversation. Claude streams natural language responses to the user. No structured output needed here -- the response IS the conversation.

```typescript
// Chat turn: stream natural language
const stream = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  system: ADAPTIVE_SYSTEM_PROMPT,  // Contains campaign-type logic
  messages: conversationHistory,
  stream: true,
  // NO output_config -- this is free-form conversation
});
```

**Pattern B - Structured extraction (brief generation):**
When the conversation is complete, make a SEPARATE non-streaming call with `output_config` to extract the structured brief data from the conversation.

```typescript
// Extraction: get structured brief data
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  system: EXTRACTION_SYSTEM_PROMPT,
  messages: [...conversationHistory, {
    role: "user",
    content: "Extract the complete brief data from our conversation."
  }],
  output_config: { format: zodOutputFormat(BriefDataSchema) },
  // NOT streamed -- we need the complete JSON
});
const briefData = JSON.parse(response.content[0].text);
```

**Why two calls instead of one:**
- Streaming + structured output ARE compatible, but the UX goal conflicts: during chat, users need natural Hungarian-language responses with explanations. At the end, the system needs machine-parseable JSON. Mixing these in one response (the current `BRIEF_JSON_START` approach) is fragile and wastes tokens.
- The extraction call is cheap (single call, ~1K output tokens) and guaranteed correct.

**Confidence:** HIGH

### Approach 3: Dynamic BriefData Schema with Zod Discriminated Unions

The current `BriefData` type is a flat, fixed structure. For campaign-type-specific data, use Zod discriminated unions:

```typescript
import { z } from "zod";

// Shared base fields (all campaign types)
const BaseBriefSchema = z.object({
  company: CompanySchema,
  campaign: z.object({
    name: z.string(),
    type: z.enum(["media_buying", "performance_ppc", "brand_awareness", "social_media"]),
    goal: z.string(),
    message: z.string(),
  }),
  target_audience: TargetAudienceSchema,
  channels: z.array(z.string()),
  timeline: TimelineSchema,
  budget: BudgetSchema,
  competitors: z.array(z.string()),
  notes: z.string(),
});

// Type-specific extensions
const MediaBuyingBriefSchema = BaseBriefSchema.extend({
  campaign: BaseBriefSchema.shape.campaign.extend({
    type: z.literal("media_buying"),
  }),
  media_specific: z.object({
    grp_target: z.string(),
    reach_target: z.string(),
    frequency_cap: z.string(),
    media_mix: z.array(z.string()),
    daypart_preferences: z.string(),
  }),
});

const PerformanceBriefSchema = BaseBriefSchema.extend({
  campaign: BaseBriefSchema.shape.campaign.extend({
    type: z.literal("performance_ppc"),
  }),
  performance_specific: z.object({
    target_roas: z.string(),
    target_cpa: z.string(),
    conversion_events: z.array(z.string()),
    attribution_model: z.string(),
    landing_pages: z.array(z.string()),
  }),
});

// Union schema for structured output
const AdaptiveBriefSchema = z.discriminatedUnion("campaign.type", [
  MediaBuyingBriefSchema,
  PerformanceBriefSchema,
  BrandAwarenessBriefSchema,
  SocialMediaBriefSchema,
]);
```

**Important limitation:** Zod's `z.discriminatedUnion` does NOT support nested discriminator keys like `"campaign.type"`. The discriminator must be a top-level key. Workaround: either flatten to a top-level `campaign_type` field, or use `z.union()` with manual refinement. Since the Anthropic structured output grammar compilation handles `anyOf` (which is what `z.union` compiles to), this works fine.

**Confidence:** MEDIUM - Zod discriminated union on nested keys needs validation during implementation. The `z.union()` fallback is verified to work with Anthropic structured outputs.

### Approach 4: Campaign-Type Knowledge as Prompt Sections

Campaign-type-specific domain knowledge (what questions to ask for media buying vs. performance) should live in **TypeScript constant files**, NOT in a database or config system. Rationale:

- There are 4 campaign types. This is not a dynamic dataset.
- The knowledge changes when marketing industry practices change, not at runtime.
- TypeScript constants are type-checked, version-controlled, and tree-shaken.

```
lib/
  prompts/
    system.ts          # Core adaptive system prompt
    campaign-types/
      media-buying.ts  # GRP, reach, frequency questions + context
      performance.ts   # ROAS, CPA, conversion questions + context
      brand.ts         # Awareness, recall, brand lift questions + context
      social.ts        # Engagement, content, community questions + context
    extraction.ts      # Brief extraction prompt
```

The system prompt dynamically assembles itself from these modules based on detected/selected campaign types. For multi-type campaigns, ALL relevant question sets are included.

**Confidence:** HIGH

## What NOT to Add

| Technology | Why Not |
|------------|---------|
| LangChain / LangGraph | Massive dependency for what is a single-model, single-prompt system. The "chain" is just one system prompt + conversation history. No multi-model orchestration needed. |
| Vercel AI SDK (`ai`) | Already unused in the project. The direct Anthropic SDK gives full control over streaming, structured outputs, and prompt construction. The AI SDK's `streamText` abstraction adds nothing here -- the custom SSE implementation is already working and simpler to debug. |
| Vector database (Pinecone, etc.) | Campaign-type knowledge is 4 sets of ~20 questions each. This fits in a prompt. No RAG needed. |
| State machine library (XState) | The conversation flow is driven by Claude's intelligence, not by explicit state transitions. Adding a state machine creates a rigid flow that defeats the purpose of adaptive questioning. |
| Form library (react-hook-form) | The BriefEditor is a simple review/edit screen, not a complex form with validation. The current `updateField` pattern with controlled inputs is adequate. If the editor grows significantly, reconsider. |
| Database (Prisma, Supabase) | Brief data is generated, emailed, and forgotten. No persistence needed. If analytics/history becomes a requirement, revisit. |

## Recommended Stack Summary

### Install

```bash
npm install zod @anthropic-ai/sdk@latest
npm uninstall ai
```

### Final Stack for Adaptive Questioning

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Schema validation** | zod | ^4.3.6 | BriefData schemas, discriminated unions, Anthropic SDK integration |
| **AI API** | @anthropic-ai/sdk | ^0.74.0 | Structured outputs GA, `output_config.format`, `zodOutputFormat` helper |
| **Model** | claude-sonnet-4 | latest | Chat turns (streaming) and brief extraction (structured output) |
| **PDF** | @react-pdf/renderer | ^4.3.2 (existing) | Dynamic sections via prop-driven conditional rendering |
| **Types** | TypeScript + Zod `z.infer<>` | - | Single source of truth: Zod schemas generate both TypeScript types AND JSON schemas for structured output |

### Key Pattern: Zod as Single Source of Truth

```
Zod Schema
    |
    +---> z.infer<typeof Schema>  --> TypeScript types (compile-time)
    |
    +---> zodOutputFormat(Schema) --> Anthropic structured output (runtime)
    |
    +---> Schema.parse(data)      --> Runtime validation (safety net)
```

This eliminates the current duplication between `types/chat.ts` (manual TypeScript interface) and the implicit JSON structure in the system prompt. Define once in Zod, derive everything.

## PDF Generation for Dynamic Layouts

The existing `@react-pdf/renderer` v4.3.2 supports dynamic sections through standard React conditional rendering via props. No additional library needed.

**Pattern for campaign-type-specific PDF sections:**

```typescript
// Pass campaign type and type-specific data as props
function BriefPDF({ data }: { data: AdaptiveBriefData }) {
  return (
    <Document>
      <Page>
        {/* Shared sections -- always rendered */}
        <CompanySection data={data.company} />
        <CampaignSection data={data.campaign} />
        <TargetAudienceSection data={data.target_audience} />

        {/* Type-specific sections -- conditionally rendered */}
        {data.campaign.type === "media_buying" && data.media_specific && (
          <MediaBuyingSection data={data.media_specific} />
        )}
        {data.campaign.type === "performance_ppc" && data.performance_specific && (
          <PerformanceSection data={data.performance_specific} />
        )}

        {/* Shared sections */}
        <BudgetSection data={data.budget} />
        <TimelineSection data={data.timeline} />
      </Page>
    </Document>
  );
}
```

**Known issue:** @react-pdf/renderer has a bug where removing/adding elements after initial render can crash ([issue #3164](https://github.com/diegomura/react-pdf/issues/3164)). This does NOT affect server-side rendering (which is how the project uses it in the `send-brief` API route via `renderToBuffer`). The PDF is generated once from final data, not dynamically toggled.

**Confidence:** HIGH

## Streaming Architecture Decision

**Keep the current custom SSE streaming implementation.** Do NOT migrate to Vercel AI SDK's `useChat` or `streamText`.

**Rationale:**
1. The current implementation works: custom `ReadableStream` -> SSE -> client-side `EventSource`-style parsing.
2. The dual-call pattern (streaming chat + non-streaming extraction) does not map cleanly to `useChat`, which assumes a single call-per-turn.
3. The extraction call (Pattern B above) needs to happen client-side AFTER the chat is complete, as a separate fetch. This is simpler with the existing `useChat` hook than with the AI SDK's opinionated abstractions.
4. The AI SDK adds 100KB+ to the bundle for an abstraction we don't need.

**Confidence:** HIGH

## Sources

- [Anthropic Structured Outputs Documentation (GA)](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Anthropic SDK TypeScript (npm)](https://www.npmjs.com/package/@anthropic-ai/sdk) - v0.74.0
- [Zod v4 Release Notes](https://zod.dev/v4) - v4.3.6
- [Zod Discriminated Unions](https://zod.dev/api)
- [Claude Prompt Engineering Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [@react-pdf/renderer Advanced Docs](https://react-pdf.org/advanced)
- [@react-pdf/renderer Issue #3164 - Conditional Rendering Bug](https://github.com/diegomura/react-pdf/issues/3164)
- [AI SDK 6 Anthropic Provider](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)
- [Anthropic Streaming Docs](https://platform.claude.com/docs/en/build-with-claude/streaming)
