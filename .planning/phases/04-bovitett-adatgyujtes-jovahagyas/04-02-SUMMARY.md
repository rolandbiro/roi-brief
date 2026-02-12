---
phase: 04-bovitett-adatgyujtes-jovahagyas
plan: 02
subsystem: ai-prompts
tags: [claude, prompt-engineering, questioning-strategy, agency-brief]

# Dependency graph
requires:
  - phase: 02-ai-conversational-engine
    provides: "prompt compose pipeline (base + questioning + type modules)"
provides:
  - "Agency Brief szekció-alapú kikérdezési sorrend (8 szekció)"
  - "Szekciónkénti haladás-követés a questioning stratégiában"
  - "Típusspecifikus modulok átfedés-kezelése"
  - "Cég/márka nyitású bemutatkozás"
affects: [04-03, 05-ai-research]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Section-based field grouping for progress tracking"
    - "Overlap prevention blocks in type-specific modules"

key-files:
  created: []
  modified:
    - lib/prompts/base.ts
    - lib/prompts/questioning.ts
    - lib/prompts/types/media-buying.ts
    - lib/prompts/types/performance.ts
    - lib/prompts/types/brand.ts
    - lib/prompts/types/social.ts

key-decisions:
  - "A bemutatkozás cég/márkáról kérdez először, nem kampány célról"
  - "9 pontos kikérdezési sorrend az Agency Brief szekciók mentén"
  - "contact_name a záró blokkba került (9. pont)"
  - "Checkbox mezők (ad_channels, kpis, stb.) suggest_quick_replies-szal"

patterns-established:
  - "Section field groups: company, campaign, channel, target, timing, budget, competitor, closing"
  - "Overlap prevention: type modules check existing field values before asking"

# Metrics
duration: 3min
completed: 2026-02-12
---

# Phase 4 Plan 2: Prompt rendszer átírás Summary

**Agency Brief szekció-alapú kikérdezési sorrend 8 szekcióval, cég/márka nyitással, és típusmodul átfedés-kezeléssel**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T11:57:16Z
- **Completed:** 2026-02-12T11:59:47Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- BASE_PROMPT átírva: cég/márka bemutatkozás, 9 pontos kikérdezési sorrend, complete_brief blokkolás company_name + campaign_goal nélkül
- buildQuestioningStrategy átírva: 8 szekciós haladás-követés, checkbox mező opciók, fázis-specifikus útmutatás
- Mind a 4 típusspecifikus modul (media-buying, performance, brand, social) kapott ÁTFEDÉS-KEZELÉS blokkot

## Task Commits

Each task was committed atomically:

1. **Task 1: BASE_PROMPT átírás** - `349111a` (feat)
2. **Task 2: Kérdezési stratégia + típusspecifikus modulok** - `fcd1515` (feat)

## Files Created/Modified
- `lib/prompts/base.ts` - Átírt BASE_PROMPT: cég/márka nyitás, 9 pontos sorrend, tool szabályok
- `lib/prompts/questioning.ts` - Átírt buildQuestioningStrategy: szekciónkénti haladás, checkbox mezők
- `lib/prompts/types/media-buying.ts` - ÁTFEDÉS-KEZELÉS blokk: ad_channels vs Médiatípusok
- `lib/prompts/types/performance.ts` - ÁTFEDÉS-KEZELÉS blokk: kpis vs konverziós események
- `lib/prompts/types/brand.ts` - ÁTFEDÉS-KEZELÉS blokk: brand_positioning vs Pozicionálás
- `lib/prompts/types/social.ts` - ÁTFEDÉS-KEZELÉS blokk: ad_channels vs Platformok

## Decisions Made
- A bemutatkozás cég/márkáról kérdez először ("mesélj kérlek a cégedről"), nem kampány célról ("melyik cég nevében keresed")
- 9 pontos kikérdezési sorrend az Agency Brief szekciók logikus sorrendjében
- contact_name a záró blokkba (9. pont) került, nem az eleje
- Checkbox mezők (ad_channels, kpis, creative_types, creative_source, gender) suggest_quick_replies-szal kezelve

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- A prompt rendszer kész az Agency Brief szekció-alapú kikérdezésre
- A compose.ts nem változott (ugyanúgy importálja a base.ts-t és questioning.ts-t)
- Következő plan (04-03) erre építhet

## Self-Check: PASSED

All 7 files verified present. Both commit hashes (349111a, fcd1515) found in git log.

---
*Phase: 04-bovitett-adatgyujtes-jovahagyas*
*Completed: 2026-02-12*
