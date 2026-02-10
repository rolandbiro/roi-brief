# Domain Pitfalls

**Domain:** Adaptive AI-powered brief/intake assistant (refactoring from fixed to dynamic questioning)
**Researched:** 2026-02-10
**Confidence:** HIGH (based on codebase analysis, official Anthropic docs, and verified community patterns)

---

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: JSON Extraction via Regex Will Break with Dynamic Schemas

**What goes wrong:** The current system uses `BRIEF_JSON_START` / `BRIEF_JSON_END` markers with regex extraction (`content.match(/BRIEF_JSON_START\s*([\s\S]*?)\s*BRIEF_JSON_END/)`) to parse the final brief JSON from Claude's conversational response. When the schema becomes dynamic (different fields per campaign type), this approach fails in multiple ways:
- Claude omits fields or invents extra ones not in the expected schema
- JSON syntax errors (trailing commas, unmatched brackets) increase with schema complexity
- The model sometimes wraps JSON in markdown code blocks or adds explanatory text inside the markers
- Streaming makes partial JSON visible to users (the raw `BRIEF_JSON_START` tag appears in chat)

**Why it happens:** The current approach treats Claude as a free-text generator and hopes it follows formatting instructions. With a fixed 13-field schema this works ~90% of the time. With dynamic schemas (potentially 20-30 fields varying by campaign type), reliability drops significantly because the prompt becomes more complex and the model has more opportunities to deviate.

**Consequences:**
- `JSON.parse()` failures silently swallow brief data (current code only `console.error`s)
- Users complete a 15-minute conversation and get no brief
- No way to partially recover -- it's all-or-nothing
- Runtime type mismatches when `BriefData` TypeScript interface doesn't match actual JSON

**Prevention:** Use Claude's **structured outputs** (`output_config.format` with `json_schema`) instead of regex extraction. This is now GA on Claude Sonnet 4.5 and Opus 4.6. Constrained decoding guarantees schema-valid JSON -- no parsing errors, no retry logic needed. Define Zod schemas for each campaign type and use `zodOutputFormat()` from `@anthropic-ai/sdk/helpers/zod`.

**Detection:** Monitor for `checkForBriefData` returning null after conversations that appear complete. Track JSON parse failure rate. If > 5% of completed conversations fail to produce valid JSON, this is the cause.

**Phase:** Address FIRST. This is the foundation. The conversation phase should use streaming normally, then a separate "extraction" API call with structured outputs should collect the final brief.

**Confidence:** HIGH -- verified against [Anthropic structured outputs docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)

---

### Pitfall 2: Campaign Type Detection Drift and Misclassification

**What goes wrong:** When the system needs to detect campaign type from a PDF proposal to determine which question set to use, prompt-based classification is unreliable. LLMs are sensitive to prompt phrasing -- small wording differences lead to different classifications. Specific failure modes:
- Hybrid campaigns (e.g., "brand awareness + lead generation") get classified as one or the other, losing half the relevant questions
- Hungarian-language proposals with industry jargon get misclassified because the model interprets terms differently
- The classification changes between API calls for the same input (non-deterministic)
- Edge cases (e.g., "employer branding" vs "brand campaign") fall into wrong buckets

**Why it happens:** Research shows LLMs exhibit significant sensitivity to prompt variations, with "a significant portion of observed LLM instability stemming from underspecified prompts and ambiguous instructions." Classification prompts that seem clear to a developer are often ambiguous to the model, especially across languages.

**Consequences:**
- Wrong question set shown to client, leading to irrelevant questions
- Missing critical information for the actual campaign type
- Client confusion and loss of trust in the tool
- Agency receives incomplete briefs that need manual follow-up

**Prevention:**
1. Use a **two-step classification**: first detect type with structured outputs (constrained to an enum of valid types), then confirm with the user before proceeding ("Az ajanlat alapjan ugy tunik, ez egy brandepites kampany. Helyes?")
2. Support **multi-type selection** from the start -- don't force a single type
3. Use `temperature: 0` for the classification call
4. Define types as a closed enum in the Zod schema, not free text

**Detection:** Log every classification result alongside the source proposal text. Review mismatches weekly during initial rollout. If the user changes the type after confirmation, track that as a "misclassification" event.

