# External Integrations

**Analysis Date:** 2026-02-10

## APIs & External Services

**AI & LLM:**
- Claude API (Anthropic) - Core AI service for marketing brief generation
  - SDK: `@anthropic-ai/sdk` ^0.71.2
  - Auth: `ANTHROPIC_API_KEY` (environment variable)
  - Model: `claude-sonnet-4-20250514` (latest at time of implementation)
  - Integration point: `app/api/chat/route.ts`
  - Usage: Streaming responses with `stream: true`, system prompts for guided brief collection
  - Configuration: Max tokens 4096, system prompt from `lib/prompts.ts`

**Email & Messaging:**
- SendGrid - Email service for sending campaign briefs
  - SDK: `@sendgrid/mail` ^8.1.6
  - Auth: `SENDGRID_API_KEY` (environment variable)
  - Sender: `SENDGRID_FROM_EMAIL` (configured in env)
  - Integration point: `app/api/send-brief/route.tsx`
  - Usage: Multi-recipient emails with PDF attachments
  - Recipients: Configurable via `BRIEF_RECIPIENT_1`, `BRIEF_RECIPIENT_2`
  - Error handling: Specific handling for 401 (invalid API key) and 403 (unverified sender)

## Data Storage

**Databases:**
- Not applicable - No persistent database layer

**File Storage:**
- Local filesystem only - Sample PDFs stored in project root (`sample-proposal.pdf`)
- In-memory state in browser for active sessions
- PDF uploads are base64-encoded and sent to API endpoints (not persisted)

**Caching:**
- None detected - No caching layer configured

## Authentication & Identity

**Auth Provider:**
- Custom/API Key based - No user authentication system
- API security: Relies on environment variable secrets (API keys)
- Access: No user login required; application is single-purpose tool

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, DataDog, or similar integration

**Logs:**
- Console logging only - `console.error()` for API errors
- Error messages logged to browser/server console
- No centralized logging service
- Hungarian error messages for user-facing errors, English for logging context

## CI/CD & Deployment

**Hosting:**
- Vercel - Primary deployment platform
  - Project configured: `roi-brief` (from `.vercel/project.json`)
  - Git integration: Automatic deployments from repository

**CI Pipeline:**
- Not explicitly configured - Vercel handles deployment on push
- ESLint runs on demand via `npm run lint`
- No automated testing pipeline

## Environment Configuration

**Required env vars:**
- `ANTHROPIC_API_KEY` - Claude API authentication (secret)
- `SENDGRID_API_KEY` - SendGrid API key (secret)
- `SENDGRID_FROM_EMAIL` - Sender email address (plain)
- `BRIEF_RECIPIENT_1` - Primary recipient for briefs (plain)
- `BRIEF_RECIPIENT_2` - Secondary recipient, optional (plain)
- `NEXT_PUBLIC_APP_URL` - Public application URL for client-side use

**Secrets location:**
- Development: `.env.local` (git-ignored)
- Production: Vercel environment variables dashboard
- Template reference: `.env.example` (tracked in git)

## Webhooks & Callbacks

**Incoming:**
- Not applicable - No webhook endpoints

**Outgoing:**
- Not applicable - No outbound webhooks (SendGrid emails are direct API calls, not webhooks)

## External API Integration Points

**PDF Processing:**
- Client-side: File upload in `components/PdfUpload.tsx` converts to base64
- Server-side: `app/api/parse-pdf/route.ts` uses `unpdf` for text extraction
- Flow: PDF base64 → API endpoint → Text extraction → Sent as context to Claude

**Chat Flow:**
- Client: `hooks/useChat.ts` manages bidirectional streaming
- Server: `app/api/chat/route.ts` streams Claude responses as Server-Sent Events (SSE)
- Format: `data: {JSON}\n\n` for streaming chunks
- Terminator: `[DONE]` marker to signal stream end

**Brief Sending:**
- Client: `components/BriefEditor.tsx` triggers send action
- Server: `app/api/send-brief/route.tsx` orchestrates:
  1. Generates PDF from `lib/pdf-template.tsx` (React components → PDF)
  2. Generates HTML email from `lib/email-template.ts`
  3. Encodes PDF as base64 attachment
  4. Sends via SendGrid to multiple recipients

## API Rate Limits & Quotas

**Anthropic (Claude):**
- Not enforced in code - Relies on account-level quotas
- Max tokens: 4096 per request (hardcoded in `app/api/chat/route.ts`)

**SendGrid:**
- Not enforced in code - Relies on account plan limits
- Batch size: Single emails sent sequentially with `Promise.all()`

---

*Integration audit: 2026-02-10*
