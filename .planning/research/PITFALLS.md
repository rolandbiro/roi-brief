# Domain Pitfalls: Enhanced Brief + AI Research (v1.1)

**Domain:** AI research pipeline, xlsx generálás, háttérfeldolgozás Vercel serverless környezetben
**Researched:** 2026-02-12
**Overall confidence:** HIGH (Vercel docs, Anthropic API docs, codebase elemzés alapján)

---

## Critical Pitfalls

Ezek a hibák újraírást, adat-vesztést, vagy production leállást okoznak.

---

### CRIT-1: Vercel function timeout az AI research pipeline-ban

**Mi romlik el:** A jelenlegi chat route (`app/api/chat/route.ts`) szinkron streaming-et használ -- a válasz addig tart, amíg Claude befejezi. Ha az AI research több web search-öt hajt végre (5-10 kérés, mindegyik 2-5 másodperc), a teljes pipeline könnyen 60-120 másodpercre nyúlhat. Fluid Compute nélkül a Hobby plan 10 másodperces default timeouttal rendelkezik, ami azonnal failel.

**Miért történik:** A meglévő architektúra feltételezi, hogy egy Claude hívás (streaming tool use loop-pal) gyorsan lefut. Az AI research viszont szekvenciális web search-öket, adatelemzést és szintézist igényel -- ez alapvetően más időskálán működik.

**Következmények:**
- 504 FUNCTION_INVOCATION_TIMEOUT a user számára
- Részleges research eredmények elvesznek (nincs persistence)
- A felhasználó nem tudja, mi történt -- újra kell próbálnia
- Vercel-en a megszakított function nem "takarít" -- nincs graceful cleanup

**Megelőzés:**
1. **Fluid Compute engedélyezése** a Vercel dashboardon -- ez a default timeoutot 300s-re emeli (Hobby) vagy 800s-re (Pro). Ez az első és legfontosabb lépés.
2. **`maxDuration` beállítása** a research route-on:
   ```typescript
   // app/api/research/route.ts
   export const maxDuration = 300; // 5 perc Hobby, vagy 800 Pro-n
   ```
3. **Research és chat szétválasztása** -- a research NE a meglévő chat route-on fusson. Külön `/api/research` endpoint, külön timeout konfigurációval.
4. **`max_uses` limitálása** a Claude web search tool-on (max 5-8 search/request), hogy kiszámítható legyen az időtartam.
5. **Ha 5 perc sem elég:** `after()` (Next.js 16) + polling pattern. A response azonnal visszamegy ("research elindult"), a tényleges munka `after()`-ban folytatódik. Eredmény Vercel KV-ba, kliens pollingol.

**Detektálás:** Vercel Function logs-ban 504-es hibák. Monitoring a function duration-re.

**Confidence:** HIGH -- Vercel docs egyértelműen dokumentálják a limiteket. Fluid Compute duration-ök: Hobby 300s, Pro/Ent 800s max.

