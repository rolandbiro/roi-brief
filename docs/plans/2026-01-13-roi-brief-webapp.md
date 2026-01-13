# ROI Brief Webapp Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans-with-progress to implement this plan task-by-task.

**Goal:** Build an AI-powered brief collection webapp for ROI Works marketing agency where clients upload their proposal PDF and an AI chatbot guides them through filling out a campaign brief.

**Architecture:** Next.js 14 App Router with Tailwind CSS for styling. Claude API for conversational brief collection with streaming responses. SendGrid for email delivery with PDF attachments generated via @react-pdf/renderer.

**Tech Stack:** Next.js 14, Tailwind CSS, Claude API (claude-opus-4-5-20251101), SendGrid, @react-pdf/renderer

**Progress File:** `docs/plans/progress/2026-01-13-roi-brief-webapp-progress.md`

---

## Phase 1: Project Setup & Foundation

### Task 1.1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `tsconfig.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

**Step 1: Create Next.js project with TypeScript and Tailwind**

```bash
cd /Users/biroroland/roi-brief
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Expected: Project scaffolded with Next.js 14, TypeScript, Tailwind CSS

**Step 2: Verify project runs**

```bash
npm run dev
```

Expected: Server starts at http://localhost:3000

**Step 3: Commit initial setup**

```bash
git init
git add .
git commit -m "chore: initialize Next.js 14 project with TypeScript and Tailwind"
```

---

### Task 1.2: Configure Tailwind with ROI Works Brand Colors

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Step 1: Update tailwind.config.ts with brand colors**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        roi: {
          orange: "#FF6400",
          "orange-80": "#FF8333",
          "orange-60": "#FFA266",
          blue: "#0022D2",
          "blue-80": "#334ED8",
          "blue-60": "#667ADE",
          gray: {
            light: "#E3E3E3",
            dark: "#3C3E43",
            darker: "#2A2B2E",
          },
          black: "#000000",
        },
      },
      fontFamily: {
        archivo: ["Archivo", "sans-serif"],
        "archivo-expanded": ["Archivo SemiExpanded", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2: Update globals.css with base styles**

```css
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700;900&family=Archivo+SemiExpanded:wght@400;500;700;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-roi-gray-dark text-white font-archivo;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-archivo-expanded font-black;
  }
}

@layer components {
  .btn-primary {
    @apply bg-roi-orange text-black font-bold py-3 px-6 rounded-lg
           hover:bg-roi-orange-80 transition-colors duration-200;
  }

  .btn-secondary {
    @apply border border-roi-orange text-roi-orange font-bold py-3 px-6 rounded-lg
           hover:bg-roi-orange hover:text-black transition-colors duration-200;
  }

  .card {
    @apply bg-roi-gray-darker rounded-xl p-6;
  }
}
```

**Step 3: Verify styles work**

```bash
npm run dev
```

Visit http://localhost:3000 - page should have dark background

**Step 4: Commit brand configuration**

```bash
git add tailwind.config.ts app/globals.css
git commit -m "feat: configure Tailwind with ROI Works brand colors and typography"
```

---

### Task 1.3: Setup Environment Variables

**Files:**
- Create: `.env.local`
- Create: `.env.example`
- Modify: `.gitignore`

**Step 1: Create .env.local with actual keys**

```bash
# .env.local
ANTHROPIC_API_KEY=<copy from /Users/biroroland/ihr-portal/ihr-portal/.env>
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=brief@roi.works
BRIEF_RECIPIENT_1=recipient1@roi.works
BRIEF_RECIPIENT_2=recipient2@roi.works
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 2: Create .env.example (no secrets)**

```bash
# .env.example
ANTHROPIC_API_KEY=sk-ant-...
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=brief@roi.works
BRIEF_RECIPIENT_1=recipient1@roi.works
BRIEF_RECIPIENT_2=recipient2@roi.works
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 3: Verify .gitignore includes .env.local**

Check that `.env*.local` is in `.gitignore` (Next.js adds this by default)

**Step 4: Commit env example**

```bash
git add .env.example .gitignore
git commit -m "chore: add environment variable template"
```

---

### Task 1.4: Install Required Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install AI SDK and dependencies**

```bash
npm install @anthropic-ai/sdk ai @sendgrid/mail @react-pdf/renderer
```

**Step 2: Install dev dependencies for types**

```bash
npm install -D @types/node
```

**Step 3: Verify installation**

```bash
npm run build
```

Expected: Build succeeds without errors

**Step 4: Commit dependencies**

```bash
git add package.json package-lock.json
git commit -m "chore: install Claude SDK, SendGrid, and react-pdf dependencies"
```

---

## Phase 2: Core Components & Layout

### Task 2.1: Create Main Layout with ROI Works Header

**Files:**
- Create: `components/Header.tsx`
- Create: `components/Logo.tsx`
- Modify: `app/layout.tsx`

**Step 1: Create Logo component**

```typescript
// components/Logo.tsx
export function Logo({ className = "h-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ROI Works logo - simplified SVG */}
      <g fill="currentColor">
        {/* Three ascending bars forming the icon */}
        <path d="M0 45 L0 20 L12 8 L12 45 Z" className="fill-roi-orange" />
        <path d="M18 45 L18 12 L30 0 L30 45 Z" className="fill-roi-orange" />
        <path d="M36 45 L36 25 L48 13 L48 45 Z" className="fill-roi-orange" />
      </g>
      {/* Text part */}
      <text x="60" y="25" className="fill-current font-archivo-expanded font-black text-xl">
        ROI
      </text>
      <text x="60" y="45" className="fill-current font-archivo-expanded font-black text-xl">
        WORKS
      </text>
    </svg>
  );
}
```

**Step 2: Create Header component**

```typescript
// components/Header.tsx
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-roi-gray-dark/95 backdrop-blur-sm border-b border-roi-gray-darker">
      <div className="container mx-auto px-6 py-4">
        <Logo className="h-10 text-white" />
      </div>
    </header>
  );
}
```

**Step 3: Update layout.tsx**

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROI Works - Kampány Brief",
  description: "AI-asszisztált kampány brief kitöltés",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body className="min-h-screen">
        <Header />
        <main className="pt-20">{children}</main>
      </body>
    </html>
  );
}
```

