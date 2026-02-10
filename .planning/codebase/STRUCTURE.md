# Codebase Structure

**Analysis Date:** 2026-02-10

## Directory Layout

```
roi-brief/
├── app/                           # Next.js 13+ app router (server-first)
│   ├── layout.tsx                 # Root layout with metadata
│   ├── page.tsx                   # Home page (PDF upload)
│   ├── brief/                     # Brief filling flow
│   │   ├── page.tsx              # Main brief page with chat
│   │   ├── error.tsx             # Error boundary
│   │   └── loading.tsx           # Loading state
│   └── api/                       # Server API routes
│       ├── chat/route.ts         # Claude streaming endpoint
│       ├── parse-pdf/route.ts    # PDF text extraction
│       └── send-brief/route.tsx  # Email + PDF generation
├── components/                    # React components (client)
│   ├── Header.tsx                # Fixed navigation header
│   ├── Logo.tsx                  # ROI Works logo
│   ├── PdfUpload.tsx             # Drag-drop PDF input
│   ├── BriefEditor.tsx           # Form for brief review/edit
│   ├── LoadingSpinner.tsx        # Reusable spinner
│   ├── chat/                     # Chat UI subcomponents
│   │   ├── ChatContainer.tsx     # Message list + input
│   │   ├── ChatMessage.tsx       # Single message bubble
│   │   └── ChatInput.tsx         # Text input + send button
│   └── styles/                   # Component-scoped styles (if any)
├── hooks/                        # Custom React hooks
│   └── useChat.ts               # Chat state + streaming logic
├── lib/                         # Shared utilities and config
│   ├── prompts.ts              # Claude system prompt + initial message
│   ├── utils.ts                # Helper functions (cn, fileToBase64)
│   ├── email-template.ts       # HTML email generation
│   └── pdf-template.tsx        # Brief PDF layout (JSX)
├── types/                      # TypeScript type definitions
│   └── chat.ts                # Message, BriefData interfaces
├── public/                     # Static assets
│   └── [images, icons]        # ROI Works branding
├── styles/                    # Global styles
│   └── globals.css           # Tailwind + custom animations
├── scripts/                   # Development scripts
│   └── generate-sample-pdf.tsx # Sample PDF generator
├── .planning/                 # GSD planning documents
│   └── codebase/
├── docs/                     # Documentation (demand, phase plans)
├── node_modules/             # Dependencies
├── .next/                    # Next.js build output
├── package.json              # Dependencies + scripts
├── tsconfig.json             # TypeScript config
├── next.config.ts            # Next.js config
├── tailwind.config.js        # Tailwind CSS customization
├── eslint.config.mjs         # ESLint rules
└── .env.local               # Environment variables (not committed)
```

## Directory Purposes

**`app/`**
- Purpose: Next.js app router defining routes and server-side logic
- Contains: Page components, API routes, layouts
- Key files: `page.tsx`, `api/*/route.ts`
- Convention: Filename convention maps to routes (`/brief` → `brief/page.tsx`)

**`components/`**
- Purpose: Reusable React components (all client-side with `"use client"` directive)
- Contains: UI elements, forms, interactive components
- Key files: `PdfUpload.tsx`, `BriefEditor.tsx`, `chat/ChatContainer.tsx`
- Convention: PascalCase component names, exports as named exports

**`hooks/`**
- Purpose: Custom React hooks for logic extraction
- Contains: State management, side effects, API communication
- Key files: `useChat.ts` (main hook for chat flow)
- Convention: Prefixed with `use`, exported as named exports

**`lib/`**
- Purpose: Shared utilities, prompts, templates
- Contains: Helper functions, configuration, template files
- Key files: `prompts.ts` (Claude instructions), `utils.ts` (cn function), `email-template.ts`, `pdf-template.tsx`
- Convention: Non-component utilities, exported as named exports

**`types/`**
- Purpose: Centralized TypeScript interfaces
- Contains: Message, BriefData, component props
- Key files: `chat.ts` (all chat-related types)
- Convention: Interface/type per file or all related types in single file

**`public/`**
- Purpose: Static assets served at root
- Contains: Images, icons, logos
- Committed: Yes

**`styles/`**
- Purpose: Global styles and Tailwind configuration
- Contains: `globals.css` (Tailwind imports, custom keyframes)
- Key files: `globals.css`
- Convention: CSS custom properties for theme colors

**`scripts/`**
- Purpose: One-off development utilities
- Contains: PDF generation for testing
- Key files: `generate-sample-pdf.tsx`

## Key File Locations

**Entry Points:**
- `app/layout.tsx` - Root HTML structure, metadata, header
- `app/page.tsx` - Home page (first user interaction)
- `app/brief/page.tsx` - Main brief filling flow
- `next.config.ts` - Next.js build config

**Configuration:**
- `tsconfig.json` - TypeScript strict mode, path aliases (`@/*`)
- `package.json` - Dependencies, scripts (dev, build, start, lint)
- `.env.local` - Runtime secrets (ANTHROPIC_API_KEY, SENDGRID_API_KEY)
- `tailwind.config.js` - Color palette, spacing, animations