**Forrás:** [Vercel Functions Duration Docs](https://vercel.com/docs/functions/configuring-functions/duration), [Vercel Functions Limits](https://vercel.com/docs/functions/limitations)

---

### CRIT-2: Stateless architektúra + háttérfeldolgozás = adat-vesztés

**Mi romlik el:** A jelenlegi rendszer teljesen stateless -- a `briefState` a kliens memóriájában él, és minden request-ben oda-vissza utazik. Ha az AI research háttérben fut (pl. `after()`-ban a válasz elküldése után), de a felhasználó bezárja a böngészőt vagy frissít, a research eredménye elvész, mert nincs hová írni.

**Miért történik:** A v1.0 tudatosan stateless-nek lett tervezve (nincs DB, nincs session store). Ez működött a chat-nél, mert minden interakció szinkron volt. A háttérfeldolgozás viszont megköveteli a server-side persistence-t.

**Következmények:**
- Felhasználó vár 2-3 percet, közben bezárja a tabot -- eredmény elvész
- Mobilon a böngésző háttérbe kerül, a connection megszakad -- eredmény elvész
- Nem lehet "folytatni" egy félbehagyott research-öt
- Race condition: kliens küld egy módosítást, közben a háttérfolyamat is ír -- melyik nyer?

**Megelőzés:**
1. **Vercel KV (Redis) bevezetése** session/research state tárolásra. Ez a legkisebb lépés a stateless-ből stateful-ba. Vercel KV Hobby plan-en is elérhető.
2. **Session ID generálása** kliens oldalon (pl. `crypto.randomUUID()`), amit minden request-ben elküld. A server ezzel a kulccsal olvas/ír KV-ba.
3. **TTL beállítása** a KV rekordokra (pl. 24 óra) -- ne halmozódjon a szemét.
4. **Polling endpoint** a research státuszhoz: `GET /api/research/[sessionId]/status` -- a kliens kérdezi, kész van-e.
5. **NE próbáljuk a meglévő briefState oda-vissza utaztatást kiterjeszteni** a research-re. A research state legyen server-side from the start.

**Detektálás:** Tesztelni kell: research indítás, tab bezárás, visszatérés -- megvannak-e az eredmények?

**Confidence:** HIGH -- a codebase egyértelműen stateless (briefState a kliens JSON body-jában utazik).

---

### CRIT-3: Vercel 4.5 MB response body limit az xlsx/pdf generálásnál

**Mi romlik el:** A Vercel serverless function-ök response body-ja maximum 4.5 MB lehet. Egy részletes xlsx (sok sheet, képletek, formázás) + a meglévő PDF attachment könnyen megközelítheti vagy túllépheti ezt. A SendGrid route-ban a PDF base64 kódolva utazik a request body-ban -- a base64 33%-kal növeli a méretet.

**Miért történik:** A jelenlegi `download-pdf` route a teljes PDF-et response body-ként küldi vissza. Ha xlsx-et is generálunk (különösen többlapos, formázott táblázatokkal), a fájlméret megjósolhatatlan.

**Következmények:**
- 413 FUNCTION_PAYLOAD_TOO_LARGE hiba
- A felhasználó nem tudja letölteni a generált fájlt
- SendGrid küldés is failelhet, ha a base64-kódolt attachment(ek) + email body > 4.5 MB (bár a SendGrid saját limit 30 MB, a Vercel function limit előbb üt be)

**Megelőzés:**
1. **Vercel Blob használata köztes tárolásra:** A serverless function generálja az xlsx-t, feltölti Vercel Blob-ba, és csak a letöltési URL-t adja vissza a kliensnek. A Blob-ból nincs 4.5 MB limit.
2. **Streaming response** xlsx letöltéshez -- a streaming function-öknek nincs response size limit Vercel-en.
3. **SendGrid route-ban:** Ha az xlsx + pdf attachment együtt nagy, a Vercel Blob URL-t linkként küldjük az emailben, nem attachment-ként.
4. **Fájlméret becslés** generálás előtt -- ha a briefData nagyon részletes, figyelmeztetés a felhasználónak.

**Detektálás:** Monitoring a response méretekre. Teszt nagy dataset-ekkel.

**Confidence:** HIGH -- Vercel docs: "The maximum payload size for the request body or the response body of a Vercel Function is 4.5 MB."

**Forrás:** [Vercel Functions Limits](https://vercel.com/docs/functions/limitations), [Bypass 4.5MB Limit](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions)

---

### CRIT-4: AI hallucináció marketing adatokban

**Mi romlik el:** A Claude web search tool CPM rátákat, targeting kategóriákat, benchmark KPI-kat és csatorna-specifikus ajánlásokat fog generálni. Az LLM hajlamos "hihető de hamis" számokat gyártani -- különösen pénzügyi/marketing metrikáknál. Egy hamis CPM ráta vagy téves ROI becslés alapján a kliens rossz döntést hoz.

**Miért történik:** Az LLM-ek statisztikai mintaillesztéssel generálnak szöveget. A marketing metrikák (CPM, CPC, CTR, ROAS) gyakran kontextus-függőek (ország, iparág, platform, szezon). A modell "átlagos" számokat generál, amik konkrét esetben félrevezetőek lehetnek. A marketingesek 43%-a állítja, hogy hallucinated adat már átcsúszott review-n.

**Következmények:**
- ROI Works hamis adatokra alapozott ajánlást tesz a kliensnek
- Reputációs kár, ha a kliens rájön
- Jogi kockázat, ha konkrét ROI-t ígérnek hamis adatok alapján
- A felhasználó vakon bízik az AI output-ban, mert "kutatáson alapul"

**Megelőzés:**
1. **Claude web search Citations használata** -- a tool automatikusan forrást ad minden állításhoz. Ezeket KÖTELEZŐEN megjeleníteni a kimenetben. A `cited_text` és `url` mezők validálják az adatot.
2. **Számadatokat SOHA nem kiírni forrás nélkül.** A prompt-ban explicit utasítás: "Konkrét számadatot (CPM, CPC, CTR, konverziós ráta) CSAK akkor adj meg, ha web search eredményből származik és citálható."
3. **"Becslés" és "Forrás alapján" megkülönböztetés** a kimenetben -- a felhasználó lássa, mi biztos és mi nem.
4. **Tartomány (range) használata** egyetlen szám helyett: "Facebook CPM Magyarországon: 2-6 EUR (forrás: ...)" nem "Facebook CPM: 3.4 EUR".
5. **Domain filtering** a web search tool-on: `allowed_domains` használata megbízható forrásokra (statista.com, hypeauditor.com stb.).
6. **Human review figyelmeztetés** a research output-ban: "Az AI-alapú kutatás tájékoztató jellegű. A konkrét számokat az account manager validálja."

**Detektálás:** Kerek számok túlsúlya (5-re, 0-ra végződő %-ok 3.7x gyakrabban hallucinated-ek). Forrás nélküli állítások.

**Confidence:** HIGH -- Anthropic docs, marketing industry research, hallucination tanulmányok egyaránt alátámasztják.

**Forrás:** [Claude Web Search Tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool), [Reduce Hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations)

---

## Moderate Pitfalls

Ezek nem okoznak azonnali katasztrófát, de technikai adósságot és user experience problémákat generálnak.

---

### MOD-1: SheetJS (xlsx) npm vulnerability és telepítési bonyodalom

**Mi romlik el:** Az npm registry-n lévő `xlsx` csomag (0.18.5) ismert, javítatlan CVE-2023-30533 (Prototype Pollution) sebezhetőséget tartalmaz. A SheetJS csapat nem publikálja az új verziókat npm-re -- csak a saját CDN-jükről érhető el.

**Miért történik:** A SheetJS úgy döntött, hogy elhagyja az npm registry-t. Az npm-en elérhető verzió 2+ éves és sérülékeny.

**Megelőzés:**
1. **ExcelJS használata SheetJS helyett.** Az ExcelJS aktívan karbantartott, npm-en elérhető, és buffer-alapú generálást támogat filesystem nélkül -- ideális serverless-hez.
   ```bash
   npm install exceljs
   ```
2. Ha mégis SheetJS kell: CDN-ről telepítés:
   ```bash
   npm i --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
   ```
3. **Soha ne `npm install xlsx`** -- ez a sérülékeny verziót húzza le.

**Confidence:** HIGH -- npm registry, SheetJS GitHub issues, CVE-2023-30533.

**Forrás:** [SheetJS npm issue](https://github.com/SheetJS/sheetjs/issues/2667), [ExcelJS npm](https://www.npmjs.com/package/exceljs)

---

### MOD-2: @react-pdf/renderer + xlsx generálás = memory pressure serverless-ben

**Mi romlik el:** A jelenlegi rendszer `@react-pdf/renderer`-t használ PDF generálásra. Ha ugyanabban a serverless function-ben xlsx-et IS generálunk (ExcelJS + PDF render), a memóriahasználat megugrik. A Vercel Hobby plan 2 GB memóriával rendelkezik -- ez általában elég, de nagy dokumentumoknál (sok adat, betűtípusok, képek) szűkössé válhat.

**Miért történik:** A `@react-pdf/renderer` maga is memória-intenzív (React reconciler + font rendering + layout engine). Ha mellé jön egy xlsx buffer generálás is, a két nagy művelet egyidejű futása túlterhelheti a function-t.

**Megelőzés:**
1. **Xlsx és PDF generálást külön API route-okba szervezni.** Ne egy function csinálja mindkettőt.
2. **PDF generálás megtartása a meglévő route-okon** (`download-pdf`, `send-brief`), xlsx generálás új, dedikált route-on.
3. **Ha a send-brief route-ban mindkettőt csatoljuk:** szekvenciálisan generálni (előbb xlsx, buffer kimentés, majd PDF), ne párhuzamosan.
4. **Bundle size figyelés** -- a `@react-pdf/renderer` 4.3.2 volt ismerten problémás a Vercel 50 MB bundle limittel korábbi verzióknál.

**Confidence:** HIGH -- Vercel memory limits dokumentáltak, @react-pdf/renderer issues (GitHub #2966, #1504).

---

### MOD-3: Claude web search költségrobbanás kontrollálatlan research-nél

**Mi romlik el:** A web search tool $10/1000 search. Ha a research pipeline nem limitálja a search-ök számát, egy összetett brief (4 kampánytípus, mindegyikhez channel mix + targeting + KPI research) 20-40 search-öt generálhat egyetlen kérésnél. Havi 100 brief = 2000-4000 search = $20-40/hó csak search-re, plusz a token költségek.

**Miért történik:** A Claude "okosan" dönt, mikor keres -- de nincs felső korlát, ha nem adjuk meg. Egy kreatív prompt, ami "kutasd ki alaposan" utasítást ad, sok search-öt triggerel.

**Megelőzés:**
1. **`max_uses` megadása** a web search tool definícióban:
   ```typescript
   tools: [{
     type: "web_search_20250305",
     name: "web_search",
     max_uses: 5 // maximum 5 search per request
   }]
   ```
2. **Usage tracking** -- a response `usage.server_tool_use.web_search_requests` mezőből kiolvasható a tényleges search szám. Logolni és monitorozni.
3. **Research lépések szétbontása** -- ne egy mammut prompt-ban kérjük az összes kutatást, hanem fókuszált lépésekben (1. channel mix, 2. targeting, 3. KPI benchmarks).
4. **Batch API használata** nem-sürgős research-höz -- ugyanaz az ár, de háttérben futhat.

**Confidence:** HIGH -- Anthropic pricing docs: "$10 per 1,000 searches".

**Forrás:** [Claude Web Search Pricing](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)

---

### MOD-4: SendGrid base64 encoding overhead + Vercel body limit együttes hatása

**Mi romlik el:** A jelenlegi `send-brief` route a PDF-et base64 kódolva csatolja a SendGrid kéréshez. A base64 ~33%-kal növeli a méretet. Ha xlsx-et IS csatolunk: egy 2 MB-os xlsx + 1 MB-os PDF = 3 MB nyers, de base64-ben = ~4 MB, ami a JSON wrapper-rel együtt megközelíti a Vercel 4.5 MB body limitet.

**Miért történik:** A SendGrid API base64 kódolt attachment-et vár. A Vercel function body limitje a teljes JSON payload-ra vonatkozik (attachment + email body + metadata).

**Megelőzés:**
1. **Attachment-eket Vercel Blob-ba feltölteni,** és a SendGrid emailben csak linkként hivatkozni rájuk (nem inline attachment).
2. **Ha muszáj attachment:** méretbecslés a generálás után, és ha a kombinált base64 méret > 3.5 MB, automatikus fallback linkre.
3. **Xlsx és PDF külön emailben** küldeni, ha mindkettő nagy.
4. **Gzip tömörítés** a SendGrid payload-hoz (elérhető, de csak high-volume account-oknál).

**Confidence:** HIGH -- SendGrid docs (30 MB limit), Vercel docs (4.5 MB function body limit), base64 encoding math (33% overhead).

---

### MOD-5: Research eredmények sémája nem illeszkedik a meglévő BriefState-hez

**Mi romlik el:** A meglévő `BriefState` egyszerű: `briefData: Record<string, unknown>`, fázisok: discovery -> questioning -> complete. Az AI research eredmények (channel mix ajánlás, CPM benchmarks, targeting opciók, KPI célok) strukturálisan mások -- nem kérdés-válasz adatok, hanem kutatási output-ok. Ha ezeket a meglévő `briefData`-ba próbáljuk gyömöszölni, kaotikus lesz a séma.

**Miért történik:** A v1.0 `briefData` a felhasználó válaszait tárolja (company_name, budget_range stb.). A research output más jellegű: ajánlások, benchmark adatok, források. Két különböző adatmodell.

**Megelőzés:**
1. **Külön `researchData` mező** a state-ben, teljesen elkülönítve a `briefData`-tól.
2. **Typed schema** a research output-hoz (Zod-dal, ahogy a briefData is):
   ```typescript
   interface ResearchState {
     status: "idle" | "running" | "complete" | "error";
     channelMix?: ChannelRecommendation[];
     targetingInsights?: TargetingInsight[];
     kpiBenchmarks?: KpiBenchmark[];
     sources: CitedSource[];
     startedAt?: string;
     completedAt?: string;
   }
   ```
3. **Ne bővítsük a meglévő BriefDataSchema-t** research mezőkkel -- az a felhasználó adatai. A research output külön entitás.
4. **Xlsx generálás mindkét forrásból összeállítva:** a brief adatai + research adatai = kombinált output, de a két forrás szeparáltan tárolva.

**Confidence:** HIGH -- a codebase elemzése egyértelműen mutatja a jelenlegi BriefState struktúrát.

---

## Minor Pitfalls

Ezek bosszantóak, de gyorsan javíthatók.

---

### MIN-1: Claude web search `pause_turn` kezelés hiánya

**Mi romlik el:** Ha a Claude web search tool hosszú turn-t futtat (sok search), a válasz `pause_turn` stop reason-nel érkezhet. Ha ezt nem kezeljük, a research félbemarad.

**Megelőzés:** A streaming handler-ben ellenőrizni a `stop_reason === "pause_turn"` esetet, és automatikusan folytatni a turn-t a válasz visszaküldésével.

**Confidence:** HIGH -- Anthropic docs: "The response may include a pause_turn stop reason, which indicates that the API paused a long-running turn."

---

### MIN-2: ExcelJS formázás edge case-ek serverless-ben

**Mi romlik el:** Az ExcelJS buffer-alapú generálása serverless-ben működik, de bizonyos feature-ök (pl. képek beágyazása, hyperlink-ek nagy száma) váratlanul megnövelhetik a memóriahasználatot vagy a generálási időt.

**Megelőzés:** Az xlsx template-et egyszerűnek tartani -- táblázatos adatok, alapvető formázás (szín, szegély, oszlopszélesség), NINCS beágyazott kép, NINCS makró. Az xlsx a nyers adatokat tartalmazza, a szép formázás a PDF dolga.

**Confidence:** MEDIUM -- ExcelJS serverless használata általánosan támogatott, de edge case-ek nem dokumentáltak.

---

### MIN-3: Web search encrypted_content kezelés multi-turn-ben

**Mi romlik el:** A Claude web search eredmények `encrypted_content` és `encrypted_index` mezőket tartalmaznak, amiket vissza kell küldeni multi-turn beszélgetésben a citációk működéséhez. Ha a research eredményeket cache-eljük vagy újrafeldolgozzuk, ezek az encrypted mezők elveszhetnek.

**Megelőzés:** A teljes web search response-t tárolni (Vercel KV-ban), nem csak a kinyert szöveget. A citációk megjelenítésekor az eredeti `url` és `cited_text` mezőket használni.

**Confidence:** HIGH -- Anthropic docs explicit említi az encrypted mezők kezelését.

---

### MIN-4: Prompt caching kihagyása web search-nél

**Mi romlik el:** Ha nem használunk prompt caching-et a web search-es hívásokban, minden egyes research lépés újra fizeti a system prompt + előzmények token költségét. Egy 5-lépéses research pipeline-nál ez jelentős token pazarlás.

**Megelőzés:** `cache_control` breakpoint beállítása az utolsó `web_search_tool_result` blokk után vagy azon, a multi-turn research folyamán. Ez drasztikusan csökkenti a token költségeket.

**Confidence:** HIGH -- Anthropic docs: "Web search works with prompt caching."

---

## Phase-Specific Warnings

| Fázis téma | Valószínű pitfall | Mitigáció |
|---|---|---|
| Schema bővítés (briefState -> researchState) | CRIT-2, MOD-5: A stateless -> stateful átmenet és az új adatmodell egyszerre történik | Először KV bevezetés + session ID, aztán research schema. Két külön lépés. |
| AI research pipeline | CRIT-1, CRIT-4, MOD-3: Timeout, hallucináció, költség egyszerre fenyeget | Fluid Compute + maxDuration ELSŐKÉNT. Aztán hallucination guardrails. Költség monitoring utolsóként. |
| Xlsx generálás | MOD-1, MOD-2, MIN-2: Library választás, memory, formázás | ExcelJS választás + dedikált route + egyszerű template. |
| Email csatolmányok | CRIT-3, MOD-4: 4.5 MB limit + base64 overhead | Vercel Blob köztes tárolás + link fallback, ha a méret kritikus. |
| Background processing | CRIT-1, CRIT-2: Timeout + adatvesztés a fő kockázat | after() + KV + polling pattern. NE a chat route-on fusson. |

---

## Összefoglaló prioritási sorrend

1. **Fluid Compute engedélyezése** (CRIT-1) -- nulla kódolás, azonnal megoldja a timeout problémát
2. **Vercel KV bevezetése** (CRIT-2) -- a háttérfeldolgozás alapfeltétele
3. **Research és chat szétválasztása** (CRIT-1, MOD-5) -- külön route, külön state, külön timeout
4. **Hallucination guardrails** (CRIT-4) -- Citations + range-ek + domain filtering a prompt-ban
5. **ExcelJS választás és implementáció** (MOD-1) -- npm-ről telepíthető, serverless-kompatibilis
6. **Vercel Blob a fájl-kimenethez** (CRIT-3, MOD-4) -- 4.5 MB limit megkerülése
7. **Költség monitoring** (MOD-3) -- max_uses + usage logging

---

## Sources

- [Vercel Functions Duration Docs](https://vercel.com/docs/functions/configuring-functions/duration) -- HIGH confidence
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations) -- HIGH confidence
- [Vercel Fluid Compute](https://vercel.com/docs/fluid-compute) -- HIGH confidence
- [Vercel Blob](https://vercel.com/docs/vercel-blob) -- HIGH confidence
- [Next.js after() API](https://nextjs.org/docs/app/api-reference/functions/after) -- HIGH confidence
- [Claude Web Search Tool Docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) -- HIGH confidence
- [Claude Reduce Hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations) -- HIGH confidence
- [Claude Citations API](https://claude.com/blog/introducing-citations-api) -- HIGH confidence
- [ExcelJS npm](https://www.npmjs.com/package/exceljs) -- HIGH confidence
- [SheetJS npm vulnerability](https://github.com/SheetJS/sheetjs/issues/2667) -- HIGH confidence
- [SendGrid Mail Send API](https://www.twilio.com/docs/sendgrid/api-reference/mail-send) -- HIGH confidence
- [Vercel KV / Redis](https://vercel.com/kb/guide/session-store-nextjs-redis-vercel-kv) -- HIGH confidence
- [AI Hallucination in Marketing](https://www.workshopdigital.com/blog/ai-hallucinations-in-marketing/) -- MEDIUM confidence
- [@react-pdf/renderer React 19 issues](https://github.com/diegomura/react-pdf/issues/2966) -- MEDIUM confidence
