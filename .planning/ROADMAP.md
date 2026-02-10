# Roadmap: ROI Brief Assistant v2

## Overview

A jelenlegi fix 13-kérdésű brief rendszert kampánytípus-adaptív, AI-vezérelt kikérdezésre alakítjuk át. A projekt három fázisban halad: először lefektetjük a típusrendszert és technikai alapokat (Zod séma, SDK upgrade, entry flow), aztán építjük rá az adaptív kérdezőmotort (típusdetektálás, moduláris prompt, tool use), végül a dinamikus riportrendszert és arculatot (PDF, email, BriefEditor).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Type System & Foundation** - Zod sémák, SDK upgrade, entry flow átalakítás ✓ (2026-02-10)
- [x] **Phase 2: Adaptive Questioning Engine** - Típusdetektálás, moduláris prompt, tool use alapú adatgyűjtés ✓ (2026-02-10)
- [ ] **Phase 3: Dynamic Report & Branding** - Dinamikus riport szekciók, BriefEditor, PDF letöltés, arculat

## Phase Details

### Phase 1: Type System & Foundation
**Goal**: A rendszer ismeri a 4 kampánytípust, Zod sémákból építkezik, és az érdeklődő direkt linkről egyből chatbe érkezik (PDF upload nincsen)
**Depends on**: Nothing (first phase)
**Requirements**: TECH-01, TECH-02, TECH-03, TECH-04, TECH-05, FLOW-01, FLOW-02, FLOW-03
**Success Criteria** (what must be TRUE):
  1. Érdeklődő direkt linkről érkezik és egyből chat felületet lát (nincs PDF feltöltés opció)
  2. BriefData típust Zod séma definiálja base + típusspecifikus kiterjesztésekkel (4 típus)
  3. Claude API hívás structured output-ot ad vissza (nem BRIEF_JSON_START/END regex)
  4. Kampánytípusonként külön prompt modul létezik amit a rendszer dinamikusan állít össze
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md -- Zod sémák + moduláris prompt rendszer (Wave 1)
- [x] 01-02-PLAN.md -- SDK upgrade + API route + useChat refactor (Wave 2)
- [x] 01-03-PLAN.md -- Entry flow átalakítás + PDF eltávolítás (Wave 3)

### Phase 2: Adaptive Questioning Engine
**Goal**: Az AI felismeri a kampánytípust, megerősítteti, és típusspecifikus, adaptív kérdéseket tesz fel amik során strukturáltan gyűlik az adat
**Depends on**: Phase 1
**Requirements**: TYPE-01, TYPE-02, TYPE-03, TYPE-04, QUES-01, QUES-02, QUES-03, QUES-04, QUES-05
**Success Criteria** (what must be TRUE):
  1. AI az első 2-3 válaszból felismeri a kampánytípust és megerősíttetést kér az érdeklődőtől
  2. Multi-típus brief esetén az AI mindkét típus kérdéseit felteszi egyetlen beszélgetésben
  3. AI először a stratégiai nagy képet érti meg, utána kér részleteket (nem fix sorrend)
  4. AI visszakérdez ha vékony a válasz, és átugorja amit már megtudott
  5. Quick-reply gombok megjelennek a chat-ben a kérdéstípustól függően
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md -- Multi-típus séma + tool definíciók + tegező prompt rendszer (Wave 1)
- [x] 02-02-PLAN.md -- Chat API agentic loop + useChat briefState management (Wave 2)
- [x] 02-03-PLAN.md -- Quick-reply UI + adaptív flow checkpoint (Wave 3)

### Phase 3: Dynamic Report & Branding
**Goal**: A brief riport dinamikusan alkalmazkodik a kampánytípus(ok)hoz, ROI Works arculatban jelenik meg, és az érdeklődő le tudja tölteni PDF-ben
**Depends on**: Phase 2
**Requirements**: REPT-01, REPT-02, REPT-03, REPT-04, REPT-05, BRND-01, BRND-02
**Success Criteria** (what must be TRUE):
  1. Riportban csak a kampánytípusnak megfelelő szekciók jelennek meg (nincs üres/irreleváns szekció)
  2. Multi-típus brief esetén minden típusnak külön szekciója van a riportban
  3. BriefEditor dinamikusan megjeleníti a típusspecifikus mezőket (szerkeszthető)
  4. Érdeklődő egyetlen gombbal letöltheti a brief-et PDF-ben
  5. PDF és email riport ROI Works arculatban jelenik meg (narancs/kék színek, Archivo betűtípus)
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md -- Dinamikus szekció helper + read-only BriefEditor + brief page flow (Wave 1)
- [ ] 03-02-PLAN.md -- PDF template + Archivo font + ROI Works arculat + PDF logó (Wave 1)
- [ ] 03-03-PLAN.md -- PDF letöltés endpoint + send-brief + email template átírás (Wave 2)
- [ ] 03-04-PLAN.md -- Vizuális és funkcionális ellenőrzés checkpoint (Wave 3)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Type System & Foundation | 3/3 | ✓ Complete | 2026-02-10 |
| 2. Adaptive Questioning Engine | 3/3 | ✓ Complete | 2026-02-10 |
| 3. Dynamic Report & Branding | 0/4 | Not started | - |