**Step 4: Verify layout renders**

```bash
npm run dev
```

Expected: Header with logo visible at top

**Step 5: Commit layout**

```bash
git add components/ app/layout.tsx
git commit -m "feat: add Header and Logo components with ROI Works branding"
```

---

### Task 2.2: Create PDF Upload Component

**Files:**
- Create: `components/PdfUpload.tsx`
- Create: `lib/utils.ts`

**Step 1: Create utility functions**

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}
```

**Step 2: Install clsx and tailwind-merge**

```bash
npm install clsx tailwind-merge
```

**Step 3: Create PdfUpload component**

```typescript
// components/PdfUpload.tsx
"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface PdfUploadProps {
  onFileSelected: (file: File, base64: string) => void;
}

export function PdfUpload({ onFileSelected }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (file.type !== "application/pdf") {
        setError("Csak PDF fájlokat fogadunk el.");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("A fájl mérete nem haladhatja meg a 10MB-ot.");
        return;
      }

      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        onFileSelected(file, base64);
      };
      reader.readAsDataURL(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
          isDragging
            ? "border-roi-orange bg-roi-orange/10"
            : "border-roi-gray-light/30 hover:border-roi-orange/50 hover:bg-roi-gray-darker/50",
          fileName && "border-green-500 bg-green-500/10"
        )}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {fileName ? (
            <>
              <svg
                className="w-12 h-12 mb-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-lg font-medium text-green-500">{fileName}</p>
              <p className="text-sm text-roi-gray-light mt-2">
                Kattintson ide másik fájl választásához
              </p>
            </>
          ) : (
            <>
              <svg
                className="w-12 h-12 mb-4 text-roi-orange"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mb-2 text-lg">
                <span className="font-semibold text-roi-orange">
                  Kattintson a feltöltéshez
                </span>{" "}
                vagy húzza ide a fájlt
              </p>
              <p className="text-sm text-roi-gray-light">
                PDF formátum (max. 10MB)
              </p>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
        />
      </label>
      {error && (
        <p className="mt-4 text-center text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
```

**Step 4: Verify component compiles**

```bash
npm run build
```

Expected: Build succeeds

**Step 5: Commit upload component**

```bash
git add components/PdfUpload.tsx lib/utils.ts package.json package-lock.json
git commit -m "feat: add PDF upload component with drag-and-drop support"
```

---

### Task 2.3: Create Chat UI Components

**Files:**
- Create: `components/chat/ChatContainer.tsx`
- Create: `components/chat/ChatMessage.tsx`
- Create: `components/chat/ChatInput.tsx`
- Create: `types/chat.ts`

**Step 1: Create chat types**

```typescript
// types/chat.ts
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface BriefData {
  company: {
    name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
  };
  campaign: {
    name: string;
    type: string;
    goal: string;
    message: string;
    kpis: string[];
  };
  target_audience: {
    demographics: {
      gender: string;
      age: string;
      location: string;
    };
    psychographics: string;
    persona: string;
  };
  channels: string[];
  timeline: {
    start: string;
    end: string;
    important_dates: string[];
  };
  budget: {
    total: string;
    distribution: Record<string, string>;
  };
  competitors: string[];
  notes: string;
}
```

**Step 2: Create ChatMessage component**

```typescript
// components/chat/ChatMessage.tsx
import { cn } from "@/lib/utils";
import { Message } from "@/types/chat";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-roi-orange text-black rounded-br-sm"
            : "bg-roi-gray-darker text-white rounded-bl-sm"
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-roi-orange flex items-center justify-center">
              <span className="text-black text-xs font-bold">AI</span>
            </div>
            <span className="text-roi-orange text-sm font-medium">
              ROI Brief Asszisztens
            </span>
          </div>
        )}
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}
```

**Step 3: Create ChatInput component**

```typescript
// components/chat/ChatInput.tsx
"use client";

import { useState, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Írja be válaszát...",
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-3 p-4 bg-roi-gray-darker rounded-xl">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        className="flex-1 bg-transparent border border-roi-gray-light/30 rounded-lg px-4 py-3
                   text-white placeholder-roi-gray-light/50 resize-none
                   focus:outline-none focus:border-roi-orange transition-colors"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="btn-primary px-6 self-end disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Küldés
      </button>
    </div>
  );
}
```

**Step 4: Create ChatContainer component**

```typescript
// components/chat/ChatContainer.tsx
"use client";

