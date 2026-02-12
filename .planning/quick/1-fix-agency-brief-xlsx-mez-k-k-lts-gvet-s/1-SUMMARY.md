# Quick Task 1 Summary: Agency Brief XLSX, Budget Constraint, PM Email PDF

## Completed fixes

### 1. fill-agency-brief.ts — Comprehensive mapping fixes
- **B21**: Fixed wrong mapping — was `campaign_goal` (duplicate of B37), now maps `campaign_types` labels
- **Channel checkboxes**: Added `hasChannel()` helper for fuzzy matching — `"Facebook"` now matches `"Facebook ads"`, etc. (5 of 7 channels were broken)
- **Creative source**: Added `hasAny()` helper — accepts both English (`"client"`) and Hungarian (`"Saját kreatív"`) values, plus `"Mindkettő"` → both checkboxes true
- **Creative types**: Added missing E25/E26 mapping for `"Statikus kreatívok"` / `"Videós kreatívok"` checkboxes
- **Gender**: Added `"Mindkettő"` handling → both Nő and Férfi checkboxes true
- **KPIs**: Added fuzzy matching for "Website event" → also matches "konverzió"/"lead"

### 2. Research prompts — Hard budget & channel constraints
- **prompts.ts `buildResearchPrompt()`**: Added `KÖTELEZŐ MEGSZORÍTÁSOK` section with explicit budget limit ("NEM HALADHATJA MEG") and channel filter ("KIZÁRÓLAG")
- **prompts.ts `STRUCTURE_SYSTEM_PROMPT`**: Added rules for HUF sum consistency and channel filtering
- **structure.ts**: Enhanced user message with explicit budget LIMIT and channel restriction

### 3. PM email PDF attachment
- **lib/pdf/generate-brief-pdf.tsx**: New helper wrapping `renderToBuffer(<BriefPDF />)`
- **send-pm-email.ts**: Added optional `pdfBuffer` parameter, conditionally attaches PDF alongside XLSX
- **approve/route.ts**: Generates PDF before sending email (Step 5), non-blocking if fails
- **retry/[token]/route.ts**: Same PDF generation + attachment

## Files modified
1. `lib/xlsx/fill-agency-brief.ts`
2. `lib/research/prompts.ts`
3. `lib/research/structure.ts`
4. `lib/delivery/send-pm-email.ts`
5. `app/api/approve/route.ts`
6. `app/api/retry/[token]/route.ts`
7. `lib/pdf/generate-brief-pdf.tsx` (new)

## Verification
- TypeScript: `npx tsc --noEmit` — clean
- ESLint: all modified files — clean
