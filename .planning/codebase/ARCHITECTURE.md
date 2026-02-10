# Architecture

**Analysis Date:** 2026-02-10

## Pattern Overview

**Overall:** Client-server architecture with clear separation between:
1. **Client layer** - Next.js pages and components handling UI state and user interactions
2. **API layer** - Server-side route handlers managing integrations and business logic
3. **Utility/library layer** - Shared helpers and configuration

**Key Characteristics:**
- Server Components (default) for layout and metadata
- Client Components (`"use client"`) for interactive features
- API routes as edge points for external services (Claude AI, PDF parsing, SendGrid)
- State management via React hooks in components
- Session storage for transient client data (PDF upload)

## Layers

**Presentation Layer:**
- Purpose: Render user interface and handle user interactions
- Location: `components/` and `app/` (page routes, layout)
- Contains: React components (Chat UI, PDF upload, brief editor), routing structure
- Depends on: Custom hooks (`useChat`), types, utility functions
- Used by: Next.js routing system, browsers

**Business Logic Layer (Hooks & State):**
- Purpose: Manage chat state, message streaming, brief data parsing
- Location: `hooks/useChat.ts`
- Contains: Message management, streaming response handling, brief JSON extraction
- Depends on: API endpoints, types
- Used by: Page components (e.g., `app/brief/page.tsx`)

**API Integration Layer:**
- Purpose: Communicate with external services (Claude AI, PDF extraction, email delivery)
- Location: `app/api/` routes (`chat/route.ts`, `parse-pdf/route.ts`, `send-brief/route.tsx`)
- Contains: Server-side logic for LLM calls, file processing, email templates
- Depends on: External SDKs (Anthropic, unpdf, SendGrid), environment configuration
- Used by: Client-side fetch calls from hooks and components

**Data Layer (Types & Utils):**
- Purpose: Type definitions and shared utilities
- Location: `types/chat.ts`, `lib/`
- Contains: TypeScript interfaces, helper functions, prompts
- Depends on: Nothing else in the codebase
- Used by: All layers (components, hooks, API routes)

## Data Flow

**PDF Upload & Brief Initialization Flow:**

1. User uploads PDF on home page (`app/page.tsx`)
   - `PdfUpload` component reads file as base64
   - Base64 stored in `sessionStorage` with filename
   - Triggers navigation to `/brief`

2. Brief page (`app/brief/page.tsx`) initializes
   - Reads PDF from `sessionStorage` via `usePdfData()` hook
   - Calls `/api/parse-pdf` to extract text from PDF buffer
   - Passes extracted text to `useChat.startChat()` hook

3. `useChat.startChat()` initiates AI conversation
   - Sends initial message with PDF text to `/api/chat`
   - `/api/chat` streams Claude responses back
   - Hook extracts brief JSON from response via `checkForBriefData()`
   - Brief JSON marked by `BRIEF_JSON_START`/`BRIEF_JSON_END` tags
   - Sets `briefData` state when parsing succeeds

**Multi-turn Chat Flow:**

1. User responds in `ChatContainer`
   - Message sent via `ChatInput` component
   - Triggers `useChat.sendMessage()` hook
   - Hook batches all messages and sends to `/api/chat`

2. `/api/chat` streams response
   - Claude sees full message history in system conversation
   - Responds with next brief question or JSON output

**Brief Review & Submission Flow:**

1. User reviews brief in `BriefEditor`
   - All fields editable via `updateField()` utility
   - Uses deep clone pattern to update nested data structures

2. User submits brief via email
   - Calls `/api/send-brief` with `BriefData` and recipient email
   - Route renders brief as PDF using `@react-pdf/renderer`
   - Generates HTML email with brief content
   - Sends via SendGrid to client + configured recipients

**State Management:**

- **Client State:** Managed by React hooks in components (`useState`, `useCallback`)
- **Transient State:** PDF data in `sessionStorage` (survives page navigation within session)
- **No Persistent Storage:** No database - brief data exists only during conversation and after email sent
- **Streaming State:** Real-time updates via `streamingContent` in `useChat` hook

## Key Abstractions

