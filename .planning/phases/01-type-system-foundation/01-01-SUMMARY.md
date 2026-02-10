---
phase: 01-type-system-foundation
plan: 01
subsystem: api
tags: [zod, typescript, discriminated-union, prompt-engineering]

requires:
  - phase: none
    provides: greenfield
provides:
  - BriefDataSchema Zod discriminated union (4 campaign types)
  - BriefBaseSchema with extended base fields
  - Modular prompt system with composeSystemPrompt()
  - EXTRACTION_PROMPT for structured output extraction
  - TypeScript types derived via z.infer (BriefData, BriefBase, CampaignType)
affects: [01-02, 01-03, 02-api-engine, 03-report-generation]

tech-stack:
  added: [zod (already installed v4.3.5)]
  patterns: [zod-single-source-of-truth, discriminated-union-top-level-key, modular-prompt-composition]

key-files:
  created:
    - lib/schemas/brief-base.ts
    - lib/schemas/campaign-types.ts
    - lib/schemas/media-buying.ts
    - lib/schemas/performance.ts
    - lib/schemas/brand.ts
    - lib/schemas/social.ts
    - lib/schemas/brief-data.ts
    - lib/schemas/index.ts
    - lib/prompts/base.ts
    - lib/prompts/types/media-buying.ts
    - lib/prompts/types/performance.ts
    - lib/prompts/types/brand.ts
    - lib/prompts/types/social.ts
    - lib/prompts/compose.ts
    - lib/prompts/extraction.ts
    - lib/prompts/index.ts
    - types/brief.ts
  modified: []

key-decisions:
  - "campaign_type top-level (not nested) for z.discriminatedUnion compatibility"
  - "Type-specific fields in nested objects (media_specific, performance_specific, etc.) for clean separation"
  - "composeSystemPrompt accepts CampaignType[] — empty array returns BASE_PROMPT only"

patterns-established:
  - "Zod as single source of truth: schema -> z.infer -> TypeScript type"
  - "BriefBaseSchema.extend() for type-specific schemas"
  - "Modular prompt composition: base + type modules joined dynamically"
  - "Re-export pattern: types/brief.ts re-exports from lib/schemas"

duration: 3min
completed: 2026-02-10
---

# Phase 1 Plan 1: Zod Schemas & Modular Prompt System Summary

**Zod discriminated union BriefData schema (4 kampanytipus) es modularis prompt rendszer composeSystemPrompt()-tal**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-10T09:26:58Z
- **Completed:** 2026-02-10T09:29:55Z
- **Tasks:** 3
- **Files modified:** 17

## Accomplishments
- BriefDataSchema with z.discriminatedUnion on top-level campaign_type, 4 type-specific schemas extending BriefBaseSchema
- Modular prompt system: BASE_PROMPT + 4 type modules + composeSystemPrompt() for dynamic assembly
- EXTRACTION_PROMPT for structured output brief data extraction (replaces BRIEF_JSON_START/END pattern)
- types/brief.ts re-export layer for backward compatibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Zod schemak definialasa** - `5f74935` (feat)
2. **Task 2: Modularis prompt rendszer** - `7666041` (feat)
3. **Task 3: TypeScript tipus re-export** - `8b9ba35` (feat)

## Files Created/Modified
- `lib/schemas/campaign-types.ts` - CampaignTypeEnum, CampaignType type, CAMPAIGN_TYPE_LABELS
- `lib/schemas/brief-base.ts` - BriefBaseSchema with extended base fields (10 fields)
- `lib/schemas/media-buying.ts` - MediaBuyingBriefSchema with media_specific (6 fields)
- `lib/schemas/performance.ts` - PerformanceBriefSchema with performance_specific (6 fields)
- `lib/schemas/brand.ts` - BrandBriefSchema with brand_specific (6 fields)
- `lib/schemas/social.ts` - SocialBriefSchema with social_specific (6 fields)
- `lib/schemas/brief-data.ts` - BriefDataSchema discriminated union
- `lib/schemas/index.ts` - Re-exports all schemas and types
- `lib/prompts/base.ts` - BASE_PROMPT (ROI Works assistant personality)
- `lib/prompts/types/media-buying.ts` - MEDIA_BUYING_MODULE
- `lib/prompts/types/performance.ts` - PERFORMANCE_MODULE
- `lib/prompts/types/brand.ts` - BRAND_MODULE
- `lib/prompts/types/social.ts` - SOCIAL_MODULE
- `lib/prompts/compose.ts` - composeSystemPrompt(types: CampaignType[])
- `lib/prompts/extraction.ts` - EXTRACTION_PROMPT for structured output
- `lib/prompts/index.ts` - Re-exports all prompts
- `types/brief.ts` - Re-export layer for @/types/brief path

## Decisions Made
- campaign_type is a top-level field (not nested in an object) because z.discriminatedUnion only supports top-level discriminator keys
- Type-specific fields are grouped in nested objects (media_specific, performance_specific, brand_specific, social_specific) for clean separation while keeping campaign_type at root level
- composeSystemPrompt() returns only BASE_PROMPT when called with empty types array (campaign type not yet known)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Zod schemas ready for Plan 02 (API route refactoring with structured output)
- Prompt system ready for composeSystemPrompt() integration in chat route
- types/brief.ts provides clean import path for consumer modules
- Old lib/prompts.ts and types/chat.ts BriefData interface remain untouched (Plan 02-03 will migrate consumers)

## Self-Check: PASSED

All 17 created files verified present. All 3 task commits (5f74935, 7666041, 8b9ba35) verified in git log.

---
*Phase: 01-type-system-foundation*
*Completed: 2026-02-10*