import { useRef, useEffect } from "react";
import { Message } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  streamingContent?: string;
}

export function ChatContainer({
  messages,
  onSendMessage,
  isLoading = false,
  streamingContent,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {streamingContent && (
          <ChatMessage
            message={{
              id: "streaming",
              role: "assistant",
              content: streamingContent,
              timestamp: new Date(),
            }}
          />
        )}
        {isLoading && !streamingContent && (
          <div className="flex justify-start mb-4">
            <div className="bg-roi-gray-darker rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-roi-orange rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-roi-orange rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-2 h-2 bg-roi-orange rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-roi-gray-darker p-4">
        <ChatInput
          onSend={onSendMessage}
          disabled={isLoading}
          placeholder={isLoading ? "Várakozás a válaszra..." : "Írja be válaszát..."}
        />
      </div>
    </div>
  );
}
```

**Step 5: Verify build**

```bash
npm run build
```

Expected: Build succeeds

**Step 6: Commit chat components**

```bash
git add components/chat/ types/
git commit -m "feat: add chat UI components (container, message, input)"
```

---

## Phase 3: AI Integration

### Task 3.1: Create Claude API Route with Streaming

**Files:**
- Create: `app/api/chat/route.ts`
- Create: `lib/prompts.ts`

**Step 1: Create system prompt**

```typescript
// lib/prompts.ts
export const BRIEF_SYSTEM_PROMPT = `Te a ROI Works marketing ügynökség brief asszisztense vagy.
Professzionális, segítőkész tanácsadóként viselkedsz, magázódva kommunikálsz.

FELADATOD:
1. Elemezd az ügyfél által feltöltött ajánlatot
2. A brief template alapján kérdezd ki az ügyfelet
3. Minden kérdéshez adj magyarázó kontextust, ami segíti a válaszadást
4. Ha minden információ megvan, foglald össze a briefet JSON formátumban

BRIEF MEZŐK (sorrendben kérdezd):
1. Cégnév, kapcsolattartó adatok (név, email, telefon)
2. Kampány neve és típusa
3. Kampány elsődleges célja
4. Fő KPI-k (mérési mutatók)
5. Kampány üzenete
6. Célcsoport demográfia (nem, kor, földrajzi hely)
7. Célcsoport pszichográfia (érdeklődés, vásárlási szokások)
8. Ideális ügyfélprofil (persona)
9. Hirdetési csatornák
10. Kampány időzítése (kezdés, befejezés, fontos dátumok)
11. Költségvetés
12. Versenytársak
13. Egyéb megjegyzések

STÍLUS:
- Magyar nyelv
- Magázódás (Ön, Önök)
- Professzionális de barátságos
- MINDIG csak egy kérdés egyszerre
- Minden kérdéshez adj rövid magyarázó kontextust (💡 jellel)
- Ha az ajánlatból ki tudsz olvasni információt, erősítsd meg az ügyféllel

KÉRDÉS FORMÁTUM:
[Kérdés szövege]

💡 *[Magyarázó kontextus, példák, miért fontos ez a kérdés]*

BEFEJEZÉS:
Amikor minden kérdésre megkaptad a választ, ezt írd:
"Köszönöm a válaszokat! Most összeállítom a kampány briefet..."

Majd generálj egy JSON objektumot a következő formátumban (BRIEF_JSON_START és BRIEF_JSON_END tagek közé):

BRIEF_JSON_START
{
  "company": { "name": "...", "contact_name": "...", "contact_email": "...", "contact_phone": "..." },
  "campaign": { "name": "...", "type": "...", "goal": "...", "message": "...", "kpis": ["..."] },
  "target_audience": {
    "demographics": { "gender": "...", "age": "...", "location": "..." },
    "psychographics": "...",
    "persona": "..."
  },
  "channels": ["..."],
  "timeline": { "start": "...", "end": "...", "important_dates": ["..."] },
  "budget": { "total": "...", "distribution": {} },
  "competitors": ["..."],
  "notes": "..."
}
BRIEF_JSON_END`;

export const createInitialMessage = (proposalContent: string) => `
Az ügyfél feltöltötte az ajánlatát. Íme a tartalma:

---
${proposalContent}
---

Kérlek, kezdd el a brief kikérdezést! Köszöntsd az ügyfelet, említsd meg hogy áttekintetted az ajánlatot, és tedd fel az első kérdést.
`;
```

**Step 2: Create chat API route**

```typescript
// app/api/chat/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { BRIEF_SYSTEM_PROMPT } from "@/lib/prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { messages, pdfContent } = await request.json();

    // Build conversation for Claude
    const claudeMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Create streaming response
    const stream = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 4096,
      system: BRIEF_SYSTEM_PROMPT,
      messages: claudeMessages,
      stream: true,
    });

    // Create a ReadableStream from the Anthropic stream
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Hiba történt a chat feldolgozása során" },
      { status: 500 }
    );
  }
}
```

**Step 3: Verify API route compiles**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Commit API route**

```bash
git add app/api/chat/ lib/prompts.ts
git commit -m "feat: add Claude API route with streaming support"
```

---

### Task 3.2: Create Chat Hook for State Management

**Files:**
- Create: `hooks/useChat.ts`

**Step 1: Create useChat hook**

```typescript
// hooks/useChat.ts
"use client";

