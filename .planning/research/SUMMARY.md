# Project Research Summary

**Project:** ROI Brief Assistant v2
**Domain:** Adaptive AI-powered marketing campaign brief intake (conversational)
**Researched:** 2026-02-10
**Confidence:** HIGH

## Executive Summary

ROI Brief v2 is a refactoring of an existing AI chat-based brief intake tool from a fixed 13-question flow to a campaign-type-adaptive questioning system. The product's unique position is clear: it is client-facing (not an internal agency tool), conversational (not form-based), and serves the Hungarian marketing market with zero competition. Research confirms the recommended approach is prompt-driven adaptivity with Claude's native structured outputs, not a framework-heavy orchestration layer. The existing stack (Next.js 16, React 19, direct Anthropic SDK, @react-pdf/renderer) is solid. Only two additions are needed: Zod v4 for schema validation and an Anthropic SDK upgrade to ^0.74.0 for GA structured output support.

The architecture should follow a dual-call pattern: streaming conversational chat for the user-facing interaction, plus a separate structured-output extraction call for the final brief data. Campaign type detection happens via Claude tool use (classify_campaign), and brief data accumulates incrementally through update_brief tool calls throughout the conversation -- replacing the brittle BRIEF_JSON_START/END regex extraction. The type system uses Zod schemas as a single source of truth, generating both TypeScript types and Anthropic JSON schemas from one definition. Campaign-type-specific knowledge lives in modular TypeScript constant files, composed into the system prompt dynamically.

The three biggest risks are: (1) the current regex-based JSON extraction will fail catastrophically with dynamic schemas -- structured outputs must be the first thing built; (2) survey fatigue if adaptive questioning adds questions instead of replacing them -- a hard cap of 12-15 questions is essential; (3) context window drift in longer conversations causing Claude to forget early answers -- incremental data capture via tool calls is the mitigation, not relying on re-reading the full conversation.

## Key Findings

### Recommended Stack

The existing stack requires minimal changes. No new frameworks, no database, no state machine library. The key insight is that the Anthropic SDK already provides everything needed for adaptive questioning when combined with Zod for schema validation.

**Core technologies:**
- **Zod v4** (^4.3.6): Schema validation, discriminated unions for campaign-type-specific data, and the bridge to Anthropic structured outputs via `zodOutputFormat()`. Single source of truth for types.
- **@anthropic-ai/sdk** (upgrade to ^0.74.0): GA structured outputs with `output_config.format`, tool use for incremental data extraction, streaming compatibility.
- **Remove `ai` package**: Vercel AI SDK is listed in package.json but has zero imports. Removing it cuts bundle size and eliminates confusion.

**What NOT to add:** LangChain (overkill for single-model system), XState (adaptive questioning is prompt-driven, not state-machine-driven), vector database (4 campaign types fit in a prompt), user auth/database (brief data is generated and emailed, no persistence needed).

### Expected Features

**Must have (table stakes) -- v1:**
- Campaign type detection from conversation context (AI detects, user confirms)
- Type-specific question sets (8-15 specialist questions per type beyond shared base)
- Adaptive deepening (probe thin answers, skip already-answered questions)
- Smart question ordering (funnel: context -> strategy -> tactics -> logistics)
- Flexible BriefData schema (type-aware fields replacing fixed 13-field structure)
- Dynamic report sections (PDF/email show only type-relevant sections)
- Dynamic BriefEditor (editor adapts to show type-relevant fields)
- Progress indication (step count, not percentage)

**Should have (differentiators) -- v1.x:**
- Multi-campaign-type support (one brief covering performance + social)
- Quick-reply buttons (clickable suggestion chips for common answers)
- Brief quality scoring ("Your brief is 85% complete")
- PDF download for client (alongside email)
- Agency-side enrichment notes (AI-generated internal notes for account managers)

**Defer (v2+):**
- Conversation analytics, A/B testing flows, API/webhook integrations, template management UI
- User accounts, real-time collaboration, voice input, auto-generated proposals

### Architecture Approach

The architecture follows a tool-use-driven incremental data capture pattern. Claude acts as the conversational driver, calling `classify_campaign` after initial discovery and `update_brief` throughout the conversation to incrementally save structured data. The server composes modular prompts (base + type-specific modules), executes tool calls, and streams both text and structured data events to the client via dual-channel SSE.

**Major components:**
1. **Prompt Registry** (`lib/prompts/`) -- Base prompt + composable type-specific modules, dynamically assembled per conversation
2. **Campaign Type Definitions** (`lib/campaign-types/`) -- Self-contained definitions per type: question sets, Zod field schemas, section renderers
3. **Tool Definitions** (`lib/tools/`) -- `classify_campaign` and `update_brief` with strict Zod schemas for structured output
4. **Chat API Route** (`app/api/chat/`) -- Orchestrates Claude calls with tools, manages prompt composition, handles multi-turn tool execution loop
5. **Brief State Manager** (`hooks/useBrief.ts`) -- Client-side accumulation of partial brief data from SSE events
6. **Section Registry** (`lib/report/`) -- Maps section keys to render functions for PDF, email, and editor -- decouples data shape from rendering
7. **Dynamic Editor** (`components/BriefEditor.tsx`) -- Schema-driven form rendering instead of hardcoded 418-line JSX

