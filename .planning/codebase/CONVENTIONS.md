# Coding Conventions

**Analysis Date:** 2026-02-10

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `BriefEditor.tsx`, `PdfUpload.tsx`)
- Utilities/hooks: camelCase (e.g., `useChat.ts`, `utils.ts`)
- API routes: kebab-case in path (e.g., `/api/parse-pdf/route.ts`, `/api/send-brief/route.tsx`)
- Pages: kebab-case in directories (e.g., `app/brief/page.tsx`, `app/api/chat/route.ts`)

**Functions:**
- camelCase for all functions (e.g., `handleFile()`, `updateField()`, `processStream()`)
- Handler functions prefixed with `handle` (e.g., `handleDrop()`, `handleDragOver()`, `handleFileSelected()`)
- Callback/event handlers: `handle[EventName]` pattern

**Variables:**
- camelCase for all variables (e.g., `isDragging`, `fileName`, `clientEmail`)
- State variables: descriptive camelCase (e.g., `briefData`, `streamingContent`, `isProcessing`)
- Boolean variables: `is[State]` or `has[Property]` prefix (e.g., `isLoading`, `isDragging`, `hasError`)
- Constants: UPPER_SNAKE_CASE (e.g., `BRIEF_SYSTEM_PROMPT`, `BRIEF_RECIPIENT_1`)

**Types:**
- Interface names: PascalCase with suffix "Props" for component props (e.g., `BriefEditorProps`, `PdfUploadProps`)
- Interface names: PascalCase general (e.g., `Message`, `BriefData`)
- Type discriminants: literal values like `"user" | "assistant"` for role types

## Code Style

**Formatting:**
- No Prettier or explicit formatter configured, but code follows consistent spacing
- 2-space indentation throughout
- Semicolons required at end of statements
- Quotes: double quotes (`"`) for strings (observed in JSX attributes and regular strings)

**Linting:**
- ESLint configured with Next.js rules: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Config file: `eslint.config.mjs` (ESLint 9 flat config format)
- Run linting: `npm run lint`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Import Organization

**Order:**
1. External packages (React, Next.js) - e.g., `import { useState } from "react"`
2. Next.js internal modules - e.g., `import { useRouter } from "next/navigation"`
3. Type imports - e.g., `import { Message, BriefData } from "@/types/chat"`
4. Local utilities/components - e.g., `import { cn } from "@/lib/utils"`
5. Local components - e.g., `import { BriefEditor } from "@/components/BriefEditor"`

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- Use for all local imports, no relative paths
- Examples: `@/types/chat`, `@/lib/utils`, `@/components/Header`

## Error Handling

**Patterns:**
- Try/catch blocks for async operations with meaningful error messages in Hungarian
- Error state managed via `useState`: `const [error, setError] = useState<string | null>(null)`
- Error display to user via alert or rendered error messages
- Console logging for debugging: `console.error("Error context:", error)`
- Unknown error casting: `const sgError = error as { code?: number; message?: string }`

**API responses:**
- HTTP error checking: `if (!response.ok) throw new Error("descriptive message")`
- Response.json() for successful returns
- Specific error codes checked for SendGrid (401, 403) with appropriate messages

## Logging

**Framework:** `console` only (no external logging library)

**Patterns:**
- `console.error()` for error tracking with context
- Error logging in catch blocks: `console.error("API endpoint context:", error)`
- No logging for success cases (follows "fail fast" principle)
- All error messages in Hungarian for user-facing text

## Comments

**When to Comment:**
- Minimal commenting following "no unnecessary code" principle
- Comments used only for non-obvious logic or business requirements
- Context comments in prompts (e.g., system prompts with detailed instructions in Hungarian)

**JSDoc/TSDoc:**
- Minimal use
- Interface properties documented inline in type definitions if needed
- Function documentation not enforced (code is self-documenting)

## Function Design

**Size:** Functions are concise and single-responsibility
- Example: `handleFile()` focuses on file validation and processing
- Example: `updateField()` uses path-based deep object updates

**Parameters:** Typed with proper TypeScript interfaces
- Destructuring used for props: `({ initialData, onBack }: BriefEditorProps)`
- No excessive parameter lists
- Callback functions passed as props to components

**Return Values:**
- Async functions return Promise<T>
- UI components return JSX.Element or null
- Hooks return object with state and handlers
- Utility functions return typed values (string, boolean, etc.)

## Module Design

**Exports:**
- Named exports for functions and components (e.g., `export function useChat()`)
- Default exports for page components (e.g., `export default function Home()`)
- Type exports: `export interface BriefData { ... }`

**Barrel Files:** Not extensively used, imports are direct from specific files

## React Patterns

**Client Components:**
- "use client" directive at top of components with state/hooks
- Used for: `app/page.tsx`, `components/BriefEditor.tsx`, `components/PdfUpload.tsx`, `hooks/useChat.ts`

**Server Components:**
- `app/layout.tsx` is server component (no "use client")
- API routes are server-side by default

**State Management:**
- React's built-in `useState` for local component state
- No Redux or external state management
- Props drilling acceptable for small component hierarchies
- SessionStorage for cross-page data: `sessionStorage.setItem("proposalPdf", JSON.stringify(...))`

**Effect Hooks:**
- Minimal use of `useEffect`, focus on callbacks and event handlers
- `useCallback` used to optimize callbacks passed to children

## Styling

**Framework:** Tailwind CSS 4 with PostCSS
- All styling done with Tailwind utility classes
- CSS custom properties for theme colors: `roi-orange`, `roi-gray-light`, `roi-gray-darker`, etc.
- Dynamic class binding using `cn()` utility from `clsx` and `tailwind-merge`
- Animations defined in Tailwind: `animate-fade-in-up`, `animate-spin`, `animate-scale-in`

**Class Usage:**
- `cn()` utility for conditional and merged classes: `cn("base-class", condition && "conditional-class")`
- Ternary operators for multiple condition branches in className
- No CSS modules or styled-components

## TypeScript

**Compiler Options:**
- Target: ES2017
- Strict mode enabled
- No emit (compilation via Next.js)
- Module resolution: bundler (Next.js)
- JSX: react-jsx

**Type Safety:**
- All function parameters typed
- Interface definitions for data structures
- Type casting only when necessary (e.g., `as const` for disposition in email sending)
- Unknown error types cast to interface for safe property access

## API Design

**Request/Response:**
- POST methods for data mutations
- JSON request bodies: `await request.json()`
- Consistent error response format: `Response.json({ error: "message" }, { status: code })`
- Success responses: `Response.json({ success: true })`

**Streaming:**
- Server-Sent Events (SSE) format for chat streaming
- Response headers: `"Content-Type": "text/event-stream"`
- Data format: `data: ${JSON.stringify({ text })}\n\n`

---

*Convention analysis: 2026-02-10*