import { useState, useCallback } from "react";
import { Message, BriefData } from "@/types/chat";
import { createInitialMessage } from "@/lib/prompts";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startChat = useCallback(async (pdfBase64: string, pdfText: string) => {
    setIsLoading(true);
    setError(null);

    const initialUserMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: createInitialMessage(pdfText || "Az ajánlat tartalma nem volt kiolvasható, de az ügyfél szeretné kitölteni a briefet."),
      timestamp: new Date(),
    };

    setMessages([initialUserMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: initialUserMessage.content }],
          pdfContent: pdfBase64,
        }),
      });

      if (!response.ok) throw new Error("Failed to start chat");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullContent += parsed.text;
                setStreamingContent(fullContent);
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");

      // Check if brief data is in the response
      checkForBriefData(fullContent);
    } catch (err) {
      setError("Hiba történt a chat indítása során. Kérjük, próbálja újra.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const allMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullContent += parsed.text;
                setStreamingContent(fullContent);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: fullContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");

      checkForBriefData(fullContent);
    } catch (err) {
      setError("Hiba történt az üzenet küldése során. Kérjük, próbálja újra.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const checkForBriefData = (content: string) => {
    const jsonMatch = content.match(/BRIEF_JSON_START\s*([\s\S]*?)\s*BRIEF_JSON_END/);
    if (jsonMatch) {
      try {
        const briefJson = JSON.parse(jsonMatch[1]);
        setBriefData(briefJson);
      } catch (err) {
        console.error("Failed to parse brief JSON:", err);
      }
    }
  };

  return {
    messages,
    isLoading,
    streamingContent,
    briefData,
    error,
    startChat,
    sendMessage,
    setBriefData,
  };
}
```

**Step 2: Verify hook compiles**

```bash
npm run build
```

Expected: Build succeeds

**Step 3: Commit hook**

```bash
git add hooks/
git commit -m "feat: add useChat hook for chat state management with streaming"
```

---

## Phase 4: Main Application Pages

### Task 4.1: Create Landing Page with Upload

**Files:**
- Modify: `app/page.tsx`

**Step 1: Update landing page**

```typescript
// app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PdfUpload } from "@/components/PdfUpload";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<{ name: string; base64: string } | null>(null);

  const handleFileSelected = (selectedFile: File, base64: string) => {
    setFile({ name: selectedFile.name, base64 });
    // Store in sessionStorage for the chat page
    sessionStorage.setItem("proposalPdf", JSON.stringify({ name: selectedFile.name, base64 }));
  };

  const handleContinue = () => {
    if (file) {
      router.push("/brief");
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-archivo-expanded font-black mb-6">
          Kampány <span className="text-roi-orange">Brief</span>
        </h1>
        <p className="text-xl text-roi-gray-light mb-12">
          Üdvözöljük a ROI Works brief rendszerben! Töltse fel az elfogadott
          ajánlatot, és AI asszisztensünk segít összeállítani a kampány briefet.
        </p>

        <PdfUpload onFileSelected={handleFileSelected} />

        <div className="mt-8">
          <button
            onClick={handleContinue}
            disabled={!file}
            className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tovább a brief kitöltéshez
          </button>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-6 text-left">
          <div className="card">
            <div className="w-12 h-12 bg-roi-orange/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-roi-orange text-2xl font-bold">1</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Feltöltés</h3>
            <p className="text-roi-gray-light text-sm">
              Töltse fel az elfogadott ajánlatot PDF formátumban.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-roi-orange/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-roi-orange text-2xl font-bold">2</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Kitöltés</h3>
            <p className="text-roi-gray-light text-sm">
              AI asszisztensünk végigvezeti a brief kérdéseken.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-roi-orange/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-roi-orange text-2xl font-bold">3</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Küldés</h3>
            <p className="text-roi-gray-light text-sm">
              Ellenőrizze és küldje el a kész briefet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify page renders**

```bash
npm run dev
```

Visit http://localhost:3000 - landing page should display

**Step 3: Commit landing page**

```bash
git add app/page.tsx
git commit -m "feat: create landing page with PDF upload and step indicators"
```

---

### Task 4.2: Create Brief Chat Page

**Files:**
- Create: `app/brief/page.tsx`

**Step 1: Create brief page**

```typescript
// app/brief/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { useChat } from "@/hooks/useChat";
import { BriefEditor } from "@/components/BriefEditor";

export default function BriefPage() {
  const router = useRouter();
  const [pdfData, setPdfData] = useState<{ name: string; base64: string } | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const {
    messages,
    isLoading,
    streamingContent,
    briefData,
    error,
    startChat,
    sendMessage,
    setBriefData,
  } = useChat();

  useEffect(() => {
    const storedPdf = sessionStorage.getItem("proposalPdf");
    if (!storedPdf) {
      router.push("/");
      return;
    }

    const parsed = JSON.parse(storedPdf);
    setPdfData(parsed);

    // Extract text from PDF (for now, we'll pass the base64 and let Claude handle it)
    // In production, you might want to use a PDF parser library
    startChat(parsed.base64, `[PDF fájl: ${parsed.name}]`);
  }, [router, startChat]);

  useEffect(() => {
    if (briefData) {
      setShowEditor(true);
    }
  }, [briefData]);

  if (!pdfData) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <p>Átirányítás...</p>
      </div>
    );
  }

  if (showEditor && briefData) {
    return (
      <BriefEditor
        initialData={briefData}
        onBack={() => setShowEditor(false)}
      />
    );
  }

  return (
    <div className="container mx-auto px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-archivo-expanded font-black">
              Brief <span className="text-roi-orange">kitöltés</span>
            </h1>
            <p className="text-sm text-roi-gray-light">
              Feltöltött dokumentum: {pdfData.name}
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="btn-secondary text-sm"
          >
            Új brief
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        <ChatContainer
          messages={messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          streamingContent={streamingContent}
        />
      </div>
    </div>
  );
}
```

**Step 2: Verify page compiles**

```bash
npm run build
```

Expected: Build may fail because BriefEditor doesn't exist yet - that's OK, we'll create it next

**Step 3: Commit brief page (partial)**

```bash
git add app/brief/
git commit -m "feat: create brief chat page with AI integration (WIP - needs BriefEditor)"
```

---

### Task 4.3: Create Brief Editor Component

**Files:**
- Create: `components/BriefEditor.tsx`

**Step 1: Create BriefEditor component**

```typescript
// components/BriefEditor.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BriefData } from "@/types/chat";

interface BriefEditorProps {
  initialData: BriefData;
  onBack: () => void;
}

export function BriefEditor({ initialData, onBack }: BriefEditorProps) {
  const router = useRouter();
  const [briefData, setBriefData] = useState<BriefData>(initialData);
  const [isSending, setIsSending] = useState(false);
  const [clientEmail, setClientEmail] = useState(initialData.company.contact_email || "");
  const [success, setSuccess] = useState(false);

  const updateField = (path: string, value: string | string[]) => {
    setBriefData((prev) => {
      const newData = { ...prev };
      const keys = path.split(".");
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSend = async () => {
    if (!clientEmail) {
      alert("Kérjük, adja meg az email címét!");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/send-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefData,
          clientEmail,
        }),
      });

      if (!response.ok) throw new Error("Failed to send brief");

      setSuccess(true);
    } catch (error) {
      console.error("Error sending brief:", error);
      alert("Hiba történt a brief küldése során. Kérjük, próbálja újra.");
    } finally {
      setIsSending(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-archivo-expanded font-black mb-4">
            Brief <span className="text-roi-orange">elküldve!</span>
          </h1>
          <p className="text-roi-gray-light mb-8">
            A kampány brief sikeresen elküldve a megadott email címekre.
            Hamarosan felvesszük Önnel a kapcsolatot.
          </p>
          <button onClick={() => router.push("/")} className="btn-primary">
            Új brief indítása
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-archivo-expanded font-black">
              Brief <span className="text-roi-orange">ellenőrzés</span>
            </h1>
            <p className="text-sm text-roi-gray-light">
              Ellenőrizze és szükség esetén módosítsa az adatokat
            </p>
          </div>
          <button onClick={onBack} className="btn-secondary text-sm">
            Vissza a chathez
          </button>
        </div>

        <div className="space-y-6">
          {/* Company Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Cégadatok</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Cégnév</label>
                <input
                  type="text"
                  value={briefData.company.name}
                  onChange={(e) => updateField("company.name", e.target.value)}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Kapcsolattartó neve</label>
                <input
                  type="text"
                  value={briefData.company.contact_name}
                  onChange={(e) => updateField("company.contact_name", e.target.value)}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Email</label>
                <input
                  type="email"
                  value={briefData.company.contact_email}
                  onChange={(e) => {
                    updateField("company.contact_email", e.target.value);
                    setClientEmail(e.target.value);
                  }}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Telefon</label>
                <input
                  type="tel"
                  value={briefData.company.contact_phone}
                  onChange={(e) => updateField("company.contact_phone", e.target.value)}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          </section>

          {/* Campaign Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Kampány</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-roi-gray-light mb-1">Kampány neve</label>
                  <input
                    type="text"
                    value={briefData.campaign.name}
                    onChange={(e) => updateField("campaign.name", e.target.value)}
                    className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-roi-gray-light mb-1">Kampány típusa</label>
                  <input
                    type="text"
                    value={briefData.campaign.type}
                    onChange={(e) => updateField("campaign.type", e.target.value)}
                    className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Kampány célja</label>
                <textarea
                  value={briefData.campaign.goal}
                  onChange={(e) => updateField("campaign.goal", e.target.value)}
                  rows={2}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Kampány üzenete</label>
                <textarea
                  value={briefData.campaign.message}
                  onChange={(e) => updateField("campaign.message", e.target.value)}
                  rows={2}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">KPI-k (vesszővel elválasztva)</label>
                <input
                  type="text"
                  value={briefData.campaign.kpis.join(", ")}
                  onChange={(e) => updateField("campaign.kpis", e.target.value.split(",").map((s) => s.trim()))}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          </section>

          {/* Target Audience Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Célcsoport</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-roi-gray-light mb-1">Nem</label>
                  <input
                    type="text"
                    value={briefData.target_audience.demographics.gender}
                    onChange={(e) => updateField("target_audience.demographics.gender", e.target.value)}
                    className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-roi-gray-light mb-1">Kor</label>
                  <input
                    type="text"
                    value={briefData.target_audience.demographics.age}
                    onChange={(e) => updateField("target_audience.demographics.age", e.target.value)}
                    className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-roi-gray-light mb-1">Földrajzi hely</label>
                  <input
                    type="text"
                    value={briefData.target_audience.demographics.location}
                    onChange={(e) => updateField("target_audience.demographics.location", e.target.value)}
                    className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Pszichográfia</label>
                <textarea
                  value={briefData.target_audience.psychographics}
                  onChange={(e) => updateField("target_audience.psychographics", e.target.value)}
                  rows={2}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Persona</label>
                <textarea
                  value={briefData.target_audience.persona}
                  onChange={(e) => updateField("target_audience.persona", e.target.value)}
                  rows={2}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white resize-none"
                />
              </div>
            </div>
          </section>

          {/* Channels Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Csatornák</h2>
            <div>
              <label className="block text-sm text-roi-gray-light mb-1">Hirdetési csatornák (vesszővel elválasztva)</label>
              <input
                type="text"
                value={briefData.channels.join(", ")}
                onChange={(e) => updateField("channels", e.target.value.split(",").map((s) => s.trim()))}
                className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </section>

          {/* Timeline Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Időzítés</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Kezdés</label>
                <input
                  type="text"
                  value={briefData.timeline.start}
                  onChange={(e) => updateField("timeline.start", e.target.value)}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-roi-gray-light mb-1">Befejezés</label>
                <input
                  type="text"
                  value={briefData.timeline.end}
                  onChange={(e) => updateField("timeline.end", e.target.value)}
                  className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          </section>

          {/* Budget Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Költségvetés</h2>
            <div>
              <label className="block text-sm text-roi-gray-light mb-1">Teljes büdzsé</label>
              <input
                type="text"
                value={briefData.budget.total}
                onChange={(e) => updateField("budget.total", e.target.value)}
                className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </section>

          {/* Competitors Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Versenytársak</h2>
            <div>
              <label className="block text-sm text-roi-gray-light mb-1">Versenytársak (vesszővel elválasztva)</label>
              <input
                type="text"
                value={briefData.competitors.join(", ")}
                onChange={(e) => updateField("competitors", e.target.value.split(",").map((s) => s.trim()))}
                className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </section>

          {/* Notes Section */}
          <section className="card">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Megjegyzések</h2>
            <textarea
              value={briefData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={4}
              className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white resize-none"
            />
          </section>

          {/* Email for sending */}
          <section className="card border-2 border-roi-orange">
            <h2 className="text-xl font-bold mb-4 text-roi-orange">Küldés</h2>
            <div className="mb-4">
              <label className="block text-sm text-roi-gray-light mb-1">
                Az Ön email címe (ide küldjük a brief másolatát)
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="email@pelda.hu"
                className="w-full bg-roi-gray-dark border border-roi-gray-light/30 rounded-lg px-4 py-2 text-white"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={isSending || !clientEmail}
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? "Küldés folyamatban..." : "Brief elküldése"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds

**Step 3: Commit BriefEditor**

```bash
git add components/BriefEditor.tsx
git commit -m "feat: add BriefEditor component with editable fields and send functionality"
```

---

## Phase 5: Email & PDF Generation

### Task 5.1: Create PDF Generation Utility

**Files:**
- Create: `lib/pdf-template.tsx`

**Step 1: Create PDF template**

```typescript
// lib/pdf-template.tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { BriefData } from "@/types/chat";

// Register Archivo font (using system fallback for now)
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#FF6400",
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6400",
  },
  date: {
    fontSize: 10,
    color: "#666666",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000000",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6400",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#E3E3E3",
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    color: "#666666",
    width: 120,
  },
  value: {
    fontSize: 10,
    color: "#000000",
    flex: 1,
  },
  textBlock: {
    fontSize: 10,
    color: "#000000",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999999",
  },
});

