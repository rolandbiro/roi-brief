# ROI Brief Assistant

## What This Is

A ROI Works marketing ügynökség AI brief asszisztense, ahol egy chatbot kampánytípus-specifikus kérdésekkel kérdezi ki az érdeklődőt. Az érdeklődő direkt linkről érkezik, az AI adaptívan kérdez (médiavásárlás, performance, brand, social), és a végén dinamikus riport generálódik ROI Works arculatban — PDF letöltéssel és email küldéssel.

## Core Value

Az AI asszisztens kampánytípustól függően releváns, szakmai mélységű kérdéseket tesz fel — nem sablonos, hanem adaptív kikérdezést végez, ami profi brieffé áll össze.

## Requirements

### Validated

- ✓ Chat alapú AI kikérdezés Claude API-val — existing
- ✓ Streaming válaszok — existing
- ✓ Magyar nyelvű UI és kommunikáció — existing
- ✓ Vercel deployment — existing
- ✓ Kampánytípus-specifikus kikérdezés (4 típus: médiavásárlás, performance, brand, social) — v1.0
- ✓ Multi-típus támogatás (egy brief több kampánytípust fedhet le) — v1.0
- ✓ Adaptív kérdezési logika (mélyít ha vékony, átugorja ha már kiderült) — v1.0
- ✓ Szakmai mélységű kérdések típusonként (GRP, ROAS, reach, stb.) — v1.0
- ✓ PDF feltöltés eltávolítva — direkt link, chat-only belépés — v1.0
- ✓ Dinamikus riport szekciók (csak releváns szekciók a típusnak megfelelően) — v1.0
- ✓ Flexibilis BriefData struktúra (Zod séma, típusfüggő mezők) — v1.0
- ✓ ROI Works arculat a riporton (narancs/kék, Archivo font) — v1.0
- ✓ PDF letöltés funkció az érdeklődőnek — v1.0
- ✓ Email küldés a ROI Works csapatnak — v1.0
- ✓ BriefEditor read-only áttekintés — v1.0
- ✓ Quick-reply gombok a chatben — v1.0
- ✓ Agentic tool use (classify_campaign, update_brief, complete_brief) — v1.0
- ✓ Moduláris prompt rendszer (base + típusonkénti modulok) — v1.0

### Active

(Nincs — következő milestone-ban definiálandó)

### Out of Scope

- PDF feltöltés / ajánlat elemzés — v2 ajánlatadás előtti, nem utáni
- Felhasználói fiók / bejelentkezés — anonim session marad, konverziót rontaná
- Conversation history / draft mentés — későbbi iteráció
- Multi-language támogatás — csak magyar piac
- Beágyazás (iframe/widget) — direkt link marad
- Database / persistent storage — session-based marad
- Design brief / website brief — más domain, más kérdéskészlet

## Context

**Shipped v1.0 MVP** (2026-02-10):
- 3,323 LOC TypeScript (44 fájl)
- Tech stack: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Claude API (@anthropic-ai/sdk 0.74.0), Zod 4.3.6, SendGrid, @react-pdf/renderer
- 3 fázis, 10 plan, 24 requirement — mind teljesítve
- Agentic tool use pattern (4 tool: classify_campaign, update_brief, suggest_quick_replies, complete_brief)
- SSE streaming + briefState round-trip az ügyfél és szerver között

**Known tech debt (alacsony prioritás):**
- Section definíciók duplikálva 3 fájlban (brief-sections.ts, pdf-template.tsx, email-template.ts)
- PDF section címek kozmetikailag eltérnek a BriefEditor/Email címektől

**Potential next directions (v2 REQUIREMENTS-ből):**
- UX: Progress indikátor, quality scoring, auto-save/draft recovery
- Analytics: Completion rate, drop-off monitoring, típus statisztikák
- Advanced: Conversation summarization, enrichment notes, config-based új típusok

## Constraints

- **Tech stack**: Next.js + Claude API + SendGrid + @react-pdf/renderer
- **Arculat**: ROI Works brand guidelines (narancs/kék/szürke, Archivo)
- **Nyelv**: Magyar nyelvű UI és AI kommunikáció, tegező stílus
- **Anonim**: Nincs auth, nincs persistent storage — session-based
- **Kompatibilitás**: Email küldés és PDF generálás megmarad

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PDF feltöltés eltávolítása | Ajánlatadás előtti flow, nincs mit feltölteni | ✓ Good — egyszerűbb UX, kevesebb kód |
| Prompt alapú típusdetekció | AI az első pár kérdésből következtet típust, megerősítteti | ✓ Good — rugalmas, multi-típus is működik |
| Flat multi-type schema (campaign_types tömb) | discriminatedUnion nem kezeli a multi-típust | ✓ Good — egyszerűbb séma, additív merge |
| Tool use pattern (classify, update, complete) | Regex törékeny, structured output nem elég rugalmas | ✓ Good — robusztus adatgyűjtés, explicit lifecycle |
| briefState round-trip via client | KISS, nincs server session storage | ✓ Good — egyszerű, stateless szerver |
| BriefEditor read-only (nem szerkeszthető) | Egyszerűbb UX, kevesebb hibalehetőség | ✓ Good — az AI kérdez, nem az érdeklődő szerkeszt |
| Section definíciók duplikálva (PDF/Email/Editor) | Render target-ek eltérőek (React-PDF View vs HTML string) | ⚠️ Revisit — központosítás lehetséges későbbi iterációban |
| Agentic loop MAX_ITERATIONS=25 | 10 túl kevés volt multi-tool turn-ökhöz | ✓ Good — elég hely az AI-nak, infinite loop védelem |
| complete_brief tool explicit signal | Heurisztika helyett az AI jelzi a brief végét | ✓ Good — megbízhatóbb, mint automatikus detekció |
| Extraction: briefState assembly (nem Claude API) | messages.parse() broken volt v0.74.0-ban | ✓ Good — gyorsabb, megbízhatóbb, olcsóbb |

---
*Last updated: 2026-02-10 after v1.0 milestone*
