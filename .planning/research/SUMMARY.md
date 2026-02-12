# Project Research Summary

**Project:** ROI Brief v1.1 - Bővített adatgyűjtés, AI kutatás, XLSX generálás
**Domain:** Marketing ügynökségi brief asszisztens - conversational AI workflow kiterjesztése strukturált dokumentumgenerálással
**Researched:** 2026-02-12
**Confidence:** HIGH

## Executive Summary

A ROI Brief v1.1 egy marketing brief asszisztens kiterjesztése, amely háromféle új képességet integrál a meglévő Next.js chat rendszerbe: bővített adatgyűjtés (25+ mező az Agency Brief template-hez), AI-alapú háttérkutatás (csatorna-allokáció, KPI becslés, targeting javaslatok) és XLSX generálás meglévő sablonokból. A legnagyobb technikai kihívás az architektúra átmenet: a v1.0 teljesen stateless volt, a v1.1 viszont megköveteli a server-side persistence-t (Vercel KV) a háttérfeldolgozáshoz. Ez alapvető változást jelent a data flow-ban.

Az ajánlott megközelítés: minimális új függőségek (csak ExcelJS), a meglévő Anthropic SDK `web_search_20250305` tool használata (nincs külső keresőmotor API), és a Next.js 16 `after()` függvény alkalmazása háttérfeldolgozásra. A kritikus időzítési döntés: az ügyfél jóváhagyja a brief-et, letölti a PDF-et, és azonnal kap egy "Köszönjük" oldalt - ekkor a session VÉGET ÉR számára. Ezután a szerver háttérben futtatja az AI kutatást, generálja az XLSX-eket és emailezi őket a PM-nek. Ez az aszinkron handoff pattern szükségessé teszi a Vercel KV bevezetését a research state tárolására.

A legkritikusabb kockázatok: AI hallucináció marketing adatokban (CPM ráták, KPI becslések), Vercel function timeout-ok az AI kutatásnál, és a 4.5 MB response body limit az XLSX/PDF output-nál. Mitigáció: Anthropic Citations használata, Fluid Compute engedélyezése (300s default timeout), Vercel Blob köztes tárolás nagy fájlokhoz, és explicit disclaimer az AI-generált adatokra.

## Key Findings

### Recommended Stack

A kutatás egyetlen új függőséget azonosított kritikusnak: **ExcelJS** (~1.08 MB, buffer-alapú XLSX generálás). Az összes többi új képesség a meglévő stack kiterjesztése - az Anthropic SDK már tartalmazza a `web_search_20250305` tool-t, a SendGrid már kezeli a csatolmányokat (PDF-hez használt pattern azonnal adaptálható XLSX-re). Ez KISS elv: ne adj hozzá amit nem kell.

**Core technologies:**
- **ExcelJS (^4.4.0)**: XLSX template betöltés és cellakitöltés — buffer-alapú I/O serverless környezethez, megőrzi a formázást és stílusokat. A SheetJS Community Edition-nel ellentétben nem veszít el stílusokat, és az xlsx-populate-tal szemben aktívan karbantartott.
- **Anthropic Web Search Tool (web_search_20250305)**: AI kutatási pipeline — beépített server-side tool, nincs külön dependency. $10/1000 keresés + token költség. Localizálható (HU), citation-ökkel validálható.
- **@sendgrid/mail (meglévő)**: XLSX csatolmányok — a PDF pattern 1:1 átültethető, csak MIME type változik (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).
- **Vercel KV (új infrastruktúra)**: Session state tárolás — a háttérfeldolgozáshoz szükséges persistence. TTL-lal (24h) automatikus cleanup.
- **Next.js after() (meglévő, v16.1.1)**: Háttérfeldolgozás — stable API a válasz elküldése után futó task-okra, `waitUntil()` wrapper serverless-ben.

**Vercel infrastruktúra követelmények:**
- Fluid Compute (default 300s, max 800s) — kritikus a timeout elkerülésére
- Vercel Blob — 4.5 MB response limit megkerülése nagy XLSX-eknél
- Vercel KV (Redis) — research state persistence session-ök között

### Expected Features

A feature kutatás 5 capability-t azonosított, szigorúan függőségi sorrendben.

