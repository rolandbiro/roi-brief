---
phase: 05-ai-hatterkutatas
plan: 02
subsystem: ai-research
tags: [claude-api, web-search, structured-outputs, pipeline, anthropic-sdk]

requires:
  - phase: 05-ai-hatterkutatas
    plan: 01
    provides: "ResearchResultsSchema, selectTemplate(), prompt-ok"
  - phase: 04-bovitett-adatgyujtes
    provides: "BriefData schema, approve route, after() callback"
provides:
  - "runWebSearch() — Claude API + web_search tool, pause_turn kezelés"
  - "structureResults() — Claude API + zodOutputFormat, ResearchResults output"
  - "runResearchPipeline() — end-to-end orchestrator (template -> search -> structure)"
  - "Approve route fire-and-forget research pipeline integration"
affects: [06-xlsx-dlvr]

tech-stack:
  added: []
  patterns: ["Két lépéses API pipeline: web search (citations) -> structured output (zodOutputFormat) szétválasztás", "pause_turn loop az extended web search session-ökhöz", "fire-and-forget after() callback pattern research pipeline trigger-hez"]

key-files:
  created:
    - lib/research/search.ts
    - lib/research/structure.ts
    - lib/research/pipeline.ts
  modified:
    - app/api/approve/route.ts

key-decisions:
  - "Web search és structured output két külön API hívásban — citations inkompatibilis az output_config-gal"
  - "pause_turn loop a search step-ben — az API megszakíthatja a web search-öt, a loop folytatja"
  - "maxDuration=120 a Vercel timeout kezeléshez az after() callback-ben"
  - "Pipeline results egyelőre elvész (console.log) — Phase 6 oldja meg a persistálást"

patterns-established:
  - "Anthropic web_search_20250305 tool type user_location-nel (HU/Budapest)"
  - "zodOutputFormat() helper Zod schemából structured output format generáláshoz"
  - "Pipeline fail-fast: nincs catch a pipeline-ban, a hívó (approve route) kezeli"

duration: 2min
completed: 2026-02-12
---

# Phase 5 Plan 2: Research Pipeline Implementation Summary

**Két lépéses Claude API pipeline (web search + structured output) az approve endpoint fire-and-forget research trigger-rel**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-12T13:24:41Z
- **Completed:** 2026-02-12T13:26:46Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Web search modul pause_turn loop kezeléssel a folyamatos kutatási session-ökhöz
- Structured output modul zodOutputFormat-tal a ResearchResults schema kényszerítéséhez
- Pipeline orchestrator: template select -> web search -> structure -> ResearchResults
- Approve route bekötés: fire-and-forget research pipeline trigger az after() callback-ben, maxDuration=120

## Task Commits

Each task was committed atomically:

1. **Task 1: Web search és structured output Claude API hívások** - `fc55197` (feat)
2. **Task 2: Pipeline orchestrator és approve route bekötés** - `c441598` (feat)

## Files Created/Modified
- `lib/research/search.ts` - runWebSearch(): Claude API + web_search_20250305 tool, pause_turn loop, HU lokáció
- `lib/research/structure.ts` - structureResults(): Claude API + zodOutputFormat, ResearchResultsSchema → JSON parse
- `lib/research/pipeline.ts` - runResearchPipeline(): orchestrator (selectTemplate → runWebSearch → structureResults)
- `app/api/approve/route.ts` - runResearchPipeline import, after() callback bekötés, maxDuration=120

## Decisions Made
- Web search és structured output két külön API hívásban fut — a citations mechanizmus inkompatibilis az output_config-gal (Anthropic API korlátozás)
- pause_turn loop implementálva a search step-ben — ha az API megszakítja a web search-öt, a loop automatikusan folytatja az eddigi context-tel
- maxDuration=120 beállítva az approve route-on a Vercel timeout kezeléshez (az after() callback-nek kell az idő a pipeline futtatásához)
- A pipeline eredménye egyelőre console.log-ba megy — Phase 6 fogja megoldani a persistálást és PM értesítést

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. ANTHROPIC_API_KEY env var a korábban (Phase 5 research) konfigurált.

## Next Phase Readiness
- A teljes Phase 5 AI háttérkutatás pipeline kész: approve → pipeline → search → structure → ResearchResults
- Phase 6 (XLSX+DLVR) folytathatja a ResearchResults persistálásával és PM értesítéssel
- Nincs blocker

## Self-Check: PASSED

All files verified present, all commits verified in git log.

---
*Phase: 05-ai-hatterkutatas*
*Completed: 2026-02-12*
