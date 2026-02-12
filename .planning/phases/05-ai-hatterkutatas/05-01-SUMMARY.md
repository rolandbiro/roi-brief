---
phase: 05-ai-hatterkutatas
plan: 01
subsystem: ai-research
tags: [zod, structured-outputs, claude-api, prompts, template-mapper]

requires:
  - phase: 04-bovitett-adatgyujtes
    provides: "BriefData schema és campaign_types/campaign_goal mezők"
provides:
  - "ResearchResultsSchema Zod schema a structured outputs API-hoz"
  - "selectTemplate() — brief alapján template típus kiválasztás"
  - "RESEARCH_SYSTEM_PROMPT, buildResearchPrompt(), STRUCTURE_SYSTEM_PROMPT"
affects: [05-02, 06-xlsx-dlvr]

tech-stack:
  added: []
  patterns: ["Két lépéses pipeline: research prompt + structure prompt szétválasztás", "KpiEstimate min/likely/max minta metrika becslésekhez"]

key-files:
  created:
    - lib/research/types.ts
    - lib/research/template-mapper.ts
    - lib/research/prompts.ts
  modified: []

key-decisions:
  - "Zod schemák egyszerűek maradtak (no refine/transform) a zodOutputFormat() kompatibilitás miatt"
  - "ChannelRow metrikák mind optional — kampánycéltól függően töltődnek ki"
  - "Template mapper regex-alapú, case-insensitive magyar+angol mintaillesztés"

patterns-established:
  - "KpiEstimate {min, likely, max} minta minden numerikus becsléshez"
  - "safe() helper hiányzó brief mezők kezelésére prompt-okban"

duration: 2min
completed: 2026-02-12
---

# Phase 5 Plan 1: Research Pipeline Alapok Summary

**ResearchResults Zod schema, template mapper és kutatási prompt-ok a két lépéses AI pipeline-hoz**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-12T13:20:54Z
- **Completed:** 2026-02-12T13:22:38Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- ResearchResultsSchema Zod schema a structured outputs API-val kompatibilis (nincs refine/transform)
- selectTemplate() a brief campaign_goal és campaign_types alapján 4 template típus közül választ
- Kutatási prompt-ok ékezetes magyar szöveggel, template-specifikus utasításokkal

## Task Commits

Each task was committed atomically:

1. **Task 1: ResearchResults Zod schema és típus definíciók** - `8a3159b` (feat)
2. **Task 2: Template mapper és research prompt-ok** - `ef9256d` (feat)

## Files Created/Modified
- `lib/research/types.ts` - ResearchResultsSchema + KpiEstimate/ChannelRow/TargetingRow/CampaignSummary Zod schemák és TS típusok, MediaplanTemplate típus
- `lib/research/template-mapper.ts` - selectTemplate() — brief alapján template típus kiválasztás (ppc_traffic/ppc_reach/ppc_mixed/all_channels)
- `lib/research/prompts.ts` - RESEARCH_SYSTEM_PROMPT (web search lépés), buildResearchPrompt() (brief adatok beillesztése), STRUCTURE_SYSTEM_PROMPT (structured output lépés)

## Decisions Made
- Zod schemák egyszerűek maradtak (no refine/transform) a zodOutputFormat() kompatibilitás miatt
- ChannelRow metrikák mind optional — a kampánycéltól függően az AI csak a releváns metrikákat tölti ki
- Template mapper regex-alapú magyar+angol mintaillesztéssel (traffic/forgalom/kattintás stb.)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- A 3 alap fájl (types, template-mapper, prompts) kész, a Plan 02 (pipeline.ts, search.ts, structure.ts) erre építhet
- ResearchResultsSchema közvetlenül használható a zodOutputFormat() helper-rel
- Nincs blocker

## Self-Check: PASSED

All files verified present, all commits verified in git log.

---
*Phase: 05-ai-hatterkutatas*
*Completed: 2026-02-12*
