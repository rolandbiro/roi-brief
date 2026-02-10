# Codebase Concerns

**Analysis Date:** 2026-02-10

## Tech Debt

**sessionStorage for PDF persistence:**
- Issue: PDF data stored in sessionStorage without validation or size limits. While base64 encoded PDFs are passed through client-side, there's no verification of data integrity after retrieval.
- Files: `app/page.tsx`, `app/brief/page.tsx`
- Impact: Large PDFs could consume browser memory. Data could be corrupted if sessionStorage is cleared during workflow.
- Fix approach: Implement server-side session storage or use URL parameters with proper validation. Add checksum validation before processing stored PDF data.

**Manual JSON extraction from streaming text:**
- Issue: Claude API response is streamed as text and manually parsed for JSON delimiters (`BRIEF_JSON_START`/`BRIEF_JSON_END`) instead of using structured outputs.
- Files: `hooks/useChat.ts` (lines 14-23), `lib/prompts.ts` (lines 51-68)
- Impact: Fragile parsing - if AI response format changes slightly, JSON extraction fails silently. No type validation on extracted data.
- Fix approach: Switch to Claude's structured outputs API (newer models support this) or implement robust JSON extraction with fallback parsing.

**Deep clone for state updates:**
- Issue: Using `JSON.parse(JSON.stringify(prev))` for deep cloning in `BriefEditor` is inefficient and can fail with non-serializable values.
- Files: `components/BriefEditor.tsx` (lines 20-29)
- Impact: If BriefData ever contains functions, dates, or other non-serializable types, cloning silently loses data.
- Fix approach: Use a proper immutable update library (immer) or implement typed shallow updates for specific fields.

**Base64 string manipulation without validation:**
- Issue: PDF extraction uses `result.split(",")[1]` without checking if the split succeeded or validating base64 format.
- Files: `lib/utils.ts` (line 15), `components/PdfUpload.tsx` (line 36)
- Impact: Malformed base64 passed to API could cause cryptic errors. No early validation of file conversion.
- Fix approach: Add utility function to validate base64 format before sending to API endpoints.

## Known Bugs

**PDF parsing silently fails:**
- Symptoms: If PDF extraction via `/api/parse-pdf` fails, `startChat()` is called with empty string but chat proceeds anyway (line 74 in `app/brief/page.tsx`)
- Files: `app/brief/page.tsx` (lines 72-75)
- Trigger: Upload a corrupted PDF or an image with .pdf extension
- Workaround: Chat will work but with no PDF context - user feedback is minimal

**Brief data optional in TypeScript but assumed non-null in templates:**
- Symptoms: `BriefEditor` receives `initialData: BriefData` (non-nullable) but `useChat` hook has `briefData: BriefData | null` (nullable)
- Files: `components/BriefEditor.tsx` (line 8), `hooks/useChat.ts` (line 11)
- Trigger: Rapid navigation or state desynchronization could pass null to BriefEditor
- Workaround: None - this would cause runtime error

**ChatContainer filters system messages with hardcoded string match:**
- Symptoms: Messages containing "Az ügyfél feltöltötte" are always hidden, even if user legitimately types this phrase
- Files: `components/chat/ChatContainer.tsx` (line 33)
- Trigger: User replies "Az ügyfél feltöltötte azt..." would be hidden from chat
- Workaround: Refactor to use message type/flag instead of string matching

## Security Considerations

**API keys exposed to client:**
- Risk: `ANTHROPIC_API_KEY` used directly on client-side in test scenarios, though actual implementation uses server endpoint `/api/chat`
- Files: `app/api/chat/route.ts` (line 5)
- Current mitigation: API key is server-side only (correct), but code shows API is always initialized
- Recommendations: Add explicit checks to prevent API client instantiation in browser environment. Add request rate limiting on `/api/chat` endpoint.

