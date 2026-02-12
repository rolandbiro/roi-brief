# Architecture Patterns

**Domain:** Enhanced Brief + AI Background Research integration into existing Next.js brief assistant
**Researched:** 2026-02-12
**Focus:** Integration architecture for v1.1 features (extended data, approval flow, background AI research, xlsx generation, PM email)

## Existing Architecture (v1.0 -- What We're Extending)

```
User -> [Landing] -> [/brief chat page]
                          |
                     useChat hook -> POST /api/chat (SSE stream)
                          |                |
                     briefState           Claude API (claude-sonnet-4)
                     round-trip            tool_use agentic loop:
                          |                  classify_campaign
                          |                  update_brief
                          |                  suggest_quick_replies
                          |                  complete_brief
                          |
                     phase: "complete" -> requestExtraction -> BriefEditor
                          |
                     [Email input] -> POST /api/send-brief -> PDF + SendGrid email
                     [PDF download] -> POST /api/download-pdf -> PDF blob
```

**Key existing constraints:**
- Stateless server -- briefState lives on client, sent with every POST
- SSE streaming with server-side tool execution loop (MAX_ITERATIONS=25)
- BriefEditor is read-only (no editing), requires email for approval
- SendGrid already handles PDF attachments (base64 encoded)
- Vercel serverless deployment (Fluid Compute default: 300s, max: 800s on Pro)

## v1.1 Target Flow

```
User -> [Landing] -> [/brief chat page]
                          |
                     EXTENDED chat (more business fields via update_brief)
                          |
                     phase: "complete" -> requestExtraction -> BriefEditor (revised)
                          |
                     [PDF download -- NO email required]
                     [Approve button] -> POST /api/approve-brief
                          |                    |
                     "Koeszoenoek" page         fires background AI research
                     (client session ENDS)       via after() / waitUntil()
                                                     |
                                                AI research pipeline:
                                                  1. Claude + web_search tool
                                                  2. Channel mix, targeting, KPI
                                                  3. Competitor analysis
                                                     |
                                                xlsx generation (ExcelJS)
                                                  - Agency Brief template
                                                  - Mediaplan template
                                                     |
                                                PM email via SendGrid
                                                  - xlsx attachments
                                                  - research summary HTML
```

## Component Boundaries

| Component | Responsibility | New/Modified | Communicates With |
|-----------|---------------|--------------|-------------------|
| **Chat API** (`app/api/chat/route.ts`) | Agentic loop, tool execution, SSE streaming | MODIFIED -- extended tool definitions, new fields | Claude API, client |
| **Tool definitions** (`lib/tools/definitions.ts`) | Tool schemas for Claude | MODIFIED -- extend update_brief field descriptions | Chat API |
| **Tool handlers** (`lib/tools/handlers.ts`) | Server-side tool execution | MODIFIED -- validate new fields | Chat API |
| **BriefState types** (`lib/tools/types.ts`) | briefState interface | MODIFIED -- no structural change, briefData accumulates new fields | All |
| **Schemas** (`lib/schemas/`) | Zod validation for BriefData | MODIFIED -- add new business fields to BriefBaseSchema | Extraction, validation |
| **Prompts** (`lib/prompts/`) | System prompt composition | MODIFIED -- extend question modules with new business fields | Chat API |
| **BriefEditor** (`components/BriefEditor.tsx`) | Review + approval UI | MODIFIED -- remove email requirement, add approve button, PDF download | useChat, approve API |
| **brief-sections** (`lib/brief-sections.ts`) | Section definitions for rendering | MODIFIED -- add new field definitions | BriefEditor, email, PDF |
| **Approve API** (`app/api/approve-brief/route.ts`) | Accept briefData, trigger background research | **NEW** | BriefEditor, research pipeline |
| **Research pipeline** (`lib/research/pipeline.ts`) | Orchestrate AI research calls | **NEW** | Claude API (web_search), approve API |
| **Research prompts** (`lib/research/prompts.ts`) | System prompts for research AI | **NEW** | Research pipeline |
| **Xlsx generator** (`lib/xlsx/generate.ts`) | Fill xlsx templates with data | **NEW** | Research pipeline, xlsx templates |
| **PM email sender** (`lib/research/send-results.ts`) | Send xlsx + summary to PM | **NEW** | SendGrid, research pipeline |

