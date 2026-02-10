---
phase: 03-dynamic-report-branding
plan: 03
subsystem: api
tags: [pdf-download, email-template, sendgrid, dynamic-sections, flat-schema]

# Dependency graph
requires:
  - phase: 03-dynamic-report-branding
    provides: "03-01: getActiveSections helper, SectionDef/FieldDef pattern; 03-02: BriefPDF component with flat BriefData"
provides:
  - "POST /api/download-pdf endpoint returning PDF buffer"
  - "Rewritten email template with dynamic sections and flat BriefData schema"
  - "Send-brief route targeting only ROI Works team (BRIEF_RECIPIENT_1/2)"
affects: [03-04, BriefEditor]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Dynamic email HTML sections with campaign_types filtering", "clientEmail passed as email body reference (not recipient)"]

key-files:
  created:
    - app/api/download-pdf/route.tsx
  modified:
    - lib/email-template.ts
    - app/api/send-brief/route.tsx

key-decisions:
  - "Email recipients: only BRIEF_RECIPIENT_1/2 env vars — clientEmail removed from recipient list, shown in email body instead"
  - "generateEmailHtml accepts optional clientEmail param for team reference row in email"
  - "Section definitions duplicated for email template (HTML strings) — same pattern as PDF template"
  - "Uint8Array conversion for Response body compatibility in download-pdf route"

patterns-established:
  - "Email section rendering: renderSectionHtml helper with alternating background colors"
  - "Client email as body reference: clientEmail visible in email content but not as recipient"

# Metrics
duration: 3min
completed: 2026-02-10
---

# Phase 3 Plan 3: PDF Download Endpoint & Email Template Flat Schema Rewrite Summary

**PDF letoltes API + email template es send-brief route atirva flat BriefData semara, dinamikus szekciokkal es kampanytipus-alapu szuressel**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-10T13:20:31Z
- **Completed:** 2026-02-10T13:22:58Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- PDF download endpoint: POST /api/download-pdf returns PDF buffer with proper Content-Type/Disposition headers
- Email template: full rewrite to dynamic sections (EXECUTIVE_SUMMARY + BASE + type-specific) using flat BriefData schema
- Send-brief route: recipients restricted to ROI Works team only (BRIEF_RECIPIENT_1/2), clientEmail shown in email body for reference
- Zero TS errors, successful npm build

## Task Commits

Each task was committed atomically:

1. **Task 1: PDF letoltes API endpoint** - `479b6c3` (feat)
2. **Task 2: Email template + send-brief route atiras flat semara** - `c61a112` (feat)

## Files Created/Modified
- `app/api/download-pdf/route.tsx` - PDF download API endpoint (POST, renderToBuffer, Uint8Array response)
- `lib/email-template.ts` - Dynamic email HTML template with flat BriefData schema, campaign type badges, section filtering
- `app/api/send-brief/route.tsx` - Email send route: ROI Works-only recipients, flat schema fields, client email in body

## Decisions Made
- Email recipients changed from [clientEmail, RECIPIENT_1, RECIPIENT_2] to [RECIPIENT_1, RECIPIENT_2] only -- clientEmail is shown in the email body as reference for the team
- generateEmailHtml takes optional clientEmail parameter and renders an "Erdeklodo email" row before sections
- Section definitions duplicated from brief-sections.ts (same as PDF template decision) -- necessary because email generates HTML strings, not React components
- Uint8Array conversion for download-pdf Response body (Buffer not assignable to BodyInit in newer TypeScript)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Uint8Array conversion for PDF Response body**
- **Found during:** Task 1 (PDF download endpoint)
- **Issue:** `Buffer` from renderToBuffer not assignable to `BodyInit` in Response constructor (TS error)
- **Fix:** Added `new Uint8Array(pdfBuffer)` conversion before passing to Response
- **Files modified:** app/api/download-pdf/route.tsx
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** 479b6c3 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor type compatibility fix. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. Environment variables (BRIEF_RECIPIENT_1, BRIEF_RECIPIENT_2, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL) assumed to be configured from previous setup.

## Next Phase Readiness
- All API endpoints ready: /api/download-pdf (new), /api/send-brief (rewritten)
- Email template and PDF template both use flat BriefData schema with dynamic sections
- Pre-existing TS errors in email-template.ts and send-brief/route.tsx fully resolved
- Ready for 03-04 plan (integration/final touches)

## Self-Check: PASSED

- FOUND: app/api/download-pdf/route.tsx
- FOUND: lib/email-template.ts
- FOUND: app/api/send-brief/route.tsx
- FOUND: 479b6c3 (Task 1 commit)
- FOUND: c61a112 (Task 2 commit)

---
*Phase: 03-dynamic-report-branding*
*Completed: 2026-02-10*
