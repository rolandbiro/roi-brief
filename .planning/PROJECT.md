# ROI Brief Assistant

## What This Is

A ROI Works marketing ügynökség AI brief asszisztense, ahol egy chatbot kampánytípus-specifikus kérdésekkel kérdezi ki az érdeklődőt. Az érdeklődő direkt linkről érkezik, az AI adaptívan kérdez (médiavásárlás, performance, brand, social), és az Agency Brief összes üzleti mezőjét gyűjti természetes beszélgetésben. Jóváhagyás után a szerver háttérben AI kutatást futtat (csatorna mix, targeting, KPI becslés), kitölti az xlsx template-eket, és emailben elküldi a PM-nek.

## Core Value

Az AI asszisztens kampánytípustól függően releváns, szakmai mélységű kérdéseket tesz fel — adaptív kikérdezés, ami profi brieffé áll össze, majd háttérkutatással kiegészített mediaplan-t generál a PM-nek.

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
- ✓ Bővített adatgyűjtés: Agency Brief ~25 üzleti mező természetes beszélgetésben — v1.1
- ✓ Szekció-alapú adaptív kikérdezés (8 témakör, nem sorban 25 mező) — v1.1
- ✓ Kontakt adatok a konverzáció végén — v1.1
- ✓ Prompt átfedés-kezelés (típusspecifikus vs Agency Brief mezők) — v1.1
- ✓ Jóváhagyási flow: BriefEditor read-only + Jóváhagyom gomb (email nélkül) — v1.1
- ✓ Jóváhagyás utáni köszönő oldal + PDF letöltés — v1.1
- ✓ Jóváhagyás triggereli a háttér AI kutatást (fire-and-forget) — v1.1
- ✓ AI háttérkutatás: web search + structured output pipeline — v1.1
- ✓ Csatorna mix javaslat (platformok, kampánytípusok, büdzsé elosztás) — v1.1
- ✓ Targeting javaslat platformonként (magyar piacra lokalizálva) — v1.1
- ✓ KPI becslések (megjelenés, kattintás, CPM/CPC/CTR tartományok) — v1.1
- ✓ ResearchResults strukturált formátum xlsx mapping-hez — v1.1
- ✓ Agency Brief xlsx template programmatikus kitöltés — v1.1
- ✓ Mediaplan xlsx template kitöltés AI kutatás eredményeivel — v1.1
- ✓ Xlsx formázás megőrzése (eredeti template stílusok) — v1.1
- ✓ Dinamikus Mediaplan sorok a channel mix alapján — v1.1
- ✓ PM email küldés xlsx melléklettel — v1.1
- ✓ Email összefoglaló (ügyfél, kampány, büdzsé, időszak) — v1.1
- ✓ Hiba esetén PM értesítés emailben + retry link — v1.1

### Active

(Nincs — következő milestone-hoz `/gsd:new-milestone` szükséges)

### Out of Scope

- PDF feltöltés / ajánlat elemzés — v2 ajánlatadás előtti, nem utáni
- Felhasználói fiók / bejelentkezés — anonim session marad, konverziót rontaná
- Conversation history / draft mentés — későbbi iteráció
- Multi-language támogatás — csak magyar piac
- Beágyazás (iframe/widget) — direkt link marad
- Database / persistent storage — session-based marad
- Design brief / website brief — más domain, más kérdéskészlet
- Élő platform API-k (Google Ads, Meta) — az AI web search-ből dolgozik

## Context

**Shipped v1.1 Enhanced Brief + AI Research** (2026-02-12):
- 4,250 LOC TypeScript
- Tech stack: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Claude API (@anthropic-ai/sdk), Zod, SendGrid, @react-pdf/renderer, ExcelJS
- 6 fázis, 17 plan, 46 requirement (24 v1.0 + 22 v1.1) — mind teljesítve
- Teljes pipeline: Chat → Jóváhagyás → AI kutatás → Xlsx generálás → PM email

**Known tech debt (alacsony prioritás):**
- Section definíciók duplikálva 3 fájlban (brief-sections.ts, pdf-template.tsx, email-template.ts)
- ExcelJS `as any` Buffer type cast (Node.js 22 inkompatibilitás)

**Potential next directions (v2 REQUIREMENTS-ből):**
- UX: Progress indikátor, quality scoring, auto-save/draft recovery
- Analytics: Completion rate, drop-off monitoring, típus statisztikák
- Advanced: Config-based új típusok, xlsx template variáns kiválasztás, AI kutatás validáció

## Constraints

- **Tech stack**: Next.js + Claude API + SendGrid + @react-pdf/renderer + ExcelJS
- **Arculat**: ROI Works brand guidelines (narancs/kék/szürke, Archivo)
- **Nyelv**: Magyar nyelvű UI és AI kommunikáció, tegező stílus
- **Anonim**: Nincs auth, nincs persistent storage — session-based
- **Kompatibilitás**: Email küldés, PDF generálás, xlsx template kitöltés megmarad
- **Xlsx template**: Az output xlsx fájloknak az elvárt ROI Works template struktúrát kell követniük (docs/ROI_Mediaplan/)

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
| DATA+APPR kombinálva Phase 4-be | Kliensoldali, research előtti munka logikusan összetartozik | ✓ Good — hatékony fázis bontás |
| XLSX+DLVR kombinálva Phase 6-ba | Szerveroldali output pipeline egyben kezelendő | ✓ Good — egyetlen delivery fázis |
| Web search + structured output két API hívás | Citations inkompatibilis output_config-gal | ✓ Good — megkerüli az API limitációt |
| pause_turn loop a search step-ben | Az API megszakíthatja, a loop folytatja | ✓ Good — robusztus web search kezelés |
| base64url retry token = briefData JSON | Serverless-compatible, no state | ✓ Good — állapotmentes retry |
| Plain text email (no HTML) | Simple, reliable PM értesítés | ✓ Good — KISS |
| ExcelJS template fill pattern | Read, modify cells, writeBuffer — megőrzi formázást | ✓ Good — template stílusok megmaradnak |
| Granular 5-step pipeline error handling | Minden lépés önállóan katch-el, részleges eredmény is küldődik | ✓ Good — PM mindig kap értesítést |

---
*Last updated: 2026-02-12 after v1.1 milestone completion*
