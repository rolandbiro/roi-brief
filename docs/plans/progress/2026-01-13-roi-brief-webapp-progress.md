# ROI Brief Webapp Implementation Tasks

## Phase 1: Project Setup & Foundation

### Task 1.1: Initialize Next.js Project ✅
**Subagent:** nextjs-app-router-specialist

**Fájl**: `package.json` (új)
- [x] Run `npx create-next-app@latest` with TypeScript, Tailwind, App Router
- [x] Verify project structure created correctly
- [x] Run `npm run dev` to test dev server

**Fájl**: `.gitignore` (új)
- [x] Verify git initialization
- [x] Initial commit with scaffolded project

**Status**: ✅ COMPLETED
**Függőségek**: Nincs
**Becsült idő**: 15-20 perc
**Tényleges idő**: ~10 perc

---

### Task 1.2: Configure Tailwind with ROI Works Brand Colors ✅
**Subagent:** nextjs-app-router-specialist

**Fájl**: `app/globals.css` (módosítás) - Note: Tailwind v4 uses CSS-based config
- [x] Add ROI brand colors (orange: #FF6400, blue: #0022D2)
- [x] Add gray scale (#E3E3E3, #3C3E43, #2A2B2E)
- [x] Configure Archivo font family
- [x] Import Google Fonts (Archivo, Archivo SemiExpanded)
- [x] Add base layer styles for dark theme
- [x] Add component layer (.btn-primary, .btn-secondary, .card)

**Status**: ✅ COMPLETED
**Függőségek**: Task 1.1
**Becsült idő**: 15-20 perc
**Tényleges idő**: ~5 perc

---

### Task 1.3: Setup Environment Variables ✅
**Subagent:** nextjs-app-router-specialist

**Fájl**: `.env.local` (új)
- [x] Add ANTHROPIC_API_KEY (from ihr-portal)
- [x] Add SENDGRID_API_KEY
- [x] Add SENDGRID_FROM_EMAIL
- [x] Add BRIEF_RECIPIENT_1, BRIEF_RECIPIENT_2
- [x] Add NEXT_PUBLIC_APP_URL

**Fájl**: `.env.example` (új)
- [x] Create template without actual secrets
- [x] Commit to repo

**Status**: ✅ COMPLETED
**Függőségek**: Task 1.1
**Becsült idő**: 10 perc
**Tényleges idő**: ~3 perc

---

### Task 1.4: Install Required Dependencies ✅
**Subagent:** nextjs-app-router-specialist

**Fájl**: `package.json` (módosítás)
- [x] Install @anthropic-ai/sdk
- [x] Install ai (Vercel AI SDK)
- [x] Install @sendgrid/mail
- [x] Install @react-pdf/renderer
- [x] Install clsx, tailwind-merge
- [x] Verify build succeeds

**Status**: ✅ COMPLETED
**Függőségek**: Task 1.1
**Becsült idő**: 10 perc
**Tényleges idő**: ~2 perc

---

## Phase 2: Core Components & Layout

### Task 2.1: Create Main Layout with ROI Works Header
**Subagent:** nextjs-app-router-specialist

**Fájl**: `components/Logo.tsx` (új)
- [ ] Create SVG logo component
- [ ] Support className prop for sizing

**Fájl**: `components/Header.tsx` (új)
- [ ] Create fixed header with blur backdrop
- [ ] Include Logo component
- [ ] Add border bottom styling

**Fájl**: `app/layout.tsx` (módosítás)
- [ ] Add Header component
- [ ] Set page title and metadata
- [ ] Add pt-20 to main for header spacing

**Status**: ⏳ PENDING
**Függőségek**: Task 1.2
**Becsült idő**: 20-30 perc

---

### Task 2.2: Create PDF Upload Component
**Subagent:** nextjs-app-router-specialist

**Fájl**: `lib/utils.ts` (új)
- [ ] Create cn() utility function
- [ ] Create fileToBase64() helper

**Fájl**: `components/PdfUpload.tsx` (új)
- [ ] Implement drag-and-drop zone
- [ ] Add file type validation (PDF only)
- [ ] Add file size validation (max 10MB)
- [ ] Show upload success state
- [ ] Handle file reading to base64

**Status**: ⏳ PENDING
**Függőségek**: Task 1.4
**Becsült idő**: 30-40 perc

---

### Task 2.3: Create Chat UI Components
**Subagent:** nextjs-app-router-specialist

**Fájl**: `types/chat.ts` (új)
- [ ] Define Message interface
- [ ] Define BriefData interface with all fields

**Fájl**: `components/chat/ChatMessage.tsx` (új)
- [ ] Create message bubble component
- [ ] Style differently for user vs assistant
- [ ] Add AI avatar for assistant messages

**Fájl**: `components/chat/ChatInput.tsx` (új)
- [ ] Create textarea with send button
- [ ] Handle Enter key for submit
- [ ] Add disabled state during loading

**Fájl**: `components/chat/ChatContainer.tsx` (új)
- [ ] Create scrollable message container
- [ ] Auto-scroll on new messages
- [ ] Show loading indicator
- [ ] Handle streaming content display

**Status**: ⏳ PENDING
**Függőségek**: Task 1.2
**Becsült idő**: 40-60 perc

---

## Phase 3: AI Integration

### Task 3.1: Create Claude API Route with Streaming
**Subagent:** typescript-expert

**Fájl**: `lib/prompts.ts` (új)
- [ ] Create BRIEF_SYSTEM_PROMPT constant
- [ ] Define all brief fields to collect
- [ ] Set AI persona (professional, Hungarian, magázódás)
- [ ] Define JSON output format with markers
- [ ] Create createInitialMessage() helper

**Fájl**: `app/api/chat/route.ts` (új)
- [ ] Initialize Anthropic client
- [ ] Handle POST request with messages
- [ ] Create streaming response
- [ ] Return SSE formatted stream

**Status**: ⏳ PENDING
**Függőségek**: Task 1.3, Task 1.4
**Becsült idő**: 40-50 perc

---

### Task 3.2: Create Chat Hook for State Management
**Subagent:** react-state-management-expert

**Fájl**: `hooks/useChat.ts` (új)
- [ ] Define state: messages, isLoading, streamingContent, briefData, error
- [ ] Implement startChat() for initial PDF + greeting
- [ ] Implement sendMessage() for user responses
- [ ] Handle streaming response parsing
- [ ] Implement checkForBriefData() to extract JSON
- [ ] Return all state and functions

**Status**: ⏳ PENDING
**Függőségek**: Task 3.1
**Becsült idő**: 40-50 perc

---

## Phase 4: Main Application Pages

### Task 4.1: Create Landing Page with Upload
**Subagent:** nextjs-app-router-specialist

**Fájl**: `app/page.tsx` (módosítás)
- [ ] Add hero section with title
- [ ] Add PdfUpload component
- [ ] Add "Tovább" button (disabled until file selected)
- [ ] Store PDF in sessionStorage on select
- [ ] Navigate to /brief on continue
- [ ] Add step indicator cards (1-2-3)

**Status**: ⏳ PENDING
**Függőségek**: Task 2.1, Task 2.2
**Becsült idő**: 30-40 perc

---

### Task 4.2: Create Brief Chat Page
**Subagent:** nextjs-app-router-specialist

**Fájl**: `app/brief/page.tsx` (új)
- [ ] Check for PDF in sessionStorage (redirect if missing)
- [ ] Initialize useChat hook
- [ ] Start chat with PDF content on mount
- [ ] Render ChatContainer with messages
- [ ] Show BriefEditor when briefData is ready
- [ ] Add header with file name and "Új brief" button

**Status**: ⏳ PENDING
**Függőségek**: Task 2.3, Task 3.2
**Becsült idő**: 30-40 perc

---

### Task 4.3: Create Brief Editor Component
**Subagent:** nextjs-app-router-specialist

**Fájl**: `components/BriefEditor.tsx` (új)
- [ ] Create form sections for all brief fields
  - [ ] Company section (name, contact, email, phone)
  - [ ] Campaign section (name, type, goal, message, KPIs)
  - [ ] Target audience section (demographics, psychographics, persona)
  - [ ] Channels section
  - [ ] Timeline section (start, end)
  - [ ] Budget section
  - [ ] Competitors section
  - [ ] Notes section
- [ ] Implement updateField() for nested updates
- [ ] Add client email input for sending
- [ ] Add send button with loading state
- [ ] Show success screen after sending
- [ ] Add "Vissza a chathez" button

**Status**: ⏳ PENDING
**Függőségek**: Task 4.2
**Becsült idő**: 60-90 perc

---

## Phase 5: Email & PDF Generation

### Task 5.1: Create PDF Generation Utility
**Subagent:** typescript-expert

**Fájl**: `lib/pdf-template.tsx` (új)
- [ ] Define PDF styles (colors, typography)
- [ ] Create Document structure with Page
- [ ] Add header with logo and date
- [ ] Add title with campaign name
- [ ] Create sections for each brief category
- [ ] Add footer with generation info

**Status**: ⏳ PENDING
**Függőségek**: Task 1.4
**Becsült idő**: 40-50 perc

---

### Task 5.2: Create Send Brief API Route
**Subagent:** typescript-expert

**Fájl**: `lib/email-template.ts` (új)
- [ ] Create generateEmailHtml() function
- [ ] Design responsive HTML email
- [ ] Include all brief sections
- [ ] Add ROI Works branding

**Fájl**: `app/api/send-brief/route.ts` (új)
- [ ] Initialize SendGrid client
- [ ] Generate PDF with react-pdf
- [ ] Create email messages for all recipients
- [ ] Send emails with PDF attachment
- [ ] Return success/error response

**Status**: ⏳ PENDING
**Függőségek**: Task 5.1, Task 1.3
**Becsült idő**: 40-50 perc

---

## Phase 6: Final Polish & Testing

### Task 6.1: Add Loading States and Error Boundaries
**Subagent:** nextjs-app-router-specialist

**Fájl**: `components/LoadingSpinner.tsx` (új)
- [ ] Create animated spinner component
- [ ] Support size variants (sm, md, lg)

**Fájl**: `app/brief/loading.tsx` (új)
- [ ] Create loading state for brief page
- [ ] Show spinner with text

**Fájl**: `app/brief/error.tsx` (új)
- [ ] Create error boundary component
- [ ] Show error message and retry button

**Status**: ⏳ PENDING
**Függőségek**: Task 4.2
**Becsült idő**: 20-30 perc

---

### Task 6.2: Create README and Final Verification
**Subagent:** technical-writer

**Fájl**: `README.md` (új)
- [ ] Add project description
- [ ] Document features
- [ ] List tech stack
- [ ] Add installation instructions
- [ ] Document environment variables
- [ ] Add development and build commands
- [ ] Add usage instructions

**Fájl**: Verification
- [ ] Run full build (`npm run build`)
- [ ] Test production mode (`npm run start`)
- [ ] Manual test of full flow

**Status**: ⏳ PENDING
**Függőségek**: All previous tasks
**Becsült idő**: 30-40 perc

---

## Summary

**Plan:** `docs/plans/2026-01-13-roi-brief-webapp.md`
**Created:** 2026-01-13
**Last Updated:** 2026-01-13
**Overall Status:** In Progress

**Phase Overview:**
| Phase | Status | Tasks | Completed |
|-------|--------|-------|-----------|
| Phase 1: Project Setup | ✅ | 4 | 4/4 |
| Phase 2: Core Components | ⏳ | 3 | 0/3 |
| Phase 3: AI Integration | ⏳ | 2 | 0/2 |
| Phase 4: Application Pages | ⏳ | 3 | 0/3 |
| Phase 5: Email & PDF | ⏳ | 2 | 0/2 |
| Phase 6: Polish & Testing | ⏳ | 2 | 0/2 |

**Total:** 16 tasks | 4 completed

**Legend:** ⏳ PENDING | 🔄 IN PROGRESS | ✅ COMPLETED | 🚫 BLOCKED | ⏭️ SKIPPED

---

## Session Log

### Session 1 - 2026-01-13
- Started: ~14:00
- Ended: -
- Tasks completed: 0
- Notes: Initial planning and documentation session. Created design-document.md, implementation plan, and progress tracking.

### Session 2 - 2026-01-13
- Started: ~14:40
- Ended: -
- Tasks completed: 1.1, 1.2, 1.3, 1.4 (Phase 1 complete!)
- Tasks in progress: -
- Notes: Created private GitHub repo (https://github.com/rolandbiro/roi-brief), initialized Next.js 16.1.1 with Tailwind v4, configured ROI Works brand colors, set up environment variables, installed all dependencies.

---

## Blockers & Decisions

(Record any blockers encountered or important decisions made during implementation)

---

## Quick Resume

**To continue this work in a new session:**
1. Read this progress file first
2. Look for unchecked `- [ ]` items
3. Use `executing-plans-with-progress` skill
4. Continue from the last incomplete task/step