**Phase:** Address in the type system design phase, before building the question flows. Getting the type wrong cascades into every subsequent step.

**Confidence:** MEDIUM -- based on research literature on LLM classification sensitivity and practical experience with the Hungarian language context

---

### Pitfall 3: Context Window Drift in Long Adaptive Conversations

**What goes wrong:** The current system sends the full conversation history with every API call (`[...messages, userMessage].map(m => ({ role: m.role, content: m.content }))`). With a fixed 13-question flow this is manageable (~4K tokens). With adaptive questioning that may branch into 20-30 questions with explanations and follow-ups, the conversation grows to 15-30K tokens. Key problems:
- Claude starts "forgetting" earlier answers, asking redundant questions
- The system prompt instructions about which questions to ask get deprioritized as conversation grows
- The model produces lower-quality questions as context fills up
- Important information from the PDF proposal (injected as the first user message) gets pushed into the "lost middle" zone

**Why it happens:** Research confirms that "as context grows, models often use evidence less reliably, especially when key information sits in the middle of long prompts." Even with large context windows (200K tokens), models show "sharp performance drops past 32K tokens" in practice.

**Consequences:**
- Redundant questions frustrate users
- Brief quality degrades -- answers from early questions are poorly reflected in the final output
- Proposal context is lost, so Claude stops referencing it
- Token costs increase linearly with conversation length

**Prevention:**
1. **Separate the conversation from the extraction.** The chat is for collecting information; the final brief generation should be a separate call with only the accumulated answers (not the full conversation).
2. **Maintain a running "collected data" state** server-side. After each exchange, extract the answered field and store it. Don't rely on Claude re-reading the entire conversation.
3. **Summarize the proposal** into key facts at the start, don't inject the raw text.
4. Keep the system prompt at the TOP (it already is) and the collected-so-far state near the END of the messages array (recency bias helps).

**Detection:** If Claude asks a question that was already answered, or produces a brief that's missing information the user clearly provided, context drift is occurring.

**Phase:** Address during the conversation architecture redesign. This is a structural change to how the chat hook manages state.