## Critical Architecture Decision: Background Research Without Persistence

### The Problem

After the client approves the brief and leaves, the server must:
1. Run AI research (multiple Claude calls with web_search -- possibly 30-120s)
2. Generate xlsx files from research results
3. Email results to PM

But: the current architecture is stateless. No database. The client is gone.

### Recommended Solution: `after()` with `waitUntil()` in the Approve API Route

**Use Next.js `after()` (stable since v15.1, available in Next.js 16.1.1) in a dedicated `/api/approve-brief` route.**

```typescript
// app/api/approve-brief/route.ts
import { after } from 'next/server';

export const maxDuration = 300; // 5 minutes (default with Fluid Compute)

export async function POST(request: Request) {
  const { briefData } = await request.json();

  // Validate briefData
  const parsed = BriefDataSchema.safeParse(briefData);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid brief data' }, { status: 400 });
  }

  // Schedule background research AFTER response is sent
  after(async () => {
    try {
      const researchResults = await runResearchPipeline(parsed.data);
      const xlsxBuffers = await generateXlsxFiles(parsed.data, researchResults);
      await sendPmEmail(parsed.data, researchResults, xlsxBuffers);
    } catch (error) {
      console.error('Background research failed:', error);
      // Fallback: send partial results or error notification to PM
      await sendErrorNotification(parsed.data, error);
    }
  });

  // Immediately return success to client
  return Response.json({ success: true });
}
```

**Why this works:**
- `after()` extends the serverless function lifetime via `waitUntil()` under the hood
- The function's `maxDuration` applies to the TOTAL execution (response + after tasks)
- Response returns immediately to client (< 1s) -- client sees "Koeszoenoek" page
- Background task gets the remaining time (up to ~299s) for research
- No database needed -- briefData is passed directly to the pipeline
- No client connection needed -- pipeline runs server-side after response

**Why NOT other options:**

| Option | Why Not |
|--------|---------|
| Keep client connected during research | Bad UX -- client waits 1-3 minutes staring at a spinner. They already approved and want to leave. |
| Add a database (Redis/Postgres) | Over-engineering. We need persistence for ONE async task, not a data layer. The brief is not accessed again after research. |
| External queue (Inngest, QStash) | Extra dependency, extra cost, extra complexity for a single fire-and-forget job. `after()` is built-in. |
| Vercel Cron Job | Not request-driven. Would require persistence to store pending jobs. |

### Time Budget Analysis

Vercel Fluid Compute (Pro plan) default: 300s, configurable up to 800s.

| Step | Estimated Duration | Notes |
|------|--------------------|-------|
| Response to client | < 1s | JSON response, immediate |
| AI research (3-5 web search calls) | 30-90s | Claude + web_search_20250305 tool, $10/1K searches |
| Research analysis (1 Claude call) | 10-20s | Synthesize search results into structured data |
| Xlsx generation (2 files) | 2-5s | ExcelJS read template + fill cells |
| SendGrid email with attachments | 1-3s | Already proven pattern |
| **Total background** | **~45-120s** | Well within 300s default |

**Recommendation:** Keep `maxDuration = 300` (default). Only increase if research consistently times out in production.

**Confidence:** HIGH -- `after()` is stable in Next.js 16, verified in official docs (v16.1.6). Vercel Fluid Compute duration limits verified from official Vercel docs.

## AI Research Pipeline Architecture

### Claude Web Search Tool (Server-Side)

The Anthropic API has a built-in `web_search_20250305` server tool. This executes on Anthropic's servers -- we do NOT need to implement search ourselves.

