# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-10)

**Core value:** Az AI asszisztens kampánytípustól függően releváns, szakmai mélységű kérdéseket tesz fel — adaptív kikérdezés, ami profi briefté áll össze.
**Current focus:** Phase 3 in progress — PDF template + branding

## Current Position

Phase: 3 of 3 (Dynamic Report & Branding)
Plan: 2 of 4 in current phase (03-02 complete)
Status: Executing Phase 3
Last activity: 2026-02-10 — Completed 03-02 (PDF template rewrite)

Progress: [█████░░░░░] 50% (2/4 plans in Phase 3)

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 4min
- Total execution time: 36min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 3/3 | 12min | 4min |
| 02 | 3/3 | 14min | 5min |
| 03 | 2/4 | 10min | 5min |

**Recent Trend:**
- Last 5 plans: 02-01 (4min), 02-02 (2min), 02-03 (8min), 03-01 (5min), 03-02 (5min)
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: 3 fázis (quick depth) — Foundation, Engine, Report
- Research: Zod v4 + Anthropic SDK ^0.74.0 upgrade szükséges
- Research: Tool use pattern (classify_campaign, update_brief) a regex helyett
- 01-01: campaign_type top-level (not nested) for z.discriminatedUnion compatibility
- 01-01: Type-specific fields in nested objects (media_specific, etc.) for clean separation
- 01-01: composeSystemPrompt accepts CampaignType[] — empty array returns BASE_PROMPT only
- 01-02: messages.parse() used for extraction (auto-parses with parsed_output)
- 01-02: BriefData re-exported from types/chat.ts for backward compat (5+ consumers)
- 01-02: startChat sends "Szia!" as initial user message to trigger AI introduction
- 01-03: Brief page marad /brief route-on (Opció A)
- 01-03: skipAnimation prop a streaming→final átmenet pulzálás ellen
- 02-01: Flat multi-type schema (campaign_types array) replaces discriminatedUnion
- 02-01: composeSystemPrompt signature changed to accept BriefState
- 02-01: classify_campaign merges types additively (Set-based), not overwrites
- 02-02: briefState round-trip via client (KISS, no server session storage)
- 02-02: briefStateRef useRef pattern for closure-safe access in React hooks
- 02-02: Extraction prompt enriched with tool-collected briefData as context
- 02-03: MAX_ITERATIONS increased 10→25 (10 was too low for multi-tool turns)
- 02-03: suggest_quick_replies tool — AI decides when to show quick-reply buttons
- 02-03: Quick replies sent as SSE event after agentic loop completes
- 03-02: PdfLogo uses SVG Path only (no SVG Text) — @react-pdf/renderer SVG Text + custom font problémás
- 03-02: Section definitions duplicated for PDF (View/Text) vs HTML — separate render targets
- 03-02: Executive Summary section at top of PDF with key fields

### Pending Todos

None.

### Blockers/Concerns

- ~~Phase 2: Multi-turn tool execution SSE stream-en belül~~ — RESOLVED (02-02 agentic loop)
- Phase 3: @react-pdf/renderer conditional rendering bug — tesztelés szükséges (research flag)
- ~~Pre-existing TS errors in pdf-template~~ — RESOLVED (03-02 flat schema rewrite)
- Pre-existing TS errors in BriefEditor, send-brief, email-template — remaining Phase 3 scope

## Session Continuity

Last session: 2026-02-10
Stopped at: Completed 03-02-PLAN.md (PDF template rewrite)
Resume file: .planning/phases/03-dynamic-report-branding/03-02-SUMMARY.md