**Confidence:** HIGH -- based on [Redis context window research](https://redis.io/blog/context-window-overflow/) and [Maxim AI context management guide](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/)

---

## Moderate Pitfalls

### Pitfall 4: Dynamic TypeScript Types Without Runtime Validation

**What goes wrong:** The current `BriefData` interface in `types/chat.ts` is a single static TypeScript type. When refactoring to support multiple campaign types, developers often create a union type or generic type but forget that TypeScript types evaporate at runtime. The JSON from Claude is `any` at runtime -- it doesn't matter what your TypeScript says.

Specific failure: the `BriefEditor` component uses `updateField("company.name", value)` with a string path. With dynamic schemas, paths may not exist, leading to silent `undefined` writes or crashes in the editor.

**Prevention:**
1. Define a **Zod discriminated union** for campaign types:
   ```typescript
   const BrandBrief = z.object({ type: z.literal("brand"), ... })
   const PerformanceBrief = z.object({ type: z.literal("performance"), ... })
   const BriefSchema = z.discriminatedUnion("type", [BrandBrief, PerformanceBrief])
   ```
2. Validate ALL data from Claude through Zod before it reaches React state
3. Use the same Zod schema for both Claude's `output_config` and frontend validation
4. Replace the string-path `updateField` with type-safe field accessors per campaign type

**Phase:** Address when defining the type system. The Zod schemas become the single source of truth for types, Claude output format, and form validation.

**Confidence:** HIGH -- verified with [Zod documentation](https://zod.dev/api) and known TypeScript runtime limitations

---

### Pitfall 5: Survey Fatigue -- Adaptive Means More Questions, Not Smarter Questions

**What goes wrong:** The motivation for adaptive questioning is "ask the right questions for the campaign type." The trap is that this means MORE questions total, not fewer. A brand campaign brief gets 15 brand-specific questions. A performance campaign gets 15 performance-specific questions. A hybrid gets 25. Users who previously answered 13 questions now answer 20+.

Research shows "ten questions is the ideal number for a survey" and surveys should be completed in under 5 minutes. The current 13-question flow is already at the upper limit. Adding type-specific depth pushes past it.

**Prevention:**
1. **Hard cap of 12-15 questions maximum** per session, regardless of campaign type
2. **Smart pre-filling from the proposal PDF** -- if Claude can extract an answer from the uploaded document, confirm it don't ask it
3. **Priority-ranked questions per type** -- must-ask vs nice-to-have. If the conversation is getting long, skip nice-to-haves
4. **Progress indicator** in the UI ("Question 5 of ~12") so users see the end
5. **Allow "I don't know" / skip** for non-critical questions

**Detection:** Track conversation length (number of exchanges) and completion rate. If average conversation exceeds 15 exchanges or completion drops below 80%, question count is too high.

**Phase:** Address during question set design (before implementation). Define the question budget per type.

**Confidence:** MEDIUM -- based on [survey fatigue research](https://qualaroo.com/blog/getting-customers-to-respond-in-a-world-of-survey-fatigue/) and [AIMultiple online survey challenges](https://research.aimultiple.com/online-survey-challenges/)

---

### Pitfall 6: PDF Template Breaks with Dynamic Sections

**What goes wrong:** The current `BriefPDF` component in `lib/pdf-template.tsx` has hardcoded sections (Cegadatok, Kampany, Celcsoport, Csatornak, Idozites, Koltsegvetes, Versenytarsak, Megjegyzesek). With dynamic campaign-type-specific sections:
- Conditional rendering of `<View>` and `<Page>` components causes crashes ("Eo is not a function" error -- known react-pdf bug)
- Dynamic content that varies in length causes pagination issues (content overlaps with fixed footer)
- Sections with missing data render as empty boxes instead of being omitted
- Long text in dynamic fields overflows without wrapping

**Prevention:**
1. **Never conditionally render Page components** -- instead, always render all pages and use `break={false}` or empty content for unused sections
2. **Test with maximum-length data** for every dynamic field to catch overflow
3. **Use the `wrap` prop** on View components to enable automatic page breaking
4. **Render "N/A" or omit empty sections** with a helper function, not inline conditional logic
5. **Generate PDF server-side only** (already the case) -- never render react-pdf in the browser

**Detection:** Generate test PDFs with every campaign type and review visually. Automated tests can check PDF page count and text extraction.

**Phase:** Address when refactoring the PDF template to support multiple brief types.

**Confidence:** HIGH -- verified with react-pdf GitHub issues [#3164](https://github.com/diegomura/react-pdf/issues/3164), [#2957](https://github.com/diegomura/react-pdf/issues/2957), [#2378](https://github.com/diegomura/react-pdf/issues/2378)

---

### Pitfall 7: The BriefEditor Becomes Unmaintainable with Dynamic Fields

**What goes wrong:** The current `BriefEditor.tsx` is 418 lines of hardcoded form fields. Each campaign type adds its own set of fields. Without abstraction, you end up with:
- 1000+ lines of JSX with conditional rendering per campaign type
- Duplicated validation logic per field type
- The `updateField` string-path approach breaks silently for fields that don't exist in a given type
- Adding a new campaign type requires touching 10+ places in the editor

**Prevention:**
1. **Generate the editor form from the Zod schema** -- use a schema-driven form renderer instead of hardcoded JSX. The Zod schema already knows field names, types, and which fields exist per campaign type.
2. **Create a field component library** (TextInput, TextArea, TagsInput, DateInput) that the renderer composes
3. **Keep the section grouping in the schema metadata** (e.g., Zod `.describe()` or a parallel config object)
4. **Test each campaign type's editor separately** -- render it, fill it, submit it

**Phase:** Address as part of the BriefEditor refactoring, after the Zod schemas are defined.

**Confidence:** HIGH -- based on direct codebase analysis of `components/BriefEditor.tsx`

---

## Minor Pitfalls

### Pitfall 8: Streaming Exposes Internal Markers to Users

**What goes wrong:** The current system streams Claude's full response to the UI, including the `BRIEF_JSON_START` / `BRIEF_JSON_END` markers and raw JSON. Users see a wall of JSON at the end of the conversation. With structured outputs, this problem disappears for the extraction step, but during the conversation, if Claude decides to "think out loud" about the campaign type or schema, those internal reasoning steps may leak into the stream.

**Prevention:** If keeping the conversational approach, filter the stream output to hide any content after a known delimiter. Better: separate the conversation (streaming, user-facing) from the data extraction (non-streaming, structured output, server-side only).

**Phase:** Addressed naturally when separating conversation from extraction.

---

### Pitfall 9: Multi-language Prompt Complexity

**What goes wrong:** The system prompt is in Hungarian, the JSON keys are in English, and Claude needs to map between them. With dynamic schemas that have more fields, the cognitive load on the model increases. Claude sometimes responds in English for technical questions, or produces Hungarian values in English-key fields inconsistently.

**Prevention:**
1. Keep JSON keys in English but add Hungarian descriptions in the Zod schema
2. Be explicit in the system prompt: "Always respond in Hungarian. JSON field values should be in Hungarian where appropriate."
3. Test each campaign type's full flow in Hungarian specifically

**Phase:** Address during prompt engineering for each campaign type.

---

### Pitfall 10: No Graceful Degradation for API Failures Mid-Conversation

**What goes wrong:** The current error handling shows a generic error message but doesn't preserve conversation state. If the API fails during an adaptive flow (e.g., after the type detection step but before questions start), users lose all progress. With multi-step flows (detect type -> ask questions -> extract brief), there are more failure points.

**Prevention:**
1. Persist conversation state to `sessionStorage` after each exchange (not just the PDF data)
2. Allow "retry last step" without restarting the whole flow
3. If structured output extraction fails, fall back to the regex approach as a degradation path
4. Show which step failed and give the user options

**Phase:** Address as part of the error handling improvements, after the core flow works.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Type system design | Types too granular (20 campaign types) leading to combinatorial explosion | Start with 3-5 broad types, add subtypes later. Each new type needs its own question set, PDF section, editor fields, and tests. |
| System prompt refactoring | Prompt becomes too long with all type-specific instructions | Use a base prompt + type-specific appendix pattern. Don't stuff everything into one mega-prompt. |
| Structured output integration | First request latency from grammar compilation | Anthropic caches compiled grammars for 24h. First call per schema is slower. Pre-warm in development. |
| Conversation architecture | Over-engineering with state machines, agents, or multi-step tool use | KISS: the conversation is still a simple chat. The adaptive part is which questions to ask, not how many API calls to make. |
| BriefEditor refactoring | Trying to make one universal form component that handles all types | Better to have a type-specific editor that renders from schema, than one giant component with 50 conditional branches. |
| PDF template refactoring | Trying to make one template handle all types dynamically | Use a base template with type-specific section renderers. Accept some code duplication across types -- it's better than fragile dynamic rendering. |
| Testing | Only testing the happy path with perfect data | Test with: missing fields, extra-long values, special characters (Hungarian accents), empty proposals, and every campaign type. |

## Sources

- [Anthropic Structured Outputs Documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) - HIGH confidence
- [Zod Documentation - Discriminated Unions](https://zod.dev/api) - HIGH confidence
- [react-pdf Conditional Rendering Issue #3164](https://github.com/diegomura/react-pdf/issues/3164) - HIGH confidence
- [react-pdf Dynamic Page Breaks Issue #2378](https://github.com/diegomura/react-pdf/issues/2378) - HIGH confidence
- [Redis: Context Window Overflow](https://redis.io/blog/context-window-overflow/) - MEDIUM confidence
- [Maxim AI: Context Window Management Strategies](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/) - MEDIUM confidence
- [LLM Prompt Sensitivity in Text Classification](https://arxiv.org/html/2602.04297) - MEDIUM confidence
- [Taxonomy of Prompt Defects in LLM Systems](https://arxiv.org/html/2509.14404v1) - MEDIUM confidence
- [Qualaroo: Survey Fatigue Guide](https://qualaroo.com/blog/getting-customers-to-respond-in-a-world-of-survey-fatigue/) - MEDIUM confidence
- [AIMultiple: Online Survey Challenges 2026](https://research.aimultiple.com/online-survey-challenges/) - MEDIUM confidence
- [DEV.to: Why Your LLM Returns "Sure! Here's the JSON"](https://dev.to/acartag7/why-your-llm-returns-sure-heres-the-json-and-how-to-fix-it-2b1g) - LOW confidence
- [Agenta: Guide to Structured Outputs and Function Calling](https://agenta.ai/blog/the-guide-to-structured-outputs-and-function-calling-with-llms) - LOW confidence