```typescript
// lib/research/pipeline.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function runResearchPipeline(briefData: BriefData): Promise<ResearchResults> {
  // Single Claude call with web_search tool -- Claude decides what to search
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: buildResearchSystemPrompt(briefData),
    messages: [
      {
        role: 'user',
        content: buildResearchUserPrompt(briefData),
      },
    ],
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 10,
        user_location: {
          type: 'approximate',
          country: 'HU',
          city: 'Budapest',
          timezone: 'Europe/Budapest',
        },
      },
    ],
  });

  // Handle pause_turn (long-running research may pause)
  let finalResponse = response;
  while (finalResponse.stop_reason === 'pause_turn') {
    finalResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: buildResearchSystemPrompt(briefData),
      messages: [
        { role: 'user', content: buildResearchUserPrompt(briefData) },
        { role: 'assistant', content: finalResponse.content },
      ],
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 10,
          user_location: {
            type: 'approximate',
            country: 'HU',
            city: 'Budapest',
            timezone: 'Europe/Budapest',
          },
        },
      ],
    });
  }

  return parseResearchResponse(finalResponse);
}
```

**Key design decisions:**
- Use `web_search_20250305` (Anthropic server-side tool) -- NOT Brave MCP, NOT custom scraping
- Localize to Hungary (`country: 'HU'`) for relevant competitor/market data
- `max_uses: 10` limits cost per brief ($0.10 max for search)
- Handle `pause_turn` stop reason for long research turns
- Non-streaming (we don't need to show progress -- client is gone)

**Cost per brief research:** ~$0.10 (search) + ~$0.05-0.15 (tokens) = **~$0.15-0.25**

**Confidence:** HIGH -- web_search tool verified in official Anthropic docs, pricing confirmed ($10/1K searches), supported on claude-sonnet-4.

### Research Output Structure

```typescript
// lib/research/types.ts
export interface ResearchResults {
  // For Agency Brief xlsx
  channelMix: {
    recommendedChannels: Array<{
      channel: string;
      rationale: string;
      estimatedBudgetShare: string;
    }>;
  };
  targeting: {
    demographics: string;
    interests: string[];
    behaviors: string[];
    lookalike: string;
  };
  kpiEstimates: {
    estimatedReach: string;
    estimatedCpm: string;
    estimatedCpc: string;
    estimatedConversionRate: string;
  };
  competitorAnalysis: Array<{
    name: string;
    website: string;
    adChannels: string[];
    keyMessage: string;
    estimatedBudget: string;
  }>;

  // For Mediaplan xlsx
  mediaplanData: {
    channels: Array<{
      platform: string;
      format: string;
      budget: string;
      impressions: string;
      clicks: string;
      period: string;
    }>;
  };

  // Raw research text for email summary
  summary: string;
  sources: Array<{ url: string; title: string }>;
}
```

## Xlsx Generation Architecture

### Library Choice: ExcelJS

**Use ExcelJS** because it can read existing xlsx templates, modify cells, and preserve formatting (styles, merged cells, conditional formatting).

```typescript
// lib/xlsx/generate.ts
import ExcelJS from 'exceljs';
import path from 'path';

export async function generateAgencyBriefXlsx(
  briefData: BriefData,
  research: ResearchResults
): Promise<Buffer> {
  const templatePath = path.join(
    process.cwd(),
    'docs/ROI_Mediaplan/ROIworks _ TEMPLATE_ Agency campaign brief.xlsx'
  );

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  const ws = workbook.getWorksheet(1);
  if (!ws) throw new Error('Agency brief worksheet not found');

  // Fill cells based on template structure
  // (exact cell mapping TBD during implementation -- requires template analysis)
  fillAgencyBriefCells(ws, briefData, research);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function generateMediaplanXlsx(
  briefData: BriefData,
  research: ResearchResults
): Promise<Buffer> {
  // Select correct mediaplan template based on campaign types
  const templateName = selectMediaplanTemplate(briefData.campaign_types);
  const templatePath = path.join(
    process.cwd(),
    `docs/ROI_Mediaplan/${templateName}`
  );

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  // Fill mediaplan data
  fillMediaplanCells(workbook, briefData, research);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
```

**Why ExcelJS over alternatives:**

| Library | Verdict | Reason |
|---------|---------|--------|
| **ExcelJS** | RECOMMENDED | Reads existing xlsx, preserves themes, modifies cells, writes to Buffer. Most popular (4M+ weekly downloads). |
| xlsx-populate | Alternative | Better style preservation but lower maintenance, fewer downloads. |
| xlsx-template | Not suitable | Placeholder-based (`${field}`) -- our templates have complex merged cells and formatting that need direct cell access. |
| SheetJS (xlsx) | Not suitable for this | Reading is great, but writing with style preservation requires the paid Pro version. |

**Template mapping approach:** The xlsx templates need manual cell-mapping analysis. During implementation, open each template, identify which cells correspond to which data fields, and create a mapping config.

**Confidence:** MEDIUM -- ExcelJS template reading is well-documented, but the exact cell mapping depends on template structure analysis that hasn't been done yet. This is a Phase-specific research task.

## PM Email with Xlsx Attachments

Extends the existing SendGrid pattern from `send-brief/route.tsx`. No new patterns needed.

```typescript
// lib/research/send-results.ts
import sgMail from '@sendgrid/mail';

export async function sendPmEmail(
  briefData: BriefData,
  research: ResearchResults,
  xlsxBuffers: { agencyBrief: Buffer; mediaplan: Buffer }
): Promise<void> {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

  const companyName = briefData.company_name || 'Ismeretlen';

  const msg = {
    to: process.env.PM_EMAIL!, // New env var for PM recipient
    from: {
      email: process.env.SENDGRID_FROM_EMAIL!,
      name: 'ROI Works Brief AI',
    },
    subject: `AI Kutatasi eredmenyek: ${companyName}`,
    html: generateResearchEmailHtml(briefData, research),
    attachments: [
      {
        content: xlsxBuffers.agencyBrief.toString('base64'),
        filename: `agency-brief-${companyName.toLowerCase().replace(/\s+/g, '-')}.xlsx`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: 'attachment' as const,
      },
      {
        content: xlsxBuffers.mediaplan.toString('base64'),
        filename: `mediaplan-${companyName.toLowerCase().replace(/\s+/g, '-')}.xlsx`,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: 'attachment' as const,
      },
    ],
  };

  await sgMail.send(msg);
}
```

**Confidence:** HIGH -- identical pattern to existing `send-brief/route.tsx`, just with xlsx instead of PDF attachments.

## Client Approval Flow (Modified BriefEditor)

### Current Flow (v1.0)
```
BriefEditor -> email input -> "Jovahagy es kuldes" -> /api/send-brief -> success page
```

### New Flow (v1.1)
```
BriefEditor -> PDF download (always available, no email needed)
            -> "Jóváhagyás" button (no email needed)
            -> POST /api/approve-brief { briefData }
            -> "Koeszoenoek" success page (client session ends)
            -> Background: research + xlsx + PM email
```

**Key changes to BriefEditor:**
1. Remove email input requirement for approval (email stays optional, for CC only)
2. PDF download always available as top-level action
3. "Jovahagy" button replaces "Jovahagy es kuldes"
4. Success page says "Thank you" without mentioning email
5. No longer calls `/api/send-brief` -- calls `/api/approve-brief` instead

**The existing `/api/send-brief` route stays** (for potential future use or manual triggering), but is no longer in the primary flow.

## Data Flow Diagram

```
Phase 1: EXTENDED CHAT (existing pattern, expanded)
======================
Client briefState <--SSE--> /api/chat <--> Claude (tool_use loop)
                                            tools: classify_campaign
                                                   update_brief (extended fields)
                                                   suggest_quick_replies
                                                   complete_brief

Phase 2: APPROVAL (new)
=======================
BriefEditor --briefData--> POST /api/approve-brief
                                |
                           return { success: true } immediately
                                |
                           after(() => {
                                |
Phase 3: BACKGROUND RESEARCH (new, server-only)
===============================================
                           runResearchPipeline(briefData)
                                |
                           Claude API + web_search_20250305 tool
                           (non-streaming, server-side only)
                                |
                           ResearchResults
                                |
Phase 4: DOCUMENT GENERATION (new, server-only)
================================================
                           generateAgencyBriefXlsx(briefData, research)
                           generateMediaplanXlsx(briefData, research)
                                |
                           Buffer[] (xlsx files)
                                |
Phase 5: PM NOTIFICATION (extends existing SendGrid)
=====================================================
                           sendPmEmail(briefData, research, xlsxBuffers)
                                |
                           SendGrid email with xlsx attachments
                           })
```

## New vs Modified Components Summary

### New Files

| File | Purpose | Dependencies |
|------|---------|-------------|
| `app/api/approve-brief/route.ts` | Approval endpoint, triggers background research | Research pipeline, Next.js `after()` |
| `lib/research/pipeline.ts` | Orchestrates AI research with web_search tool | Anthropic SDK, research prompts |
| `lib/research/prompts.ts` | System + user prompts for research AI | BriefData types |
| `lib/research/types.ts` | ResearchResults interface | -- |
| `lib/research/send-results.ts` | PM email with xlsx attachments | SendGrid, xlsx generator |
| `lib/xlsx/generate.ts` | Fill xlsx templates from briefData + research | ExcelJS, xlsx templates |
| `lib/xlsx/cell-mapping.ts` | Cell address mapping for each xlsx template | Template analysis (manual) |

### Modified Files

| File | Change | Impact |
|------|--------|--------|
| `lib/schemas/brief-base.ts` | Add new business fields (contact person, phone, KPI, message, etc.) | Schema changes propagate to tools, prompts, sections |
| `lib/schemas/` type-specific | Extend type-specific fields for research inputs | Same as above |
| `lib/prompts/base.ts` | Extend questioning to cover new business fields | More comprehensive data collection |
| `lib/prompts/types/*.ts` | Extend type-specific question modules | Same |
| `lib/tools/definitions.ts` | Extend update_brief field descriptions for new fields | AI knows about new fields |
| `lib/brief-sections.ts` | Add new field definitions to sections | BriefEditor, email, PDF show new fields |
| `lib/email-template.ts` | Add new section renderers for new fields | Email output includes new data |
| `lib/pdf-template.tsx` | Add new section renderers | PDF output includes new data |
| `components/BriefEditor.tsx` | Remove email requirement, add approve button, change success flow | UX change |
| `app/brief/page.tsx` | Update success state handling | Minor |
| `package.json` | Add `exceljs` dependency | -- |

### Unchanged Files

| File | Why Unchanged |
|------|---------------|
| `app/api/chat/route.ts` | Agentic loop stays the same -- just processes new fields naturally |
| `lib/tools/handlers.ts` | `update_brief` handler is generic (deepSet) -- works with any field path |
| `lib/tools/types.ts` | BriefState.briefData is `Record<string, unknown>` -- accepts any shape |
| `hooks/useChat.ts` | SSE processing unchanged -- briefState updates are shape-agnostic |
| `components/chat/` | Chat UI components unaffected |

## Anti-Patterns to Avoid

### Anti-Pattern 1: Streaming Research Results to Client

**What:** Trying to show real-time research progress to the user.
**Why bad:** The client has already approved and left. Even if kept connected, the UX of watching AI search the web for 1-2 minutes is poor. The PM is the consumer of research, not the client.
**Instead:** Fire-and-forget via `after()`. Client gets immediate "Koeszoenoek" response.

### Anti-Pattern 2: Storing briefData in a Database for Background Processing

**What:** Saving the brief to Redis/Postgres, then reading it from the background job.
**Why bad:** Over-engineering. The `after()` closure already has access to `briefData` from the request. No need for persistence when the data flows directly to the pipeline.
**Instead:** Pass `briefData` directly into the `after()` callback. Zero persistence needed.

### Anti-Pattern 3: Running Research in the Chat SSE Stream

**What:** Triggering research during the chat conversation (e.g., as a tool call).
**Why bad:** The chat SSE stream has the same `maxDuration` limit. Research would eat into the user's chat time. Also, research is for the PM, not the client.
**Instead:** Separate approve endpoint with its own `maxDuration` budget.

### Anti-Pattern 4: Creating xlsx from Scratch Instead of Templates

**What:** Generating xlsx files programmatically cell by cell with styles.
**Why bad:** ROI Works has specific branded templates with complex formatting, merged cells, formulas. Recreating this in code is fragile and hard to maintain.
**Instead:** Read existing templates with ExcelJS, fill in data cells, write output. Template updates happen in Excel, not in code.

### Anti-Pattern 5: Putting Research Prompts in the Chat Prompt System

**What:** Reusing `lib/prompts/` for research prompts.
**Why bad:** Chat prompts are conversation-driven (tegező, incremental questions). Research prompts are analytical (structured output, comprehensive analysis). Different goals, different prompt engineering.
**Instead:** Separate `lib/research/prompts.ts` with dedicated research system prompts.

## Scalability Considerations

| Concern | Current (v1.0) | v1.1 Target | Future Risk |
|---------|----------------|-------------|-------------|
| Background processing | None | `after()` within maxDuration | If research needs > 5 min, need external queue (Inngest) |
| Xlsx template maintenance | N/A | 5 templates in docs/ROI_Mediaplan/ | Template changes require cell-mapping updates |
| API cost per brief | ~$0.02 (chat only) | ~$0.20-0.30 (chat + research + search) | 10x increase -- monitor spend |
| Web search relevance | N/A | Hungarian market data quality unknown | May need domain filtering (allowed_domains) |
| Error handling | Chat errors shown to user | Background errors invisible to user | Need PM notification on failure |
| Concurrent briefs | Stateless, unlimited | Background research is CPU/time-bound on Vercel | Heavy load could hit Vercel concurrency limits |

## Build Order (Recommended)

Dependencies dictate this sequence:

```
Phase 1: Extended Data Collection
  - Extend schemas (brief-base.ts, type-specific)
  - Extend prompts (more business questions)
  - Extend brief-sections.ts (new field defs)
  - Update PDF/email templates (new fields)
  NO NEW PATTERNS -- just more fields in existing architecture

Phase 2: Client Approval Flow
  - Modify BriefEditor (remove email req, add approve)
  - Create /api/approve-brief (stub -- returns success, no background yet)
  - Update success page UX
  DEPENDS ON: Phase 1 (schema must be final)

Phase 3: AI Background Research
  - Create lib/research/ module
  - Implement Claude + web_search pipeline
  - Define ResearchResults types
  - Wire into /api/approve-brief via after()
  DEPENDS ON: Phase 2 (approve endpoint exists)

Phase 4: Xlsx Generation + PM Email
  - Add ExcelJS dependency
  - Analyze xlsx templates, create cell mappings
  - Implement template filling
  - Create PM email sender
  - Wire into research pipeline completion
  DEPENDS ON: Phase 3 (research results feed xlsx)
```

**Phase ordering rationale:**
- Phase 1 is the lowest risk -- extends existing patterns, no new architecture
- Phase 2 must come before Phase 3 because the approve endpoint is the trigger for background research
- Phase 3 before Phase 4 because xlsx generation consumes research results
- Each phase delivers independently usable value: P1 = better data, P2 = simpler client UX, P3 = AI insights, P4 = automated PM deliverables

## Sources

- [Next.js `after()` API Documentation](https://nextjs.org/docs/app/api-reference/functions/after) -- HIGH confidence: official docs v16.1.6, stable since v15.1
- [Vercel Functions Duration Configuration](https://vercel.com/docs/functions/configuring-functions/duration) -- HIGH confidence: official docs, Fluid Compute defaults 300s/max 800s on Pro
- [Anthropic Web Search Tool Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) -- HIGH confidence: official API docs, $10/1K searches, server-side execution
- [Vercel `waitUntil()` Changelog](https://vercel.com/changelog/waituntil-is-now-available-for-vercel-functions) -- HIGH confidence: official changelog
- [ExcelJS GitHub](https://github.com/exceljs/exceljs) -- HIGH confidence: 4M+ weekly npm downloads, read/modify/write xlsx with formatting preservation
- [SendGrid Node.js Attachments](https://github.com/sendgrid/sendgrid-nodejs/blob/main/docs/use-cases/attachments.md) -- HIGH confidence: official docs, base64 attachment pattern
- [Anthropic Web Search API Blog](https://claude.com/blog/web-search-api) -- MEDIUM confidence: official blog, pricing and model support
- [Inngest: Next.js Timeouts](https://www.inngest.com/blog/how-to-solve-nextjs-timeouts) -- MEDIUM confidence: alternative approach if after() proves insufficient

---

*Architecture research: 2026-02-12*
*Focus: v1.1 integration patterns for existing Next.js brief assistant*
