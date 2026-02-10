# Technology Stack

**Analysis Date:** 2026-02-10

## Languages

**Primary:**
- TypeScript 5 - Full codebase including app routes, components, hooks, and utilities
- JavaScript (React JSX/TSX) - React components and UI rendering

**Secondary:**
- MJSX (Module-based JSX) - ESLint and PostCSS configuration files

## Runtime

**Environment:**
- Node.js v24.4.1+ (from project's working environment)
- Browser: ES2017+ (ES2020 target in TypeScript compilation)

**Package Manager:**
- npm 11.4.2+
- Lockfile: `package-lock.json` present (committed)

## Frameworks

**Core:**
- Next.js 16.1.1 - Full-stack React framework with App Router and Turbopack
  - API routes: `app/api/**/route.ts`
  - Pages: `app/**/page.tsx`
  - Layout: `app/layout.tsx`
  - Server/Client Components: Mixed usage with "use client" for interactive components

**Frontend:**
- React 19.2.3 - UI component library
- React DOM 19.2.3 - DOM rendering

**Styling:**
- Tailwind CSS v4 - Utility-first CSS framework
- @tailwindcss/postcss ^4 - PostCSS plugin for Tailwind
- PostCSS - CSS processing via `postcss.config.mjs`

**Testing:**
- Not detected - No test framework configured

**Build/Dev:**
- Turbopack (integrated with Next.js 16) - Fast bundler
- TypeScript 5 - Transpilation and type checking
- ESLint 9 - Code linting with Next.js config

## Key Dependencies

**Critical:**
- @anthropic-ai/sdk ^0.71.2 - Official Anthropic SDK for Claude API integration at `app/api/chat/route.ts`
- @sendgrid/mail ^8.1.6 - SendGrid email client for sending briefs with attachments at `app/api/send-brief/route.tsx`
- ai ^6.0.31 - Streaming and AI integration utilities (used for enhanced AI interactions)

**PDF & Document Processing:**
- @react-pdf/renderer ^4.3.2 - React components for PDF generation at `lib/pdf-template.tsx`
- pdf-parse ^2.4.5 - Dependency for PDF text extraction
- unpdf ^1.4.0 - Lightweight PDF text extraction at `app/api/parse-pdf/route.ts`

**UI Utilities:**
- clsx ^2.1.1 - Conditional className utility used in `lib/utils.ts`
- tailwind-merge ^3.4.0 - Merge Tailwind CSS classes without conflicts at `lib/utils.ts`

**Type Definitions:**
- @types/node ^20 - Node.js type definitions
- @types/react ^19 - React type definitions
- @types/react-dom ^19 - React DOM type definitions

## Configuration

**Environment:**
- Variables configured via `.env.local` (git-ignored, not committed)
- Example template: `.env.example` with required variables documented
- Environment setup required for:
  - AI API: `ANTHROPIC_API_KEY`
  - Email service: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
  - Recipients: `BRIEF_RECIPIENT_1`, `BRIEF_RECIPIENT_2` (optional)
  - App: `NEXT_PUBLIC_APP_URL` (public environment variable for frontend)

**Build:**
- `next.config.ts` - Next.js configuration (minimal, no custom plugins)
- `tsconfig.json` - TypeScript compiler options:
  - Target: ES2017
  - Module resolution: bundler
  - Path aliases: `@/*` maps to project root
  - Strict mode enabled
- `postcss.config.mjs` - PostCSS configuration for Tailwind CSS processing
- `eslint.config.mjs` - ESLint configuration:
  - Extends: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
  - Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Platform Requirements

**Development:**
- Node.js 24.4.1+ (tested)
- npm 11.4.2+
- macOS or Linux/Unix-compatible shell (project uses bash/zsh)

**Production:**
- Deployment target: Vercel (`.vercel/project.json` configured)
  - Project ID: `prj_TsiH17AxXd925Z5tjdKnWkVMKD5B`
  - Organization ID: `team_cWzHlJ6Vlq6QcdU0aTatA34a`
- Next.js production server requirements
- Environment variables required in Vercel project settings (sensitive keys)

---

*Stack analysis: 2026-02-10*