interface BriefPdfProps {
  data: BriefData;
}

export function BriefPdf({ data }: BriefPdfProps) {
  const today = new Date().toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>ROI WORKS</Text>
          <Text style={styles.date}>{today}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Kampány Brief: {data.campaign.name || "N/A"}
        </Text>

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cégadatok</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cégnév:</Text>
            <Text style={styles.value}>{data.company.name || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kapcsolattartó:</Text>
            <Text style={styles.value}>{data.company.contact_name || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{data.company.contact_email || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Telefon:</Text>
            <Text style={styles.value}>{data.company.contact_phone || "N/A"}</Text>
          </View>
        </View>

        {/* Campaign Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kampány</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Típus:</Text>
            <Text style={styles.value}>{data.campaign.type || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Cél:</Text>
            <Text style={styles.value}>{data.campaign.goal || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>KPI-k:</Text>
            <Text style={styles.value}>{data.campaign.kpis.join(", ") || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Üzenet:</Text>
            <Text style={styles.value}>{data.campaign.message || "N/A"}</Text>
          </View>
        </View>

        {/* Target Audience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Célcsoport</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Demográfia:</Text>
            <Text style={styles.value}>
              {data.target_audience.demographics.gender || "N/A"},{" "}
              {data.target_audience.demographics.age || "N/A"},{" "}
              {data.target_audience.demographics.location || "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pszichográfia:</Text>
            <Text style={styles.value}>
              {data.target_audience.psychographics || "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Persona:</Text>
            <Text style={styles.value}>{data.target_audience.persona || "N/A"}</Text>
          </View>
        </View>

        {/* Channels & Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Csatornák és időzítés</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Csatornák:</Text>
            <Text style={styles.value}>{data.channels.join(", ") || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Időszak:</Text>
            <Text style={styles.value}>
              {data.timeline.start || "N/A"} - {data.timeline.end || "N/A"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Büdzsé:</Text>
            <Text style={styles.value}>{data.budget.total || "N/A"}</Text>
          </View>
        </View>

        {/* Competitors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Versenytársak</Text>
          <Text style={styles.textBlock}>
            {data.competitors.join(", ") || "Nincs megadva"}
          </Text>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Megjegyzések</Text>
            <Text style={styles.textBlock}>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generálva: brief.roi.works | ROI Works Marketing Ügynökség
        </Text>
      </Page>
    </Document>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds

**Step 3: Commit PDF template**

```bash
git add lib/pdf-template.tsx
git commit -m "feat: add PDF template for brief generation"
```

---

### Task 5.2: Create Send Brief API Route

**Files:**
- Create: `app/api/send-brief/route.ts`
- Create: `lib/email-template.ts`

**Step 1: Create email template**

```typescript
// lib/email-template.ts
import { BriefData } from "@/types/chat";

export function generateEmailHtml(data: BriefData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #3C3E43;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .logo {
      color: #FF6400;
      font-size: 24px;
      font-weight: bold;
    }
    h1 {
      color: #FF6400;
      border-bottom: 2px solid #FF6400;
      padding-bottom: 10px;
    }
    h2 {
      color: #FF6400;
      font-size: 16px;
      margin-top: 25px;
      margin-bottom: 10px;
    }
    .section {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .row {
      margin-bottom: 8px;
    }
    .label {
      font-weight: bold;
      color: #666;
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">ROI WORKS</div>
  </div>

  <h1>Kampány Brief: ${data.campaign.name || "N/A"}</h1>

  <h2>Cégadatok</h2>
  <div class="section">
    <div class="row"><span class="label">Cégnév:</span> ${data.company.name || "N/A"}</div>
    <div class="row"><span class="label">Kapcsolattartó:</span> ${data.company.contact_name || "N/A"}</div>
    <div class="row"><span class="label">Email:</span> ${data.company.contact_email || "N/A"}</div>
    <div class="row"><span class="label">Telefon:</span> ${data.company.contact_phone || "N/A"}</div>
  </div>

  <h2>Kampány</h2>
  <div class="section">
    <div class="row"><span class="label">Típus:</span> ${data.campaign.type || "N/A"}</div>
    <div class="row"><span class="label">Cél:</span> ${data.campaign.goal || "N/A"}</div>
    <div class="row"><span class="label">KPI-k:</span> ${data.campaign.kpis.join(", ") || "N/A"}</div>
    <div class="row"><span class="label">Üzenet:</span> ${data.campaign.message || "N/A"}</div>
  </div>

  <h2>Célcsoport</h2>
  <div class="section">
    <div class="row"><span class="label">Demográfia:</span> ${data.target_audience.demographics.gender}, ${data.target_audience.demographics.age}, ${data.target_audience.demographics.location}</div>
    <div class="row"><span class="label">Pszichográfia:</span> ${data.target_audience.psychographics || "N/A"}</div>
    <div class="row"><span class="label">Persona:</span> ${data.target_audience.persona || "N/A"}</div>
  </div>

  <h2>Csatornák és időzítés</h2>
  <div class="section">
    <div class="row"><span class="label">Csatornák:</span> ${data.channels.join(", ") || "N/A"}</div>
    <div class="row"><span class="label">Időszak:</span> ${data.timeline.start} - ${data.timeline.end}</div>
    <div class="row"><span class="label">Büdzsé:</span> ${data.budget.total || "N/A"}</div>
  </div>

  <h2>Versenytársak</h2>
  <div class="section">
    ${data.competitors.join(", ") || "Nincs megadva"}
  </div>

  ${data.notes ? `
  <h2>Megjegyzések</h2>
  <div class="section">
    ${data.notes}
  </div>
  ` : ""}

  <div class="footer">
    <p>Ez az email a ROI Works brief rendszerből lett küldve.</p>
    <p>brief.roi.works | ROI Works Marketing Ügynökség</p>
  </div>
</body>
</html>
  `;
}
```

**Step 2: Create send-brief API route**

```typescript
// app/api/send-brief/route.ts
import sgMail from "@sendgrid/mail";
import { renderToBuffer } from "@react-pdf/renderer";
import { BriefPdf } from "@/lib/pdf-template";
import { generateEmailHtml } from "@/lib/email-template";
import { BriefData } from "@/types/chat";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: Request) {
  try {
    const { briefData, clientEmail } = (await request.json()) as {
      briefData: BriefData;
      clientEmail: string;
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(<BriefPdf data={briefData} />);
    const pdfBase64 = pdfBuffer.toString("base64");

    // Prepare recipients
    const recipients = [
      clientEmail,
      process.env.BRIEF_RECIPIENT_1,
      process.env.BRIEF_RECIPIENT_2,
    ].filter(Boolean) as string[];

    const subject = `[ROI Works] Kampány Brief - ${briefData.company.name} - ${briefData.campaign.name}`;
    const htmlContent = generateEmailHtml(briefData);

    // Send emails
    const messages = recipients.map((to) => ({
      to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject,
      html: htmlContent,
      attachments: [
        {
          content: pdfBase64,
          filename: `brief-${briefData.company.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`,
          type: "application/pdf",
          disposition: "attachment" as const,
        },
      ],
    }));

    await Promise.all(messages.map((msg) => sgMail.send(msg)));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Send brief error:", error);
    return Response.json(
      { error: "Hiba történt a brief küldése során" },
      { status: 500 }
    );
  }
}
```

**Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Commit email functionality**

```bash
git add app/api/send-brief/ lib/email-template.ts
git commit -m "feat: add email sending API with PDF attachment"
```

---

## Phase 6: Final Polish & Testing

### Task 6.1: Add Loading States and Error Boundaries

**Files:**
- Create: `app/brief/loading.tsx`
- Create: `app/brief/error.tsx`
- Create: `components/LoadingSpinner.tsx`

**Step 1: Create LoadingSpinner**

```typescript
// components/LoadingSpinner.tsx
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg viewBox="0 0 24 24" fill="none" className="text-roi-orange">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          strokeOpacity="0.2"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
```

**Step 2: Create loading state**

```typescript
// app/brief/loading.tsx
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Loading() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-roi-gray-light">Brief betöltése...</p>
      </div>
    </div>
  );
}
```

**Step 3: Create error boundary**

```typescript
// app/brief/error.tsx
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4">Hiba történt</h2>
        <p className="text-roi-gray-light mb-6">
          Sajnáljuk, hiba történt a brief feldolgozása során.
        </p>
        <button onClick={reset} className="btn-primary">
          Próbálja újra
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Commit loading states**

```bash
git add components/LoadingSpinner.tsx app/brief/loading.tsx app/brief/error.tsx
git commit -m "feat: add loading spinner and error boundary components"
```

---

### Task 6.2: Create README and Final Verification

**Files:**
- Create: `README.md`

**Step 1: Create README**

```markdown
# ROI Works Brief

AI-asszisztált kampány brief kitöltő webapp a ROI Works marketing ügynökség számára.

## Funkciók

- PDF ajánlat feltöltés
- AI chatbot (Claude Opus 4.5) vezérelt brief kitöltés
- Streaming válaszok valós időben
- Szerkeszthető brief előnézet
- Email küldés PDF melléklettel

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Claude API (claude-opus-4-5-20251101)
- SendGrid
- @react-pdf/renderer

## Telepítés

```bash
npm install
```

## Környezeti változók

Másolja a `.env.example` fájlt `.env.local` néven és töltse ki:

```bash
ANTHROPIC_API_KEY=sk-ant-...
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=brief@roi.works
BRIEF_RECIPIENT_1=recipient1@roi.works
BRIEF_RECIPIENT_2=recipient2@roi.works
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Fejlesztés

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

A projekt Vercelre van optimalizálva:

```bash
vercel
```

## Használat

1. Nyissa meg a brief.roi.works oldalt
2. Töltse fel az elfogadott ajánlatot (PDF)
3. Válaszoljon az AI asszisztens kérdéseire
4. Ellenőrizze és szerkessze a generált briefet
5. Küldje el a briefet

## Arculat

A webapp a ROI Works arculati kézikönyv alapján készült:
- Elsődleges szín: #FF6400 (narancs)
- Másodlagos szín: #0022D2 (kék)
- Font: Archivo, Archivo SemiExpanded
```

**Step 2: Final build test**

```bash
npm run build
npm run start
```

Expected: Production build succeeds and runs

**Step 3: Final commit**

```bash
git add README.md
git commit -m "docs: add README with setup and usage instructions"
```

---

## Summary

**Total Tasks:** 14
**Estimated implementation time:** Variable

**Key files created:**
- `app/page.tsx` - Landing page
- `app/brief/page.tsx` - Chat page
- `app/api/chat/route.ts` - AI streaming API
- `app/api/send-brief/route.ts` - Email API
- `components/PdfUpload.tsx` - File upload
- `components/chat/*` - Chat UI
- `components/BriefEditor.tsx` - Brief editing
- `lib/prompts.ts` - AI prompts
- `lib/pdf-template.tsx` - PDF generation
- `lib/email-template.ts` - Email HTML
- `hooks/useChat.ts` - Chat state management