**Email addresses stored unencrypted:**
- Risk: Client email stored in `BriefData` and sent in POST to `/api/send-brief`. No TLS validation visible.
- Files: `app/api/send-brief/route.tsx` (lines 36-40), `components/BriefEditor.tsx` (lines 156-165)
- Current mitigation: Assumed to be HTTPS in production
- Recommendations: Add validation for email format before sending. Log email send attempts (not contents) for audit trail.

**SendGrid API key validation incomplete:**
- Risk: SendGrid errors only check `code === 401` and `code === 403` - other auth failures (429, 500) treated generically
- Files: `app/api/send-brief/route.tsx` (lines 68-81)
- Current mitigation: Generic error message shown to user
- Recommendations: Add structured error logging for all SendGrid failures. Implement retry logic with exponential backoff for transient failures.

**PDF upload accepts any MIME type with .pdf extension:**
- Risk: File type checked with `file.type !== "application/pdf"` but MIME type is client-reported and can be spoofed
- Files: `components/PdfUpload.tsx` (line 20)
- Current mitigation: Server-side extraction will fail on invalid PDF
- Recommendations: Add server-side MIME type validation. Implement file signature verification (PDF starts with `%PDF`).

## Performance Bottlenecks

**Unbounded chat message history in state:**
- Problem: All messages stored in React state without pagination or virtual scrolling. 100+ message conversation could cause lag.
- Files: `hooks/useChat.ts` (line 8), `components/chat/ChatContainer.tsx` (line 30)
- Cause: Messages array grows unbounded. No truncation or archival.
- Improvement path: Implement windowed scroll virtualization for messages. Store full history server-side, only keep recent 20-30 in state.

**Large PDF base64 strings in memory:**
- Problem: PDF converted to base64 string and kept in sessionStorage + passed through multiple fetch requests
- Files: `app/page.tsx` (line 15), `app/brief/page.tsx` (line 70)
- Cause: Base64 encoding increases size by 33% vs binary. Stored in both session and state.
- Improvement path: Use File API with Blob instead of base64. Send binary data directly to API with proper headers.

**No streaming for PDF parsing results:**
- Problem: Entire PDF text extraction waits for completion before rendering
- Files: `app/api/parse-pdf/route.ts`
- Cause: `unpdf.extractText()` is awaited fully before responding
- Improvement path: Stream extracted text chunks back to client as they're available. Show incremental parsing progress.

**BriefEditor renders all sections simultaneously:**
- Problem: All 8+ sections render with stagger animations even if user never scrolls down
- Files: `components/BriefEditor.tsx` (lines 339-384)
- Cause: No lazy loading of below-fold sections
- Improvement path: Implement code splitting or conditional rendering for sections below viewport.

## Fragile Areas

**Claude model hardcoded:**
- Files: `app/api/chat/route.ts` (line 20)
- Why fragile: `claude-sonnet-4-20250514` is hardcoded. If model is deprecated or unavailable, entire app breaks.
- Safe modification: Extract to environment variable. Implement model availability check on startup.
- Test coverage: No tests - would need integration test with Claude API.

**System prompt inline without versioning:**
- Files: `lib/prompts.ts` (lines 1-68)
- Why fragile: Long prompt with specific formatting expectations mixed with code. If prompt structure changes, JSON extraction breaks.
- Safe modification: Version prompts with git history. Test JSON extraction separately. Add prompt validation tests.
- Test coverage: None - parsing logic only tested with real API responses.

**BriefData type must match Claude's JSON output exactly:**
- Files: `types/chat.ts`, `hooks/useChat.ts` (line 18)
- Why fragile: If Claude generates slightly different field names or structure, `JSON.parse()` succeeds but data is incomplete/wrong.
- Safe modification: Add Zod schema validation after parsing. Implement migration layer for field renames.
- Test coverage: No unit tests for JSON parsing.

**nextConfig and environment setup incomplete:**
- Files: Project has no `next.config.js` visible in exploration
- Why fragile: Build configuration is implicit/default. If special handling needed (streaming, middleware, custom server), would require file creation.
- Safe modification: Create explicit `next.config.ts` with documented settings. Document all required environment variables in `.env.example`.
- Test coverage: None - build only tested manually.

## Scaling Limits