**useChat Hook:**
- Purpose: Encapsulates all chat logic including streaming, message history, brief parsing
- Examples: `hooks/useChat.ts`
- Pattern: Custom React hook returning state setters + functions
- Responsibilities: Message persistence, response streaming, JSON extraction, error handling

**BriefData Type:**
- Purpose: Type-safe representation of campaign brief structure
- Examples: `types/chat.ts`
- Pattern: Nested TypeScript interface with company, campaign, audience, timeline, budget sections
- Used by: Chat hook, editor component, API route for email/PDF generation

**Message Types:**
- Purpose: Represent chat messages in conversation
- Examples: `types/chat.ts`
- Pattern: Simple interface with role (user/assistant), content, timestamp
- Stream state tracked separately in hook as `streamingContent`

**Claude Prompt System:**
- Purpose: Define AI behavior and brief JSON output format
- Examples: `lib/prompts.ts`
- Pattern: Two prompt templates: system instructions and initial user message structure
- Output Format: Claude wraps JSON in `BRIEF_JSON_START`/`BRIEF_JSON_END` for parsing

**Component Tree (Layered):**

```
Layout (app/layout.tsx) - metadata, header
├── Home (app/page.tsx) - PDF upload
│   └── PdfUpload component
├── Brief Page (app/brief/page.tsx) - main flow
│   ├── ChatContainer
│   │   ├── ChatMessage (repeating)
│   │   └── ChatInput
│   └── BriefEditor (conditional)
│       └── Form sections (Company, Campaign, Audience, etc.)
└── Header (persistent)
```

## Entry Points

**Home Page (`app/page.tsx`):**
- Location: `/` route
- Triggers: Browser navigation to app
- Responsibilities: Privacy consent, PDF upload, navigation to brief page
- Client component with state: `file`, `acceptedPrivacy`

**Brief Page (`app/brief/page.tsx`):**
- Location: `/brief` route
- Triggers: Redirect from home after PDF upload
- Responsibilities: PDF parsing, chat orchestration, editor visibility toggle
- Uses `useChat` hook and manages `sessionStorage` lifecycle

**API Routes:**

1. `/api/chat` (`app/api/chat/route.ts`)
   - Method: POST
   - Input: `{ messages: Array<{role, content}> }`
   - Output: Server-Sent Events (SSE) stream of JSON chunks
   - Responsibilities: Claude API streaming, error handling

2. `/api/parse-pdf` (`app/api/parse-pdf/route.ts`)
   - Method: POST
   - Input: `{ base64: string }`
   - Output: `{ text: string, success: boolean }`
   - Responsibilities: PDF text extraction via `unpdf` library

3. `/api/send-brief` (`app/api/send-brief/route.tsx`)
   - Method: POST
   - Input: `{ briefData: BriefData, clientEmail: string }`
   - Output: `{ success: true }` or error
   - Responsibilities: PDF rendering, email generation, SendGrid delivery

## Error Handling

**Strategy:** Graceful degradation with user-facing error messages

**Patterns:**

- **Chat Errors:** Caught in hook's try-catch, stored in `error` state, displayed in banner
- **PDF Parse Errors:** Route returns `{ error: "...", text: "" }`, hook continues with empty text
- **Email Errors:** SendGrid API errors parsed, specific messages for auth/validation failures
- **Network Errors:** Fetch failures caught, generic "retry" message shown

**Recovery Paths:**
- Chat failure: User can retry sending message
- PDF failure: User can still fill brief manually (extracted text empty)
- Email failure: User sees specific error, can try again with different email

## Cross-Cutting Concerns

**Logging:**
- Console only via `console.error()` for debugging
- No centralized logging system

**Validation:**
- Client: File type (PDF only), file size (max 10MB) in `PdfUpload`
- Server: Type checking via TypeScript strict mode
- API: JSON parsing with try-catch blocks

**Authentication:**
- No user auth required - anonymous session
- SendGrid API key in environment variables
- Anthropic API key in environment variables

**Internationalization:**
- All UI text in Hungarian (magyar)
- Hardcoded strings throughout components
- No i18n framework used

**Styling:**
- Tailwind CSS with custom theme config
- Color scheme: dark mode with orange accent (`roi-orange`, `roi-gray-*`)
- Animations: Tailwind animations + custom keyframes in globals.css

---

*Architecture analysis: 2026-02-10*