### Critical Pitfalls

1. **Regex JSON extraction will break with dynamic schemas** -- The current `BRIEF_JSON_START/END` pattern fails ~10% of the time with the fixed schema and will fail far more with dynamic schemas. Use Anthropic structured outputs (`output_config.format` + Zod) as the FIRST change. Separate conversation streaming from data extraction.

2. **Survey fatigue from more questions** -- Adaptive questioning risks adding questions (20-30 for hybrid types) instead of replacing them. Hard cap at 12-15 questions, priority-rank questions per type, skip already-answered topics. Target: 7-10 minute completion time.

3. **Context window drift in long conversations** -- Full conversation history grows to 15-30K tokens with adaptive flows. Claude forgets early answers or deprioritizes instructions. Mitigation: incremental data capture via tool calls (don't rely on re-reading), keep collected-data summary near the end of messages (recency bias).

4. **Dynamic TypeScript types without runtime validation** -- TypeScript evaporates at runtime. All Claude output MUST pass through Zod validation before reaching React state. Zod schema = single source of truth for compile-time types AND runtime validation.

5. **PDF template crashes with dynamic sections** -- @react-pdf/renderer has known bugs with conditional rendering of Page/View components. Never conditionally render Page components. Generate PDF server-side only (already the case). Test with max-length data for every field.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Type System & Schema Foundation

**Rationale:** Everything depends on the new type system. Campaign type definitions, Zod schemas, and the BriefData type structure are imported by every other component. This must be stable before anything else is built.
**Delivers:** Campaign type definitions (4 types), Zod schemas for BriefData (base + type-specific extensions), tool schemas (classify_campaign, update_brief), TypeScript types derived from Zod.
**Addresses:** Flexible BriefData schema (P1 feature), foundation for all type-specific features.
**Avoids:** Pitfall 4 (dynamic types without runtime validation), Pitfall 1 (preparing structured output schemas).
**Stack:** Install Zod v4, upgrade @anthropic-ai/sdk to ^0.74.0, remove unused `ai` package.

### Phase 2: Prompt System & Adaptive Questioning Engine

**Rationale:** The prompt system and tool-use-based data extraction are the core behavioral change. Without this, the AI still asks generic questions regardless of campaign type.
**Delivers:** Modular prompt composition (base + type modules), chat API refactor with tool use loop, `classify_campaign` and `update_brief` tool execution, dual-channel SSE (text + brief_update events).
**Addresses:** Campaign type detection (P1), type-specific question sets (P1), smart question ordering (P1), adaptive deepening (P1).
**Avoids:** Pitfall 1 (replace regex extraction with tool use), Pitfall 2 (two-step classification with user confirmation), Pitfall 3 (incremental data capture prevents context drift), Pitfall 5 (question budget enforcement in prompt).

### Phase 3: Client-Side State & UI Adaptation

**Rationale:** UI changes are cosmetic until the engine produces type-specific data. Once Phase 2 delivers structured data events, the client needs to accumulate and display them.
**Delivers:** `useBrief` hook (replaces briefData in useChat), dynamic BriefEditor (schema-driven rendering), type detection UX (confirmation UI), progress indication, removal of PDF upload flow.
**Addresses:** Dynamic BriefEditor (P1), progress indication (P1), brief summary/review adaptation.
**Avoids:** Pitfall 7 (schema-driven editor instead of hardcoded 1000+ line JSX).

### Phase 4: Dynamic Report System

**Rationale:** Reports consume data from the new schema, which must be stable before templates are refactored. PDF and email templates depend on both the schema (Phase 1) and the editor (Phase 3) for data shape validation.
**Delivers:** Section registry for PDF and email, campaign-type-specific PDF sections, campaign-type-specific email sections, PDF download functionality for clients.
**Addresses:** Dynamic report sections (P1), PDF download (P2).
**Avoids:** Pitfall 6 (PDF template breaks with dynamic sections -- use section registry pattern, never conditionally render Page components).

### Phase 5: Polish & Differentiators

**Rationale:** After the core adaptive flow works end-to-end, add competitive differentiators based on real usage data.
**Delivers:** Quick-reply buttons, brief quality scoring, agency-side enrichment notes, localStorage session backup, contextual explanations for specialist terms.
**Addresses:** P2 features from the prioritization matrix.

### Phase Ordering Rationale

- **Phase 1 before everything** because Zod schemas are imported by tools, prompts, editor, and reports. Changing the schema later would cascade changes across the entire codebase.
- **Phase 2 before Phase 3** because UI rendering of dynamic data requires the engine to produce dynamic data first. Building the editor before the engine means working with mock data that won't match reality.
- **Phase 3 before Phase 4** because the report system should render the same data the editor displays. The editor validates that the data shape is correct before templates depend on it.
- **Phase 4 is deliberately last** among core phases because PDF generation is the most fragile component (known react-pdf bugs) and benefits from a stable, well-tested data shape.
- **Phase 5 is independent** -- features can be added incrementally post-launch based on user feedback.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** The multi-turn tool execution loop within a single SSE connection is a non-trivial implementation pattern. The Claude API's tool use + streaming interaction needs careful prototyping. Research the exact event sequence for `stop_reason: tool_use` within a stream.
- **Phase 4:** @react-pdf/renderer's conditional rendering bugs need direct testing with the specific version (4.3.2). The section registry pattern is sound in theory but needs validation against react-pdf's rendering model.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Zod schema definition and TypeScript type derivation are well-documented, established patterns. No research needed.
- **Phase 3:** React state management and conditional UI rendering are standard. The `useBrief` hook follows established patterns.
- **Phase 5:** All features are standard UI/UX additions with no novel technical challenges.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against official Anthropic docs, npm registry, Zod v4 release notes. Minimal additions to proven stack. |
| Features | MEDIUM-HIGH | Feature landscape well-researched with competitor analysis and practitioner sources. Campaign type question matrices are comprehensive but need validation with ROI Works domain experts. |
| Architecture | HIGH | Tool-use pattern verified against official Anthropic docs (GA). Modular prompt composition is an established pattern. Dual-channel SSE is the main implementation risk. |
| Pitfalls | HIGH | Based on direct codebase analysis, official docs, and verified community issues (react-pdf bugs). Survey fatigue research is MEDIUM confidence. |

**Overall confidence:** HIGH

### Gaps to Address

- **Zod v4 discriminated union on nested keys**: `z.discriminatedUnion("campaign.type")` does NOT support nested discriminator keys. Must use top-level `campaign_type` field or fall back to `z.union()`. Validate during Phase 1 implementation.
- **Multi-turn tool execution in SSE stream**: The server must handle Claude -> tool_result -> Claude cycles while keeping the SSE connection open. No verified reference implementation found. Prototype early in Phase 2.
- **Question budget per campaign type**: Research suggests 12-15 questions max, but the actual must-ask vs. nice-to-have prioritization per type needs domain expert input from ROI Works.
- **Hungarian language fidelity**: Claude's Hungarian output quality for specialist marketing terms (GRP, reach, frequency in Hungarian context) needs testing. The model may default to English for technical terms.
- **First-call latency for structured outputs**: Anthropic caches compiled grammars for 24h. First call per schema is slower. Measure actual latency impact during Phase 2 and consider pre-warming strategies.

## Sources

### Primary (HIGH confidence)
- [Anthropic Structured Outputs Documentation (GA)](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) -- structured output API, zodOutputFormat, streaming compatibility
- [Anthropic Tool Use Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) -- multi-turn patterns, pricing, streaming
- [Anthropic SDK TypeScript (npm)](https://www.npmjs.com/package/@anthropic-ai/sdk) -- v0.74.0 verification
- [Zod v4 Release Notes](https://zod.dev/v4) -- v4.3.6, discriminated unions, performance
- [Zod API Documentation](https://zod.dev/api) -- discriminated union API, limitations
- [@react-pdf/renderer Issues](https://github.com/diegomura/react-pdf/issues/3164) -- conditional rendering bugs, dynamic page breaks

### Secondary (MEDIUM confidence)
- [PromptLayer: Modular Prompt Architecture](https://blog.promptlayer.com/prompt-routers-and-modular-prompt-architecture-8691d7a57aee/) -- prompt composition pattern
- [Redis: Context Window Overflow](https://redis.io/blog/context-window-overflow/) -- context drift research
- [Maxim AI: Context Window Management](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/) -- mitigation strategies
- [AgencyAnalytics: Client Onboarding Questions](https://agencyanalytics.com/blog/client-onboarding-questionnaire) -- practitioner question sets
- [Sendible: Social Media Questionnaire](https://www.sendible.com/insights/social-media-questionnaire) -- social media brief questions
- [Smashing Magazine: Conversational AI UX](https://www.smashingmagazine.com/2024/07/how-design-effective-conversational-ai-experiences-guide/) -- UX patterns
- [LLM Prompt Sensitivity Research](https://arxiv.org/html/2602.04297) -- classification instability
- Competitor analysis: HolaBrief, Briefly, Foreplay Briefs, The Brief AI -- feature landscape

### Tertiary (LOW confidence)
- [DEV.to: LLM JSON Output Problems](https://dev.to/acartag7/why-your-llm-returns-sure-heres-the-json-and-how-to-fix-it-2b1g) -- anecdotal but relevant
- [Agenta: Structured Outputs Guide](https://agenta.ai/blog/the-guide-to-structured-outputs-and-function-calling-with-llms) -- general overview
- [Ideta: Conversational Form Statistics](https://www.ideta.io/blog-posts-english/conversational-form-beats-web-form) -- vendor data, take with caution

---
*Research completed: 2026-02-10*
*Ready for roadmap: yes*