**EmailHandler sends emails sequentially:**
- Current capacity: Can handle ~10-20 concurrent brief submissions before SendGrid rate limits
- Limit: SendGrid free tier has 100 emails/day limit. Multiple recipients per brief multiplies this.
- Scaling path: Implement email queue (Bull/BullMQ on Redis or Vercel KV). Batch send to multiple recipients in single request where possible.

**No pagination for conversation history:**
- Current capacity: ~100 messages before UI lag noticeable
- Limit: 1000+ messages would cause significant memory issues on client
- Scaling path: Implement server-side persistence with pagination API. Only load recent messages on initial load.

**PDF size limit is 10MB client-side only:**
- Current capacity: Large PDFs (~5-10MB) take 2-3 seconds to extract
- Limit: 10MB+ files will timeout or OOM
- Scaling path: Implement chunked upload. Server-side file size limits with friendly error messages. Consider async processing queue for large files.

## Dependencies at Risk

**unpdf package - Low activity:**
- Risk: PDF extraction utility with limited community support. No recent updates visible.
- Impact: Security patches may be delayed. If extraction fails silently, no fallback to alternative library.
- Migration plan: Evaluate pdfjs-dist or pdf-parse as alternatives. Add abstraction layer for PDF extraction.

**@react-pdf/renderer - Maintenance uncertainty:**
- Risk: Used for PDF generation but no recent activity check done
- Impact: If incompatible with future React versions, PDF export breaks
- Migration plan: Monitor releases. Have jsPDF as backup alternative. Test with React 20+ early.

**SendGrid SDK version mismatch risk:**
- Risk: Using `@sendgrid/mail@8.1.6` - check if newer versions have breaking changes
- Impact: Email sending could fail if SDK has unannounced compatibility issues
- Migration plan: Pin version in package.json with comments. Implement email service abstraction to swap providers easily.

## Missing Critical Features

**No error recovery for failed brief generation:**
- Problem: If Claude stops responding mid-brief (timeout, rate limit), user loses all progress
- Blocks: Long workflows can't be interrupted and resumed

**No draft auto-save:**
- Problem: If user closes page after editing brief but before sending, all changes lost
- Blocks: Users with slow connections at risk of losing work

**No conversation export or history:**
- Problem: Brief generation workflow only accessible while session active
- Blocks: Users can't review previous conversation or reuse prompts

**No analytics or monitoring:**
- Problem: No visibility into which briefs fail to send, parse errors, or user drop-off points
- Blocks: Can't identify UX issues or API problems in production

## Test Coverage Gaps

**No tests for PDF extraction:**
- What's not tested: `unpdf.extractText()` success/failure, malformed PDFs, file size limits
- Files: `app/api/parse-pdf/route.ts`
- Risk: Corrupt PDFs silently return empty string with no error logging
- Priority: High - PDF parsing is critical path

**No tests for JSON parsing from Claude response:**
- What's not tested: Missing delimiters, truncated JSON, invalid structure, field type mismatches
- Files: `hooks/useChat.ts` (lines 14-23)
- Risk: Invalid data accepted as valid, causing downstream issues in BriefEditor
- Priority: High - entire workflow depends on this

**No tests for email sending:**
- What's not tested: SendGrid API failures, invalid email addresses, attachment generation, malformed BriefData
- Files: `app/api/send-brief/route.tsx`
- Risk: Emails silently fail to send with only generic user message
- Priority: Medium - but affects user satisfaction

**No tests for sessionStorage behavior:**
- What's not tested: Large file handling, corrupted data recovery, browser storage limits, concurrent tab access
- Files: `app/page.tsx`, `app/brief/page.tsx`
- Risk: User loses PDF data unexpectedly when session storage is cleared
- Priority: Medium - affects user workflow continuity

**No end-to-end tests:**
- What's not tested: Full workflow from PDF upload → chat → brief generation → email send
- Risk: Regression in one component breaks entire user flow without detection
- Priority: Critical - should be automated before production changes

---

*Concerns audit: 2026-02-10*
