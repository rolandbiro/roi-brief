---
phase: 04-bovitett-adatgyujtes-jovahagyas
plan: 01
subsystem: api
tags: [zod, schema, brief, agency-brief, sections]

requires:
  - phase: 03-kampanytipus-es-dinamikus-kerdesek
    provides: "BriefBaseSchema, BriefDataSchema, campaign type schemas, section definitions"
provides:
  - "BriefBaseSchema ~25 Agency Brief mezővel (flat struktúra)"
  - "AGENCY_BRIEF_SECTIONS centralizált szekció definíciók"
  - "update_brief tool teljes mezőlista leírással és tömb érték támogatással"
  - "Extraction prompt teljes Agency Brief mező struktúrával"
affects: [04-02, 04-03, 05, 06]

tech-stack:
  added: []
  patterns:
    - "Centralizált szekció definíciók: egyetlen forrás (brief-sections.ts), pdf/email importálja"
    - "Flat schema struktúra: nincs nested objektum az alap mezőknél"

key-files:
  created: []
  modified:
    - lib/schemas/brief-base.ts
    - lib/brief-sections.ts
    - lib/pdf-template.tsx
    - lib/email-template.ts
    - lib/tools/definitions.ts
    - lib/prompts/extraction.ts

key-decisions:
  - "field.key egységesítés: pdf-template és email-template is key-t használ (nem path-t) — single interface"
  - "EXECUTIVE_SUMMARY szekció eltávolítva — az AGENCY_BRIEF_SECTIONS első szekciója (Alapvető információk) tölti be ezt a szerepet"

patterns-established:
  - "Single source of truth: szekció definíciók kizárólag brief-sections.ts-ben"
  - "Flat schema: alap brief mezők nem nested, típusspecifikus mezők igen (media_specific.* stb.)"

duration: 3min
completed: 2026-02-12
---

# Phase 4 Plan 1: Schema + Szekció Bővítés Summary

**BriefBaseSchema bővítve ~25 Agency Brief mezőre flat struktúrában, szekció definíciók centralizálva brief-sections.ts-be, tool/prompt frissítve**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T11:57:14Z
- **Completed:** 2026-02-12T12:00:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- BriefBaseSchema átírva ~25 Agency Brief mezővel (2 kötelező: company_name, campaign_goal; ~23 optional)
- Régi timing és target_audience mezők eltávolítva, helyettük granulált alternatívák (start_date, end_date, gender, age_range, persona stb.)
- AGENCY_BRIEF_SECTIONS centralizált szekció definíciók a brief-sections.ts-ben, pdf-template és email-template onnan importál
- Duplikált szekció definíciók és helper függvények eltávolítva a pdf-template.tsx és email-template.ts fájlokból
- update_brief tool description tartalmazza az összes mezőnevet, tömb értéket is elfogad
- Extraction prompt bővítve a teljes Agency Brief mező struktúrával szekciónként

## Task Commits

Each task was committed atomically:

1. **Task 1: BriefBaseSchema bővítés + szekció definíciók centralizálás** - `97efe23` (feat)
2. **Task 2: update_brief tool description frissítés + extraction prompt bővítés** - `a18e424` (feat)

## Files Created/Modified
- `lib/schemas/brief-base.ts` - BriefBaseSchema ~25 Agency Brief mezővel, flat struktúra
- `lib/brief-sections.ts` - AGENCY_BRIEF_SECTIONS centralizált szekció definíciók, helperek exportálva
- `lib/pdf-template.tsx` - Lokális definíciók törölve, importálás brief-sections.ts-ből
- `lib/email-template.ts` - Lokális definíciók törölve, importálás brief-sections.ts-ből
- `lib/tools/definitions.ts` - update_brief field description bővítve, value type: string|array
- `lib/prompts/extraction.ts` - Extraction prompt bővítve teljes mező struktúrával

## Decisions Made
- **field.key egységesítés:** A pdf-template és email-template is `key` property-t használ (korábban `path`), így egyetlen FieldDef interface-t kell karbantartani
- **EXECUTIVE_SUMMARY eltávolítva:** Az AGENCY_BRIEF_SECTIONS első szekciója ("Alapvető információk") tölti be az összefoglaló szerepet — nincs szükség külön Executive Summary szekcióra

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema és szekció definíciók készen állnak a Plan 02 (adaptív prompt rendszer) és Plan 03 (UI komponensek) számára
- A BriefData típus automatikusan bővült az új mezőkkel (BriefBaseSchema.extend() pattern)
- Nincs blocker a következő planhez

---
*Phase: 04-bovitett-adatgyujtes-jovahagyas*
*Completed: 2026-02-12*