**Core Logic:**
- `hooks/useChat.ts` - Chat orchestration (streaming, message history, JSON parsing)
- `lib/prompts.ts` - Claude system prompt defining brief structure
- `app/api/chat/route.ts` - Claude integration (streaming)
- `app/api/parse-pdf/route.ts` - PDF text extraction
- `app/api/send-brief/route.tsx` - Email/PDF generation

**UI Components:**
- `components/chat/` - Chat interface (messages, input)
- `components/PdfUpload.tsx` - File upload with drag-drop
- `components/BriefEditor.tsx` - Brief review/edit form

## Naming Conventions

**Files:**
- **Components:** PascalCase (e.g., `BriefEditor.tsx`, `ChatMessage.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useChat.ts`)
- **API Routes:** `route.ts` or `route.tsx` in directory named after endpoint (e.g., `api/chat/route.ts` → `/api/chat`)
- **Types:** Singular descriptive names (e.g., `chat.ts` not `chats.ts`)
- **Utilities:** camelCase (e.g., `utils.ts`, `prompts.ts`)

**Directories:**
- **Feature/Page Routes:** kebab-case (e.g., `brief/`, `api/chat/`)
- **Component Collections:** Plural camelCase (e.g., `components/`, `hooks/`)
- **Utilities:** Plural camelCase (e.g., `lib/`, `types/`, `scripts/`)

**Imports/Exports:**
- **Components:** Named exports, imported as `import { ComponentName } from "@/components/ComponentName"`
- **Hooks:** Named exports, imported as `import { useChat } from "@/hooks/useChat"`
- **Utils:** Mix of named/default, imported with `import { cn } from "@/lib/utils"`

**TypeScript/React:**
- **Variables:** camelCase (e.g., `isLoading`, `briefData`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `BRIEF_SYSTEM_PROMPT`)
- **Interfaces:** PascalCase (e.g., `BriefData`, `Message`, `ChatContainerProps`)
- **Functions:** camelCase (e.g., `handleSend`, `updateField`)

## Where to Add New Code

**New Feature (e.g., Analytics Tracking):**
- Primary code: `app/api/new-feature/route.ts` for server logic
- Client integration: Add to relevant component or new hook
- Types: Add to `types/chat.ts` or new file in `types/`
- Tests: Create `__tests__/new-feature.test.ts` (pattern not yet in codebase)

**New Component/Module (e.g., FeedbackForm):**
- Implementation: `components/FeedbackForm.tsx` as `"use client"`
- Props: Define interface `FeedbackFormProps` in component file or `types/`
- Styling: Use Tailwind classes inline, reference colors from `tailwind.config.js`
- Export: Named export from component file

**New Page/Route (e.g., Results page):**
- Page: `app/results/page.tsx` (Server Component by default)
- API if needed: `app/api/results/route.ts`
- Components: Extract to `components/results/` subdirectory

**Utilities/Helpers (e.g., formatBriefData):**
- Location: `lib/utils.ts` for general helpers
- Location: `lib/brief-utils.ts` for domain-specific helpers (new file)
- Pattern: Named export, pure function
- Avoid: Putting in components or hooks unless used only there

**Shared Types (e.g., new field in BriefData):**
- Location: `types/chat.ts` for chat-related types
- Location: `types/new-domain.ts` for new domain
- Pattern: Export interface, use in multiple files
- Convention: PascalCase interface names

## Special Directories

**`.next/`**
- Purpose: Next.js build output
- Generated: Yes (by `next build`)
- Committed: No (in `.gitignore`)

**`.planning/`**
- Purpose: GSD orchestrator planning documents
- Generated: Yes (by `/gsd:*` commands)
- Committed: Yes (tracks planning history)

**`node_modules/`**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

**`public/`**
- Purpose: Static assets served at root URL
- Generated: No (manually added)
- Committed: Yes

**`docs/`**
- Purpose: Project documentation and planning artifacts
- Generated: Partially (phase plans generated, demand specs manual)
- Committed: Yes

## Path Aliases

**Configured in `tsconfig.json`:**
- `@/*` maps to `/` (project root)

**Usage:**
```typescript
// Instead of:
import { BriefEditor } from "../../../components/BriefEditor"

// Use:
import { BriefEditor } from "@/components/BriefEditor"
```

This applies to all imports: components, hooks, lib, types.

## Asset Organization

**Images/Icons:**
- Location: `public/` directory
- Reference: `/image-name.png` or `public/image-name.png` via import
- Example: `<Image src="/logo.png" alt="..." />`

**CSS/Styling:**
- Tailwind CSS: Applied via `className` attribute
- Custom CSS: In `app/globals.css` for keyframes/custom properties
- Theme colors: Defined in `tailwind.config.js` (e.g., `bg-roi-orange`, `text-roi-gray-light`)

---

*Structure analysis: 2026-02-10*