**Must have (table stakes):**
- **Bővített adatgyűjtés** - 25+ mező az Agency Brief template-hez (kontakt adatok, kampány kreatívok, checkbox mezők: csatornák/KPI-k/nemek). A prompt természetes konverzációban gyűjt, NEM form-szerűen.
- **Jóváhagyási flow** - BriefEditor átalakítás: read-only áttekintés + explicit "Jóváhagyom" gomb. Email cím NEM szükséges (kikerül). PDF letöltés mindig elérhető, de az email csak a PM-nek megy.
- **AI háttérkutatás** - Claude + web_search tool: csatorna-allokáció (büdzsé elosztás), KPI becslés (CPM/CPC/CTR iparági benchmark-okkal), targeting javaslatok (platform-specifikus érdeklődési körök), versenytárs-elemzés. **Structured output**: ResearchResults interface, nem szabadszöveges válasz.
- **Agency Brief XLSX kitöltés** - Template betöltés ExcelJS-sel, ügyfél adatokkal kitöltés (fix cell pozíciók), checkbox-ok TRUE/FALSE értékek, formázás megőrzés.
- **Mediaplan XLSX kitöltés** - Template betöltés, fejléc kitöltés (partner adatok, kampány név, időszak, keretösszeg), dinamikus PPC sorok generálása az AI kutatás alapján (kampány cél, típus, csatorna, hirdetés típus, metrikák, költségek).
- **PM email XLSX csatolmányokkal** - SendGrid meglévő pattern kiterjesztése két XLSX attachment-tel (Agency Brief + Mediaplan), research summary HTML email body-ban.

**Should have (competitive):**
- **Intelligens összevonás**: Ha a type-specific fázis már kikérdezte a csatornát, ne kérdezze újra az Agency Brief szekcióban. Prompt-szintű deduplikáció.
- **Smart defaults**: Ha az ügyfél elmondta hogy "webshop" - a "Cég tevékenységi köre" mező automatikusan kitölthető az AI által implicit.
- **Iparág-specifikus benchmarkok**: Ne generikus CPM-et becsüljön, hanem az ügyfél iparágához igazított értékeket (e-commerce vs B2B SaaS nagyon más).
- **Magyar piaci árszintek**: Az AI magyar piaci benchmark-okat alkalmazzon (HUF), ne USA CPM-eket.

**Defer (v2+):**
- **eDM szekció a Mediaplan-ban**: Nem minden kampányhoz releváns, a PPC szekció a fő prioritás.
- **Egyéb média / Gyártás szekciók**: A PM ezeket manuálisan tölti ki.
- **Versenytárs-elemzés részletes szekció**: A kutatás első verzióban rövid megjegyzésként belefoglalható a targeting javaslatokba.

### Architecture Approach

A v1.1 az existing stateless chat architektúrát (useChat hook -> SSE streaming -> briefState round-trip) két új komponenssel bővíti: approval flow (új API endpoint + háttérfeldolgozás) és research pipeline (külön LLM hívás, nem a chat flow része). A kritikus design decision: **a research NEM a chat SSE stream-ben fut**. Külön `/api/approve-brief` route, saját `maxDuration` budget-tel, és a válasz azonnal visszamegy a kliensnek ("Köszönjük"). Az AI kutatás a `after()` callback-ben fut, eredménye Vercel KV-ba kerül, és onnan generálódik az XLSX + PM email. Ez szétválasztja a felhasználói UX-et (gyors) a háttérmunkától (lassú).

