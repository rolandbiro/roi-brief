---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/research/pipeline.ts
autonomous: true

must_haves:
  truths:
    - "A mediaplan csatorna büdzsék összege mindig pontosan egyezik a total_budget_huf értékkel"
    - "A normalizáció arányosan skálázza a büdzséket, nem veszít el és nem ad hozzá pénzt"
    - "A büdzsé-függő KPI-k (clicks, impressions, reach) a normalizált büdzsével konzisztensek"
  artifacts:
    - path: "lib/research/pipeline.ts"
      provides: "normalizeBudget() függvény + pipeline integráció"
      contains: "normalizeBudget"
  key_links:
    - from: "lib/research/pipeline.ts"
      to: "structureResults return"
      via: "normalizeBudget post-processing"
      pattern: "normalizeBudget"
---

<objective>
Fix: Az AI-generált mediaplan csatorna büdzsék (budget_allocation_huf) összege nem mindig egyezik a total_budget_huf értékkel. Determinisztikus normalizáció hozzáadása a pipeline-hoz, ami garantálja a büdzsé konzisztenciát.

Purpose: A PM-nek küldött mediaplan Excel-ben a számok mindig konzisztensek legyenek, a teljes büdzsé legyen felhasználva.
Output: Módosított pipeline.ts normalizeBudget() függvénnyel.
</objective>

<execution_context>
@/Users/biroroland/.claude/get-shit-done/workflows/execute-plan.md
@/Users/biroroland/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/research/pipeline.ts
@lib/research/types.ts
@lib/research/structure.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: normalizeBudget() implementáció és pipeline integráció</name>
  <files>lib/research/pipeline.ts</files>
  <action>
Adj hozzá egy `normalizeBudget(results: ResearchResults): ResearchResults` függvényt a `lib/research/pipeline.ts` fájlhoz, és hívd meg a `structureResults()` visszatérése után.

A függvény logikája:

1. Számold ki az aktuális összeget: `actualSum = sum(channels.map(c => c.budget_allocation_huf))`
2. Ha `actualSum === results.summary.total_budget_huf` (vagy a különbség < 1 Ft), térj vissza változtatás nélkül.
3. Ha eltérés van, logolj warning-ot: `[research] Budget normalization: ${actualSum} -> ${totalBudget} (diff: ${diff})`
4. Skálázd arányosan minden csatorna `budget_allocation_huf` értékét:
   - `scale = totalBudget / actualSum`
   - Minden csatornára: `newBudget = Math.round(ch.budget_allocation_huf * scale)`
   - Kerekítési maradékot add/vond ki az utolsó csatornához, hogy a végösszeg tökéletesen egyezzen
5. Számold újra `budget_allocation_pct` értékeket: `Math.round((newBudget / totalBudget) * 1000) / 10` (1 tizedesjegy)
6. Számold újra a büdzsé-függő KPI-ket minden csatornára (csak ha az adott KPI létezik):
   - **Traffic csatornák** (ahol `cpc` és `clicks` van):
     - `clicks.{min,likely,max} = Math.round(newBudget / cpc.{min,likely,max})` — vigyázz: min clicks = budget / max CPC, max clicks = budget / min CPC (fordított arány!)
     - `impressions.{min,likely,max} = Math.round(clicks.{min,likely,max} / (ctr.{min,likely,max} / 100))` — ha `ctr` létezik
   - **Reach csatornák** (ahol `cpm` és `reach` van, de `cpc` nincs):
     - `impressions.{min,likely,max} = Math.round((newBudget / cpm.{min,likely,max}) * 1000)` — min impressions = budget / max CPM * 1000, stb.
     - `reach.{min,likely,max} = Math.round(impressions.{min,likely,max} / frequency.{min,likely,max})` — ha `frequency` létezik
   - **Conversion** (ahol `cpa` van): `conversions.{min,likely,max} = Math.round(newBudget / cpa.{max,likely,min})` — fordított arány
7. Frissítsd a summary aggregált mezőket:
   - `total_clicks` = sum of channel clicks (ha van)
   - `total_impressions` = sum of channel impressions (ha van)
   - `total_reach` = sum of channel reach (ha van)
   - `total_conversions` = sum of channel conversions (ha van)
   - Aggregált KPI-k (overall_ctr, overall_cpc, overall_cpm): számold újra az aggregált értékekből

FONTOS:
- A `ResearchResults` típust importáld a `./types`-ból (már importálva van).
- A KpiEstimate min/likely/max mezőkre alkalmazd a fordított arányt ahol szükséges (alacsony cost = magas output).
- Ne mutálj, hanem hozz létre új objektumokat (spread operator).
- A pipeline-ban a hívás így nézzen ki:
  ```
  const results = await structureResults(rawResearch, briefData);
  const normalized = normalizeBudget(results);
  // log + return normalized
  ```

A `normalizeBudget` függvényt EXPORTÁLD, hogy tesztelhető legyen később.
  </action>
  <verify>
`npx tsc --noEmit` sikeres (nincs type hiba). Manuális ellenőrzés: a normalizeBudget függvény létezik és exportálva van, a pipeline meghívja.
  </verify>
  <done>
A pipeline minden structureResults() hívás után normalizálja a büdzsét. Ha a csatorna allokációk nem egyeznek a total_budget_huf-val, arányosan skálázza őket és újraszámolja a függő KPI-ket. Ha egyeznek, nem módosít semmit.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — nincs TypeScript hiba
2. A `normalizeBudget` exportálva van a `pipeline.ts`-ből
3. A függvény kezel: pontos egyezés (no-op), alulallokálás (scale up), túlallokálás (scale down)
4. Kerekítési maradék az utolsó csatornára kerül
</verification>

<success_criteria>
- A normalizeBudget() determinisztikusan garantálja, hogy sum(budget_allocation_huf) === total_budget_huf
- A KPI-k konzisztensek a normalizált büdzsével
- A meglévő pipeline működése nem törik el (ha a büdzsé eleve helyes, nincs változás)
</success_criteria>

<output>
After completion, create `.planning/quick/2-fix-mediaplan-k-lts-g-elt-r-s-total-cost/2-SUMMARY.md`
</output>
