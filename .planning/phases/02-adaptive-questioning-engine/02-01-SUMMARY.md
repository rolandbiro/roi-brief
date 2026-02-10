---
phase: 02-adaptive-questioning-engine
plan: 01
subsystem: api
tags: [zod, anthropic-tool-use, prompt-engineering, multi-type-schema]

requires:
  - phase: 01-type-system-foundation
    provides: "BriefBaseSchema, CampaignTypeEnum, type-specific schemas, prompt modules"
provides:
  - "Multi-type BriefDataSchema (campaign_types array + optional type-specific blocks)"
  - "BriefState interface for tool use state tracking"
  - "TOOL_DEFINITIONS (classify_campaign, update_brief) in Anthropic API format"
  - "handleToolExecution with immutable BriefState updates"
  - "Tegező BASE_PROMPT with tool use instructions"
  - "buildQuestioningStrategy for adaptive phase-aware questioning"
  - "composeSystemPrompt(BriefState) dynamic prompt composition"
affects: [02-02-PLAN, 02-03-PLAN]

tech-stack:
  added: []
  patterns:
    - "Virtual tools pattern: server-side state mutation via tool use"
    - "Standalone specific schemas extracted for reuse (MediaSpecificSchema, etc.)"
    - "BriefState-driven prompt composition"

key-files:
  created:
    - "lib/tools/types.ts"
    - "lib/tools/definitions.ts"
    - "lib/tools/handlers.ts"
    - "lib/tools/index.ts"
    - "lib/prompts/questioning.ts"
  modified:
    - "lib/schemas/brief-data.ts"
    - "lib/schemas/media-buying.ts"
    - "lib/schemas/performance.ts"
    - "lib/schemas/brand.ts"
    - "lib/schemas/social.ts"
    - "lib/schemas/index.ts"
    - "lib/schemas/campaign-types.ts"
    - "lib/prompts/base.ts"
    - "lib/prompts/compose.ts"
    - "lib/prompts/extraction.ts"
    - "lib/prompts/index.ts"

key-decisions:
  - "Flat multi-type schema with campaign_types array instead of discriminatedUnion"
  - "Standalone specific schemas (MediaSpecificSchema etc.) extracted and reused in both BriefDataSchema and legacy BriefSchema"
  - "composeSystemPrompt signature changed to accept BriefState (breaking change for chat route, fixed in Plan 02)"
  - "Tool definitions use 'as const' for Anthropic SDK type compatibility"
  - "classify_campaign merges types additively (Set-based), not overwrites"

patterns-established:
  - "deepSet helper for immutable nested field updates in BriefState.briefData"
  - "BriefState phase machine: discovery -> type_confirmed -> questioning -> summary -> complete"

duration: 4min
completed: 2026-02-10
---

# Phase 2 Plan 1: Schema + Tools + Prompts Summary

**Multi-type BriefDataSchema, classify_campaign/update_brief tool infrastruktura, es tegezo adaptiv prompt rendszer**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-10T10:59:14Z
- **Completed:** 2026-02-10T11:03:03Z
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments
- BriefDataSchema atirva multi-tipusra: campaign_types tomb + opcionalis tipusspecifikus blokkok (media_specific, performance_specific, brand_specific, social_specific)
- Tool use infrastruktura kesz: classify_campaign es update_brief definiciok Anthropic API formatumban + handleToolExecution immutabilis BriefState frissitessel
- Tegezo, account manager stilusu prompt rendszer: BASE_PROMPT, buildQuestioningStrategy, composeSystemPrompt(BriefState) dinamikus osszeallitas

## Task Commits

Each task was committed atomically:

1. **Task 1: Multi-tipus BriefData sema + BriefState tipus** - `5949eb4` (feat)
2. **Task 2: Tool definiciok es handlerek** - `17525f8` (feat)
3. **Task 3: Tegezo prompt + adaptiv kerdezesi strategia + compose frissites** - `b550d06` (feat)

## Files Created/Modified
- `lib/schemas/brief-data.ts` - Flat multi-type schema with campaign_types array
- `lib/schemas/media-buying.ts` - Extracted MediaSpecificSchema standalone
- `lib/schemas/performance.ts` - Extracted PerformanceSpecificSchema standalone
- `lib/schemas/brand.ts` - Extracted BrandSpecificSchema standalone
- `lib/schemas/social.ts` - Extracted SocialSpecificSchema standalone
- `lib/schemas/index.ts` - Added standalone specific schema exports
- `lib/schemas/campaign-types.ts` - Fixed Hungarian accents in CAMPAIGN_TYPE_LABELS
- `lib/tools/types.ts` - BriefState, tool input/output types, createInitialBriefState
- `lib/tools/definitions.ts` - TOOL_DEFINITIONS array (classify_campaign, update_brief)
- `lib/tools/handlers.ts` - handleToolExecution with deepSet helper
- `lib/tools/index.ts` - Public API re-exports
- `lib/prompts/base.ts` - Tegező BASE_PROMPT with tool use instructions
- `lib/prompts/questioning.ts` - buildQuestioningStrategy (phase-aware, dynamic)
- `lib/prompts/compose.ts` - composeSystemPrompt(BriefState) with strategy + type modules
- `lib/prompts/extraction.ts` - Multi-type extraction prompt (campaign_types)
- `lib/prompts/index.ts` - Added buildQuestioningStrategy export

## Decisions Made
- Flat multi-type schema: campaign_types array + optional specific blocks (instead of discriminatedUnion) -- enables multi-type briefs
- Standalone specific schemas extracted separately, legacy BriefSchema still references them -- backward compat
- composeSystemPrompt signature changed: BriefState param instead of CampaignType[] -- breaking for chat route.ts (Plan 02 scope)
- classify_campaign merges types additively (Set-based) -- existing types preserved when new ones detected
- CAMPAIGN_TYPE_LABELS fixed to proper Hungarian accents (Mediavasarlas -> Mediavasarlas)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CAMPAIGN_TYPE_LABELS missing Hungarian accents**
- **Found during:** Task 3 (prompt system)
- **Issue:** CAMPAIGN_TYPE_LABELS had ASCII-only text "Mediavasarlas" instead of proper Hungarian
- **Fix:** Changed to "Mediavasarlas" with proper accents
- **Files modified:** lib/schemas/campaign-types.ts
- **Verification:** File content verified
- **Committed in:** b550d06 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minimal -- accent fix was cosmetic but aligned with project MEMORY.md rules

## Issues Encountered
- Expected TS error in app/api/chat/route.ts:29 due to composeSystemPrompt signature change (CampaignType[] -> BriefState). This is documented in the plan as Plan 02 scope.
- Pre-existing TS errors in BriefEditor, pdf-template, email-template, send-brief -- Phase 3 scope (documented in STATE.md blockers).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Multi-type schema, tool infra, and adaptive prompt system ready for Plan 02 (agentic loop in chat route)
- chat/route.ts needs composeSystemPrompt call updated to pass BriefState (Plan 02 scope)
- BriefState and tool infrastructure ready for SSE streaming integration

## Self-Check: PASSED

All 16 files verified present. All 3 commit hashes verified in git log.

---
*Phase: 02-adaptive-questioning-engine*
*Completed: 2026-02-10*