**Major components:**
1. **Extended Chat Pipeline (modified)** - A meglévő `/api/chat` route bővített tool definíciókkal (`update_brief` kap új mezőket), de agentic loop azonos. A prompt bővítés a kulcs: a questioning modulok kiegészülnek az új business mezőkkel.
2. **Approval Flow (new)** - `/api/approve-brief` route kapja a jóváhagyott briefData-t, azonnali success response-szal válaszol, és `after()` callback-ben indítja a research pipeline-t. BriefEditor átalakítás: email input eltávolítása, PDF letöltés top-level action, "Jóváhagyom" gomb replace "Jóváhagyás és küldés".
3. **Research Pipeline (new)** - `lib/research/pipeline.ts` orchestrálja a Claude + web_search tool hívást, nem streamed a kliensnek. A `pause_turn` stop reason kezelése (multi-turn). Output: ResearchResults interface (structured data, nem szabadszöveg). Session-höz kötött state (Vercel KV), TTL 24h.
4. **XLSX Generator (new)** - `lib/xlsx/generate.ts` két fájlt generál template-ekből: Agency Brief (ügyfél adatok) + Mediaplan (AI kutatás adatok). ExcelJS `readFile()` -> cell manipulation -> `writeBuffer()`. Cell mapping config (manual analysis a template struktúrához).
5. **PM Email Sender (new)** - `lib/research/send-results.ts` SendGrid-el két XLSX-et csatol, HTML summary email body. Meglévő pattern kiterjesztése (base64 encoding, MIME type különbség: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

**Data flow kritikus szakaszok:**
- **Phase 1 (chat)**: Stateless marad, briefState round-trip SSE-n keresztül
- **Phase 2 (approval)**: briefData átadás KV-ba session ID-val
- **Phase 3 (research)**: Server-only, briefData KV-ból olvasás, ResearchResults KV-ba írás
- **Phase 4 (xlsx)**: Buffer generálás memóriában (nem fájlrendszer)
- **Phase 5 (email)**: SendGrid csatolmány base64 encoding, vagy Vercel Blob link ha > 3.5 MB

### Critical Pitfalls

1. **Vercel function timeout az AI research pipeline-ban** - Az AI kutatás (5-10 web search + szintézis) 60-120 másodpercig tarthat. Hobby plan default 10s timeout instant fail. **Megelőzés**: Fluid Compute engedélyezése (300s default), `maxDuration = 300` az approve route-on, research és chat szétválasztása, `max_uses: 5-8` a web search tool-on.

2. **Stateless architektúra + háttérfeldolgozás = adat-vesztés** - A v1.0 briefState csak a kliens memóriájában él. Ha az ügyfél bezárja a tabot az approve után, a research output elvész (nincs hová írni). **Megelőzés**: Vercel KV bevezetése session state tárolásra, session ID generálás (UUID), TTL 24h, polling endpoint a research státuszhoz (`GET /api/research/[sessionId]/status`).

3. **Vercel 4.5 MB response body limit** - Egy részletes XLSX (sok sheet, formázás) + PDF base64 kódolva (33% overhead) könnyen túllépi a limitet. **Megelőzés**: Vercel Blob köztes tárolás, csak URL visszaadása a kliensnek. SendGrid emailben: ha attachment > 3.5 MB, link használata inline attachment helyett.

4. **AI hallucináció marketing adatokban** - A Claude CPM rátákat, KPI-kat generál, ami kontextus-függő. "Hihető de hamis" számok reputációs és jogi kockázatot jelentenek. **Megelőzés**: Citations használata (web_search tool automatikusan forrást ad), számadatot CSAK citálható forrásból kiírni, tartomány (range) használata egyetlen szám helyett ("2-6 EUR" nem "3.4 EUR"), `allowed_domains` filtering megbízható forrásokra, explicit disclaimer az output-ban ("Az AI-alapú kutatás tájékoztató jellegű").

5. **SheetJS npm vulnerability és telepítési bonyodalom** - Az npm registry `xlsx` csomagjának 0.18.5 verziója CVE-2023-30533 (Prototype Pollution) sebezhetőséget tartalmaz, a SheetJS csapat nem publikál npm-re. **Megelőzés**: ExcelJS használata SheetJS helyett - aktívan karbantartott, buffer-alapú, serverless-kompatibilis.

## Implications for Roadmap

A research alapján az építési sorrend szigorúan dependency-driven. Párhuzamosítási lehetőség minimális - a capability-k lineárisan függenek egymástól.

### Phase 1: Bővített séma és adatgyűjtés
**Rationale:** Az összes többi phase az Agency Brief mezőire épít. A prompt és séma bővítés KELL HOGY előzze meg a jóváhagyási flow-t és a research-öt, mert azok inputja a kiterjesztett briefData.

**Delivers:**
- Zod séma kiegészítése 25+ mezővel (kontakt adatok, kampány részletek, checkbox mezők)
- Prompt bővítés természetes kérdezési flow-val (NEM form-jellegű)
- `update_brief` tool field descriptions kiterjesztése
- `brief-sections.ts` új field definition-ök
- PDF és email template-ek bővítése az új mezőkre

**Addresses:**
- Bővített strukturált adatgyűjtés (FEATURES.md table stakes)
- Intelligens összevonás meglévő és új mezők között (FEATURES.md differentiator)

**Avoids:**
- Hosszú form-jellegű kikérdezés (FEATURES.md anti-feature) - a prompt csoportosítva, konverzációsan kérdez

**Research flag:** SKIP - standard Zod + prompt extension pattern, jól dokumentált

### Phase 2: Jóváhagyási flow és approval endpoint
**Rationale:** A jóváhagyási flow a trigger az AI kutatáshoz. Az `/api/approve-brief` endpoint létrehozása szükséges MIELŐTT a research pipeline megépül, mert ő indítja a háttérfolyamatot.

**Delivers:**
- BriefEditor átalakítás (email input eltávolítás, "Jóváhagyom" gomb, PDF letöltés mindig elérhető)
- `/api/approve-brief` route (stub verzió: azonnali success, background placeholder)
- "Köszönjük" záró képernyő
- Session ID generálás (UUID) a kliensen
- Vercel KV setup (infrastructure)

**Addresses:**
- Ügyfél jóváhagyási flow (FEATURES.md table stakes)
- Email cím eltávolítása a flow-ból (FEATURES.md table stakes)
- "Köszönjük" záró képernyő (FEATURES.md differentiator)

**Avoids:**
- Ügyfél bevárása az AI kutatásra (FEATURES.md anti-feature) - fire-and-forget pattern
- Szerkeszthető jóváhagyó form (FEATURES.md anti-feature) - read-only + vissza a chatbe

**Research flag:** SKIP - Next.js API route + React state machine, standard pattern

### Phase 3: AI háttérkutatás és research pipeline
**Rationale:** Az approve endpoint trigger-e után építhető a research logika. A Phase 3 a legsarkalatosabb technikai kihívás: web search tool integráció, structured output parsing, hallucination mitigálás.

**Delivers:**
- `lib/research/pipeline.ts` - Claude + web_search_20250305 tool orchestration
- `lib/research/prompts.ts` - research system prompt (channel mix, KPI becslés, targeting, versenytárs-elemzés)
- `lib/research/types.ts` - ResearchResults interface (structured schema)
- `pause_turn` stop reason kezelés multi-turn-ben
- `after()` integráció az approve route-ban (background execution)
- Vercel KV írás/olvasás (session-based research state)
- Polling endpoint (`GET /api/research/[sessionId]/status`)

**Uses:**
- Anthropic SDK web_search_20250305 tool (STACK.md)
- Vercel KV session state tárolás (STACK.md)
- Next.js after() background execution (STACK.md)

**Implements:**
- Research Pipeline (ARCHITECTURE.md component)
- ResearchResults structured output (ARCHITECTURE.md data flow)

**Addresses:**
- AI háttérkutatás (FEATURES.md table stakes)
- Csatorna mix javaslat (FEATURES.md table stakes)
- KPI becslés csatornánként (FEATURES.md table stakes)
- Targeting javaslatok (FEATURES.md table stakes)
- Iparág-specifikus benchmark-ok (FEATURES.md differentiator)
- Magyar piaci árszintek (FEATURES.md differentiator)

**Avoids:**
- Élő platform API hívások (FEATURES.md anti-feature) - az AI tudásából becsül
- Automatikus bid/budget optimalizáció (FEATURES.md anti-feature) - tervezés, nem futtatás
- Pontos ROI garancia (FEATURES.md anti-feature) - explicit disclaimer

**Critical pitfall mitigations:**
- CRIT-1 (timeout): Fluid Compute, maxDuration=300, max_uses=5-8
- CRIT-2 (adat-vesztés): Vercel KV + session ID + polling
- CRIT-4 (hallucináció): Citations, range-ek, allowed_domains, disclaimer

**Research flag:** MEDIUM DEPTH - Phase-specific research szükséges:
- Web search tool API (pause_turn kezelés, encrypted_content multi-turn)
- Magyar piaci benchmark források (allowed_domains lista)
- Prompt engineering hallucination mitigation-höz (range vs exact values)

### Phase 4: XLSX generálás template-ekből
**Rationale:** Az XLSX tartalom a Phase 3 research outputja + Phase 1 briefData. A Phase 4 KELL HOGY követi a Phase 3-at, mert a Mediaplan sheet a ResearchResults-ból generálódik.

**Delivers:**
- ExcelJS dependency telepítés
- XLSX template cell-mapping analízis (manual work: megnyitni mindkét template-et, azonosítani a cell pozíciókat)
- `lib/xlsx/generate.ts` - két függvény: `generateAgencyBriefXlsx()` + `generateMediaplanXlsx()`
- `lib/xlsx/cell-mapping.ts` - config: melyik mező melyik cellába kerül
- Agency Brief template kitöltés (ügyfél adatok, checkbox TRUE/FALSE)
- Mediaplan template kitöltés (fejléc: partner adatok, kampány név, időszak, keretösszeg + PPC sorok: AI-generált kampány struktúra)
- Buffer-alapú output (nem fájlrendszer)

**Uses:**
- ExcelJS ^4.4.0 (STACK.md)

**Implements:**
- XLSX Generator (ARCHITECTURE.md component)
- Template-based filling (ARCHITECTURE.md pattern)

**Addresses:**
- Agency Brief XLSX kitöltés (FEATURES.md table stakes)
- Mediaplan XLSX kitöltés (FEATURES.md table stakes)
- Checkbox kezelés (FEATURES.md table stakes)
- Összeg számítások (FEATURES.md table stakes)
- Dinamikus PPC sor generálás (FEATURES.md differentiator)

**Avoids:**
- XLSX generálás from scratch (FEATURES.md anti-feature) - template-based megőrzi a ROI Works design-t
- XLSX szerkesztő az UI-ban (FEATURES.md anti-feature) - a PM Excel-ben dolgozik

**Critical pitfall mitigations:**
- MOD-1 (SheetJS vulnerability): ExcelJS használata
- MOD-2 (memory pressure): Külön route az XLSX generálásnak, nem a PDF-fel együtt
- MIN-2 (formázás edge cases): Template egyszerűnek tartása (táblázatos adatok, alapvető formázás, NINCS beágyazott kép/makró)

**Research flag:** LOW DEPTH - Phase-specific research szükséges:
- ROI Works template struktúra analízis (cell mapping manual work)
- ExcelJS dynamic row insertion (formázás másolása)

### Phase 5: PM email XLSX csatolmányokkal
**Rationale:** Az email a workflow végpontja - minden előző phase output-ja (briefData, research, XLSX-ek) itt összefut. A Phase 5 a legkisebb kockázat, mert a SendGrid pattern már működik PDF-fel.

**Delivers:**
- `lib/research/send-results.ts` - PM email sender
- SendGrid template bővítés (research summary HTML body)
- XLSX base64 encoding + csatolmány konfiguráció
- Email subject és body az ügyfél adataival (cégnév, kampány név, összefoglaló)
- (Opcionális) Vercel Blob fallback ha attachment > 3.5 MB

**Uses:**
- @sendgrid/mail meglévő (STACK.md)
- Vercel Blob opcionális (STACK.md)

**Implements:**
- PM Email Sender (ARCHITECTURE.md component)
- SendGrid attachment pattern extension (ARCHITECTURE.md)

**Addresses:**
- PM email XLSX csatolmányokkal (FEATURES.md table stakes)
- Két XLSX fájl csatolása (FEATURES.md table stakes)
- Email tartalom bővítés (FEATURES.md table stakes)
- Email subject és body az ügyfél adataival (FEATURES.md differentiator)

**Avoids:**
- Email küldés az ügyfélnek is (FEATURES.md anti-feature) - az ügyfél PDF-et kap (letöltés), a PM XLSX-eket kap (email)
- Webhook / Slack / CRM integráció (FEATURES.md anti-feature) - email-first

**Critical pitfall mitigations:**
- CRIT-3 (4.5 MB limit): Vercel Blob köztes tárolás, link fallback
- MOD-4 (base64 overhead): Méret becslés, fallback link 3.5 MB felett

**Research flag:** SKIP - SendGrid attachment pattern 1:1 adaptálható

### Phase Ordering Rationale

A phase-ek sorrendje **dependency-driven**, nem feature-value alapú:

1. **Séma előbb, mint flow**: A briefData struktúra kell hogy végleges legyen mielőtt a jóváhagyási flow kezeli.
2. **Approval előbb, mint research**: Az approve endpoint a trigger - nem lehet research-öt indítani, ha nincs trigger pont.
3. **Research előbb, mint XLSX**: A Mediaplan tartalma a research output - nem generálható adatok nélkül.
4. **XLSX előbb, mint email**: Az email csatolmánya az XLSX - nem küldhető ami nincs.

**Párhuzamosítási lehetőség minimális**: Az 1-2-3-4-5 szekvencia nem tördelő. Egyedüli kivétel: a Phase 1 (séma) és Phase 2 (UI) között a UI munka **részben** párhuzamosítható, ha mock adatokkal dolgozik a fejlesztő.

**Mitigáció stratégia**: Minden phase független deployable increment. Ha a Phase 3 elhúzódik (AI kutatás komplexitás), a Phase 1+2 már értéket ad (bővített adatgyűjtés + egyszerűbb approval flow).

### Research Flags

**Needs research:**
- **Phase 3 (AI research)**: MEDIUM DEPTH
  - Web search tool API nuances (pause_turn, encrypted_content, multi-turn continuation)
  - Magyar piaci benchmark források (allowed_domains whitelist összeállítása)
  - Hallucination mitigation prompt engineering (range vs exact, citation enforcement)
  - ResearchResults schema finalizálás (mely mezők kellenek a Mediaplan kitöltéshez)

- **Phase 4 (XLSX)**: LOW DEPTH
  - ROI Works template struktúra analízis (manual cell mapping - nem automatizálható)
  - ExcelJS dynamic row insertion API (formázás másolása a template sorokból)

**Standard patterns (skip research-phase):**
- **Phase 1 (séma)**: Zod schema extension + prompt engineering - well-documented
- **Phase 2 (approval)**: Next.js API route + React state machine - well-documented
- **Phase 5 (email)**: SendGrid attachment - meglévő pattern adaptálása

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | ExcelJS, Anthropic Web Search Tool, SendGrid, Next.js after() - mind hivatalos docs alapján, verified npm package-ek. Egyetlen új dependency (ExcelJS), a többi meglévő stack kiterjesztése. |
| Features | **MEDIUM-HIGH** | ROI Works template-ek analízise (elsődleges forrás: HIGH), iparági marketing workflow-k (MEDIUM), UX patterns (HIGH - NN/G). A feature prioritás egyértelmű, de az AI kutatás output struktúrája (ResearchResults interface) finomításra szorul a template cell mapping analízis után. |
| Architecture | **HIGH** | Next.js 16 after() API stable (official docs v16.1.6), Vercel limits dokumentáltak (Fluid Compute, response size, KV), Anthropic web_search_20250305 tool official docs. A stateless -> stateful transition jól definiált pattern (session ID + KV). |
| Pitfalls | **HIGH** | Vercel docs (timeout, limits), Anthropic docs (hallucination mitigation, citations), SheetJS npm issue (GitHub), ExcelJS serverless use (community consensus). A critical pitfalls mind official source-okból származnak. |

**Overall confidence:** **HIGH**

A stack és architektúra döntések official docs alapján vannak, a pitfalls verifikáltak production use case-ekkel. Az egyetlen MEDIUM confidence terület a ResearchResults -> Mediaplan mapping - ez a Phase 4 template analíziséig nem finalizálható.

### Gaps to Address

1. **ROI Works template cell mapping**: A `docs/ROI_Mediaplan/` XLSX fájlok pontos struktúrája (melyik cella melyik mező) manuális analízist igényel. Ez a Phase 4 research-phase témája. A template-ek változása esetén a cell mapping config manuálisan frissítendő.

2. **ResearchResults interface finalizálás**: A Phase 3 ResearchResults schema-ja jelenleg high-level (channelMix, targetingInsights, kpiBenchmarks). A végleges séma függ a Mediaplan template struktúrájától - milyen mezők kellenek egy PPC sorhoz (kampány cél, típus, csatorna, hirdetés típus, dátum, megjelenés, kattintás, konverzió, CPM, CPC, teljes ár). A Phase 3 és Phase 4 között egy validation loop szükséges.

3. **Magyar piaci benchmark források**: Az AI kutatás `allowed_domains` listája építendő. Megbízható magyar marketing adatforrások whitelist-je (pl. Statista HU, magyar marketing blogok, platform-specifikus magyar ár-listák). Ez a Phase 3 research-phase része.

4. **Hallucination detection heurisztikák**: A prompt engineering mellett érdemes runtime validation is (kerek számok túlsúlya, forrás nélküli állítások detektálása). Ez Phase 3 optional enhancement - az MVP-ben a prompt-level guardrails elégségesek.

5. **Vercel Blob vs inline attachment decision logic**: A Phase 5-ben meg kell határozni a pontos küszöböt (3.5 MB? 4 MB?) ahol az email inline attachment-ről Blob link-re vált. Méretbecslési logika az XLSX generálás után (buffer size ellenőrzés).

## Sources

### Primary (HIGH confidence)
- [Vercel Functions Duration Docs](https://vercel.com/docs/functions/configuring-functions/duration) - timeout limits, Fluid Compute
- [Vercel Functions Limitations](https://vercel.com/docs/functions/limitations) - 4.5 MB response body, memory limits
- [Vercel Fluid Compute](https://vercel.com/docs/fluid-compute) - 300s default, 800s max
- [Vercel Blob](https://vercel.com/docs/vercel-blob) - large file storage
- [Vercel KV](https://vercel.com/kb/guide/session-store-nextjs-redis-vercel-kv) - session state persistence
- [Next.js after() API](https://nextjs.org/docs/app/api-reference/functions/after) - v16.1.6 official docs, stable since v15.1
- [Anthropic Web Search Tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) - full API reference, pause_turn, citations
- [Anthropic Reduce Hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations) - range vs exact, citations
- [Anthropic Web Search Pricing](https://claude.com/blog/web-search-api) - $10/1000 searches, supported models
- [ExcelJS npm](https://www.npmjs.com/package/exceljs) - v4.4.0, 4M+ weekly downloads
- [ExcelJS GitHub](https://github.com/exceljs/exceljs) - template loading, buffer I/O
- [SendGrid Node.js Attachments](https://github.com/sendgrid/sendgrid-nodejs/blob/main/docs/use-cases/attachments.md) - base64 attachment pattern
- [SheetJS npm issue #2667](https://github.com/SheetJS/sheetjs/issues/2667) - npm registry abandonment, CVE-2023-30533

### Secondary (MEDIUM confidence)
- [Capably.ai Media Planning Automation](https://www.capably.ai/resources/media-planning-automation) - iparági trend
- [TAU Marketing Solutions AI Agents](https://taums.ai/ai-agents-in-media-planning-and-buying/) - iparági trend
- [AdAmigo KPIs Cross-Platform](https://www.adamigo.ai/blog/top-7-kpis-for-cross-platform-ad-benchmarking) - benchmark adatok
- [AI Digital Marketing KPIs 2026](https://www.aidigital.com/blog/digital-marketing-kpi) - benchmark adatok
- [Planable Marketing Approval Process](https://planable.io/blog/marketing-approval-process/) - UX patterns
- [NN/G Confirmation Dialogs](https://www.nngroup.com/articles/confirmation-dialog/) - UX best practices
- [Material Design Confirmation](https://m2.material.io/design/communication/confirmation-acknowledgement.html) - design pattern
- [Workshop Digital AI Hallucinations](https://www.workshopdigital.com/blog/ai-hallucinations-in-marketing/) - marketing specifikus hallucinációs kockázatok
- [npm-compare: xlsx libraries](https://npm-compare.com/excel4node,exceljs,node-xlsx,xlsx,xlsx-populate) - library comparison
- [ExcelJS Bundlephobia](https://bundlephobia.com/package/exceljs) - 1.08 MB package size

### Tertiary (LOW confidence)
- ROI Works Agency Brief xlsx template - manual analysis (elsődleges forrás a template struktúrához, de internal document)
- ROI Works Mediaplan xlsx template - manual analysis (elsődleges forrás a template struktúrához, de internal document)

---
*Research completed: 2026-02-12*
*Ready for roadmap: yes*
