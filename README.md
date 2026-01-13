# ROI Works Brief

AI-támogatott kampány brief gyűjtő rendszer a ROI Works marketing ügynökség számára.

## Funkciók

- 📄 **PDF feltöltés** - Elfogadott ajánlat feltöltése
- 🤖 **AI asszisztens** - Claude-alapú chatbot a brief adatok összegyűjtéséhez
- ✏️ **Brief szerkesztés** - Összegyűjtött adatok ellenőrzése és módosítása
- 📧 **Email küldés** - Brief elküldése PDF melléklettel az ügyfélnek és az ügynökségnek

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4
- **AI**: Claude API (Anthropic)
- **Email**: SendGrid
- **PDF**: @react-pdf/renderer
- **Nyelv**: TypeScript

## Telepítés

```bash
# Klónozás
git clone https://github.com/rolandbiro/roi-brief.git
cd roi-brief

# Függőségek telepítése
npm install

# Környezeti változók beállítása
cp .env.example .env.local
# Szerkeszd a .env.local fájlt a megfelelő értékekkel
```

## Környezeti változók

| Változó | Leírás |
|---------|--------|
| `ANTHROPIC_API_KEY` | Claude API kulcs |
| `SENDGRID_API_KEY` | SendGrid API kulcs |
| `SENDGRID_FROM_EMAIL` | Küldő email cím |
| `BRIEF_RECIPIENT_1` | Első címzett (pl. ügynökség) |
| `BRIEF_RECIPIENT_2` | Második címzett (opcionális) |
| `NEXT_PUBLIC_APP_URL` | Alkalmazás URL |

## Fejlesztés

```bash
# Fejlesztői szerver indítása
npm run dev

# Build
npm run build

# Production mód
npm run start

# Linting
npm run lint
```

## Használat

1. Töltsd fel az elfogadott ajánlatot PDF formátumban
2. Válaszolj az AI asszisztens kérdéseire
3. Ellenőrizd és szükség esetén módosítsd az összegyűjtött adatokat
4. Küldd el a kész briefet

## Projekt struktúra

```
roi-brief/
├── app/
│   ├── api/
│   │   ├── chat/          # Claude API route
│   │   └── send-brief/    # SendGrid API route
│   ├── brief/             # Brief chat oldal
│   └── page.tsx           # Landing page
├── components/
│   ├── chat/              # Chat komponensek
│   ├── BriefEditor.tsx    # Brief szerkesztő
│   ├── Header.tsx         # Fejléc
│   ├── Logo.tsx           # ROI Works logo
│   └── PdfUpload.tsx      # PDF feltöltés
├── hooks/
│   └── useChat.ts         # Chat state management
├── lib/
│   ├── email-template.ts  # HTML email template
│   ├── pdf-template.tsx   # PDF generálás
│   ├── prompts.ts         # AI system prompt
│   └── utils.ts           # Utility functions
└── types/
    └── chat.ts            # TypeScript típusok
```

## Licensz

Privát - ROI Works belső használatra.
