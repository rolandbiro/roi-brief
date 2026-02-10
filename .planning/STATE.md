# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-10)

**Core value:** Az AI asszisztens kampánytípustól függően releváns, szakmai mélységű kérdéseket tesz fel — adaptív kikérdezés, ami profi briefté áll össze.
**Current focus:** Phase 2 in progress — Adaptive Questioning Engine

## Current Position

Phase: 2 of 3 (Adaptive Questioning Engine)
Plan: 2 of 3 in current phase (complete)
Status: Plan 02-02 complete, Plan 02-03 next
Last activity: 2026-02-10 — Plan 02-02 executed (agentic loop + briefState management)

Progress: [██████----] 67% (2/3 plans in Phase 2)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 4min
- Total execution time: 18min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 3/3 | 12min | 4min |
| 02 | 2/3 | 6min | 3min |

**Recent Trend:**
- Last 5 plans: 01-01 (3min), 01-02 (4min), 01-03 (5min), 02-01 (4min), 02-02 (2min)
- Trend: accelerating

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
- 02-01: composeSystemPrompt signature changed to accept BriefState (breaking for route.ts, Plan 02 fixes)
- 02-01: classify_campaign merges types additively (Set-based), not overwrites
- 02-01: Standalone specific schemas extracted for reuse in BriefDataSchema
- 02-02: briefState round-trip via client (KISS, no server session storage)
- 02-02: briefStateRef useRef pattern for closure-safe access in React hooks
- 02-02: Extraction prompt enriched with tool-collected briefData as context
- 02-02: MAX_ITERATIONS = 10 for agentic loop infinite loop protection

### Pending Todos

None.

### Blockers/Concerns

- ~~Phase 2: Multi-turn tool execution SSE stream-en belül~~ — RESOLVED (02-02 agentic loop)
- Phase 3: @react-pdf/renderer conditional rendering bug — tesztelés szükséges (research flag)
- Pre-existing TS errors in BriefEditor, pdf-template, send-brief — Phase 3 scope

## Session Continuity

Last session: 2026-02-10
Stopped at: Completed 02-02-PLAN.md (agentic loop + briefState management)
Resume file: .planning/phases/02-adaptive-questioning-engine/02-02-SUMMARY.md
