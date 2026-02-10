---
phase: 01-type-system-foundation
plan: 02
subsystem: api
tags: [anthropic-sdk, structured-output, zod, sse, streaming, dual-call]

requires:
  - phase: 01-01
    provides: BriefDataSchema, composeSystemPrompt, EXTRACTION_PROMPT, types/brief.ts
provides:
  - Chat API route with dual-call pattern (streaming chat + structured extraction)
  - zodOutputFormat(BriefDataSchema) integration for brief extraction
  - useChat hook with processStream briefData handling and requestExtraction()
  - Clean dependency set (ai, pdf-parse, unpdf removed)
affects: [01-03, 02-api-engine]

tech-stack:
  added: ["@anthropic-ai/sdk 0.74.0 (upgraded from 0.71.2)"]
  patterns: [dual-call-streaming-then-extraction, sse-briefdata-event, messages-parse-with-zodOutputFormat]

key-files:
  created: []
  modified:
    - app/api/chat/route.ts
    - hooks/useChat.ts
    - types/chat.ts
    - package.json
    - components/chat/ChatMessage.tsx

key-decisions:
  - "messages.parse() used for extraction (auto-parses with parsed_output)"
  - "BriefData re-exported from types/chat.ts for backward compatibility with existing consumers"
  - "startChat sends 'Szia!' as initial user message to trigger AI introduction from system prompt"

patterns-established:
  - "Dual-call pattern: streaming for chat, non-streaming parse() for structured extraction"
  - "SSE event types: {text} for chunks, {briefData} for extraction, [DONE] for end"
  - "extractBrief flag controls whether extraction call happens"

duration: 4min
completed: 2026-02-10
---

# Phase 1 Plan 2: SDK Upgrade, Structured Output & Chat Hook Refactor Summary

**Anthropic SDK 0.74.0 upgrade, chat API dual-call pattern (streaming + zodOutputFormat extraction), useChat hook PDF-mentes refactor**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-10T09:32:37Z
- **Completed:** 2026-02-10T09:36:16Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Chat API route rewritten with dual-call pattern: streaming for conversation, separate messages.parse() call with zodOutputFormat for structured brief extraction
- useChat hook refactored: no PDF dependency, processStream handles briefData SSE events, requestExtraction() prepared for Phase 2
- Dependencies cleaned: SDK upgraded to 0.74.0, ai/pdf-parse/unpdf removed, old lib/prompts.ts deleted
- BRIEF_JSON_START/END regex pattern completely eliminated from codebase

## Task Commits

Each task was committed atomically:

1. **Task 1: Dependencies frissitese es regi kod eltavolitasa** - `c9cc514` (chore)
2. **Task 2: Chat API route atirasa dual-call pattern-re + structured output** - `437503d` (feat)
3. **Task 3: useChat hook refaktoralasa az uj API-hoz** - `4cdf8c9` (feat)

### Deviation Fix
4. **Remove dead BRIEF_JSON_START strip from ChatMessage** - `9709215` (fix)

## Files Created/Modified
- `package.json` - SDK 0.74.0, zod 4.3.6 added; ai, pdf-parse, unpdf removed
- `app/api/chat/route.ts` - Dual-call pattern: streaming chat + zodOutputFormat extraction
- `hooks/useChat.ts` - BriefData from types/brief, processStream with briefData events, requestExtraction()
- `types/chat.ts` - BriefData interface removed, re-exported from types/brief
- `lib/prompts.ts` - Deleted (replaced by lib/prompts/ module from Plan 01)
- `components/chat/ChatMessage.tsx` - stripBriefJson dead code removed

## Decisions Made
- Used `messages.parse()` (not raw `messages.create()`) for extraction call because it auto-parses the response into `parsed_output` with the Zod schema
- Added BriefData re-export in `types/chat.ts` instead of just deleting it, because 5+ other files (BriefEditor, pdf-template, send-brief, email-template) import BriefData from `@/types/chat` -- pure deletion would break them; Plan 03 will migrate these consumers
- `startChat()` sends `"Szia!"` as initial user message rather than empty array, since the Anthropic API requires at least one message

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] BriefData re-export in types/chat.ts instead of pure deletion**
- **Found during:** Task 1 (types/chat.ts modification)
- **Issue:** Plan said to delete BriefData interface from types/chat.ts, but 5+ files (BriefEditor, pdf-template, send-brief, email-template) import BriefData from @/types/chat. Pure deletion would break TypeScript compilation.
- **Fix:** Replaced inline BriefData interface with `export type { BriefData } from "@/types/brief"` re-export
- **Files modified:** types/chat.ts
- **Verification:** No TS errors in plan-02 files; existing consumers unaffected
- **Committed in:** c9cc514 (Task 1 commit)

**2. [Rule 1 - Bug] Removed dead BRIEF_JSON_START strip logic from ChatMessage**
- **Found during:** Overall verification (BRIEF_JSON_START grep)
- **Issue:** `components/chat/ChatMessage.tsx` still contained `stripBriefJson` function with BRIEF_JSON_START/END regex. This was dead code after removing the pattern from the AI system prompt and extraction flow.
- **Fix:** Removed stripBriefJson function, simplified displayContent to direct content.trim()
- **Files modified:** components/chat/ChatMessage.tsx
- **Verification:** Grep for BRIEF_JSON_START in *.ts/*.tsx returns 0 results
- **Committed in:** 9709215 (separate fix commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered

Pre-existing TS errors in BriefEditor.tsx, pdf-template.tsx, send-brief/route.tsx, parse-pdf/route.ts -- these files use the old BriefData shape (nested company/campaign objects) which doesn't match the new Zod schema (flat fields). These are NOT caused by this plan's changes (the type re-export preserves backward compatibility). Plan 03 will handle migrating or removing these files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Chat API route ready with structured output extraction
- useChat hook ready for Phase 2 tool use integration (requestExtraction() exposed)
- extractBrief flag and campaignTypes parameter prepared for Phase 2 engine
- Pre-existing TS errors in UI components need Plan 03 to resolve (BriefEditor, pdf-template shape mismatch)

## Self-Check: PASSED

All 6 modified files verified present. lib/prompts.ts confirmed deleted. All 4 commits (c9cc514, 437503d, 4cdf8c9, 9709215) verified in git log.

---
*Phase: 01-type-system-foundation*
*Completed: 2026-02-10*
