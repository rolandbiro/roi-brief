# Roadmap: ROI Brief Assistant

## Milestones

- ✅ **v1.0 MVP** — Phases 1-3 (shipped 2026-02-10)
- 🚧 **v1.1 Enhanced Brief + AI Research** — Phases 4-6 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-3) — SHIPPED 2026-02-10</summary>

- [x] Phase 1: Type System & Foundation (3/3 plans) — completed 2026-02-10
- [x] Phase 2: Adaptive Questioning Engine (3/3 plans) — completed 2026-02-10
- [x] Phase 3: Dynamic Report & Branding (4/4 plans) — completed 2026-02-10

See: `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

### 🚧 v1.1 Enhanced Brief + AI Research (In Progress)

**Milestone Goal:** Az ügyfél-oldali adatgyűjtés bővítése az Agency Brief template összes üzleti mezőjével, jóváhagyás után AI háttérkutatás a technikai adatokhoz, és kitöltött xlsx fájlok küldése a PM-nek.

- [x] **Phase 4: Bővített adatgyűjtés és jóváhagyás** — Ügyfél oldali teljes flow: kibővített chat kikérdezés + jóváhagyási képernyő (completed 2026-02-12)
- [ ] **Phase 5: AI háttérkutatás** — Szerver oldali research pipeline: csatorna mix, targeting, KPI becslés
- [ ] **Phase 6: Xlsx generálás és PM delivery** — Kitöltött xlsx template-ek előállítása és emailben küldése a PM-nek

## Phase Details

### Phase 4: Bővített adatgyűjtés és jóváhagyás
**Goal**: Az ügyfél a chatben természetes beszélgetésben megadja az Agency Brief összes üzleti adatát, áttekinti az összegyűjtött információkat, és jóváhagyással elindítja a háttérfeldolgozást.
**Depends on**: Phase 3 (v1.0 complete)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, APPR-01, APPR-02, APPR-03, APPR-04
**Success Criteria** (what must be TRUE):
  1. Az AI természetes beszélgetésben, témakörönként csoportosítva gyűjti az Agency Brief összes üzleti mezőjét (cégnév, kontakt, büdzsé, célcsoport, stb.) — nem kérdez sorban 25 mezőt
  2. A kontakt adatokat (email, telefon) a konverzáció végén kéri az AI, nem az elején
  3. A BriefEditor megjeleníti az összes összegyűjtött adatot az Agency Brief struktúra szerint, és az ügyfél "Jóváhagyom" gombbal véglegesíti (email cím nélkül)
  4. Jóváhagyás után az ügyfél letöltheti a PDF-et és "Köszönjük" oldalt kap — a session véget ér számára
  5. A jóváhagyás triggereli a háttér AI kutatást (a szerver elkezdi a research pipeline-t)
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Séma bővítés + szekció centralizálás + tool/extraction frissítés
- [x] 04-02-PLAN.md — Prompt rendszer átírás (base + questioning + type modulok)
- [x] 04-03-PLAN.md — BriefEditor read-only jóváhagyás + approve API + köszönő oldal

### Phase 5: AI háttérkutatás
**Goal**: A szerver a jóváhagyott brief alapján háttérben AI kutatást futtat — csatorna mix javaslatot, targeting ajánlásokat és KPI becsléseket generál, strukturált formátumban az xlsx kitöltéshez.
**Depends on**: Phase 4
**Requirements**: RSCH-01, RSCH-02, RSCH-03, RSCH-04, RSCH-05, RSCH-06
**Success Criteria** (what must be TRUE):
  1. A jóváhagyás után a szerver háttérben futtatja az AI kutatást — az ügyfélnek nem kell várnia (fire-and-forget)
  2. Az AI web search-öt használva csatorna mix javaslatot generál (mely platformok, milyen kampánytípusok, büdzsé elosztás)
  3. Az AI platformonként targeting javaslatot ad magyar piacra lokalizálva (Google Affinity/In-market, Meta Interests, TikTok érdeklődési körök)
  4. Az AI KPI becsléseket generál a büdzsé és kampánycél alapján (megjelenés, kattintás, konverzió, CPM/CPC/CTR — tartományként, nem pontos számokkal)
  5. A kutatási eredmények strukturált formátumban (ResearchResults interface) állnak elő, amik közvetlenül mappelhetők az xlsx template mezőire
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Xlsx generálás és PM delivery
**Goal**: A rendszer programmatikusan kitölti az Agency Brief és Mediaplan xlsx template-eket, majd emailben elküldi a PM-nek — a teljes pipeline hiba esetén a PM értesítést kap.
**Depends on**: Phase 5
**Requirements**: XLSX-01, XLSX-02, XLSX-03, XLSX-04, DLVR-01, DLVR-02, DLVR-03
**Success Criteria** (what must be TRUE):
  1. Az Agency Brief xlsx template programmatikusan kitöltve tartalmazza az ügyfél által megadott adatokat (kontakt, kampány, célcsoport, stb.) — megőrizve az eredeti formázást
  2. A Mediaplan xlsx template tartalmazza az AI kutatás eredményeit: dinamikus PPC sorok a javasolt channel mix alapján (kampány cél, csatorna, hirdetés típus, metrikák, költségek)
  3. A PM emailben megkapja mindkét kitöltött xlsx-et csatolmányként, egy rövid összefoglalóval a brief-ről (ügyfél neve, kampány neve, büdzsé, időszak)
  4. Ha a háttérkutatás vagy xlsx generálás hibára fut, a PM hibaértesítést kap emailben — nem marad csendben
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 4 → 5 → 6

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Type System & Foundation | v1.0 | 3/3 | ✅ Complete | 2026-02-10 |
| 2. Adaptive Questioning Engine | v1.0 | 3/3 | ✅ Complete | 2026-02-10 |
| 3. Dynamic Report & Branding | v1.0 | 4/4 | ✅ Complete | 2026-02-10 |
| 4. Bővített adatgyűjtés és jóváhagyás | v1.1 | 3/3 | ✅ Complete | 2026-02-12 |
| 5. AI háttérkutatás | v1.1 | 0/2 | Not started | - |
| 6. Xlsx generálás és PM delivery | v1.1 | 0/2 | Not started | - |
