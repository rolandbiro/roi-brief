# Feature Research: v1.1 Enhanced Brief + AI Research

**Domain:** Marketing ügynökségi brief asszisztens -- bővített adatgyűjtés, AI háttérkutatás, xlsx generálás
**Researched:** 2026-02-12
**Confidence:** MEDIUM-HIGH
**Scope:** Csak az ÚJ v1.1 funkciók -- a v1.0 chat/questioning/PDF/email rendszer már kész.

## Capability 1: Bővített strukturált adatgyűjtés (Agency Brief mezők)

### Kontextus

A v1.0 `BriefBase` séma 10 mezőt gyűjt (company_name, industry, campaign_goal, timing, budget_range, target_audience, existing_materials, previous_campaigns, competitors, notes). A ROI Works Agency Brief xlsx template viszont jóval több mezőt tartalmaz, amiket az ügyfélnek kell kitöltenie.

### Agency Brief xlsx template mezői (ügyfél-oldali)

A `docs/ROI_Mediaplan/ROIworks _ TEMPLATE_ Agency campaign brief.xlsx` vizsgálatából:

**Alapvető információk:**
- Cégnév
- Kapcsolattartó neve
- Kapcsolattartó elérhetőségei (email, telefon)
- Cég tevékenységi köre
- Márka pozicionálása

**Kampány részletei:**
- Kampány neve
- Kampány típusa
- Fő üzenet
- Kampány kreatívok (ügyfél biztosítja / ROIworks készíti, statikus / videós)
- Kommunikációs stílus
- Online hirdetési csatornák (Facebook, Instagram, Google GDN, Google Search, TikTok, Microsoft, YouTube, Egyéb -- checkbox-ok)

**Kampány célja:**
- Kampány célja szöveges leírás
- KPI-k (Elérés, Megjelenés, Link kattintás, Website event, Social aktivitás, Egyéb -- checkbox-ok)

**Célcsoport:**
- Demográfiai adatok (nem, lakóhely, kor)
- Pszichográfiai adatok (érdeklődési körök, vásárlási szokások)
- Ideális ügyfélprofil (persona)

**Időzítés:**
- Indulási dátum
- Zárási dátum
- Fontos események

**Költségvetés:**
- Allokált büdzsé (Ft)
- Platformonkénti elosztási preferencia

**Versenytársak:**
- Fő versenytársak
- Inspiráló kampányok vagy márkák

**Egyéb:**
- Technikai követelmények (pl. pixel telepítés)
- Belső jóváhagyási folyamatok

### Table Stakes

| Feature | Miért szükséges | Komplexitás | Megjegyzés |
|---------|----------------|-------------|------------|
| **Séma bővítés az Agency Brief template mezőire** | Az xlsx kitöltéshez az összes mezőnek rendelkezésre kell állnia. A jelenlegi 10 mező nem fedi le a kontakt adatokat, kreatív típusokat, checkbox-jellegű mezőket. | LOW | Zod séma bővítés, új mezők hozzáadása a BriefBase-hez. Backward compatible. |
| **Checkbox-jellegű mezők kezelése** | Az xlsx template checkbox-okat tartalmaz (csatornák, KPI-k, kreatív típusok, nemek). Ezeket boolean/array-ként kell tárolni. | LOW | `update_brief` tool már támogatja a nested mezőket és array-t. A prompt módosítás a kulcs. |
| **Prompt bővítés az új mezőkre** | Az AI-nak tudnia kell az összes Agency Brief mezőről és természetesen, konverzáció-szerűen kell rákérdeznie. | MEDIUM | A kérdezési stílus nem változik -- az AI ugyanúgy adaptívan kérdez, csak több mezőt fed le. A nehézség a természetes kérdezési sorrend megtartása ~25 mező esetén. |
| **Kontakt adatok gyűjtése** | Email és telefon szükséges a PM-nek, de az ügyfél számára frictionnél érzékeny pont. | LOW | A konverzáció végén kérdezni (miután a brief kész), nem az elején. "Mielőtt lezárnánk -- milyen elérhetőségen kereshetünk?" |

### Differenciátorok

| Feature | Érték | Komplexitás | Megjegyzés |
|---------|-------|-------------|------------|
| **Intelligens összevonás meglévő és új mezők között** | A jelenlegi type-specific mezők (GRP, ROAS, stb.) és az Agency Brief mezők közötti átfedés kezelése -- pl. online csatornák a type-specific-ben IS és az Agency Brief-ben IS szerepelnek. | MEDIUM | Nem kell dupla kérdés. Az AI promptnak le kell kezelnie, hogy ha a type-specific fázisban már kiderült a csatorna, ne kérdezze újra az Agency Brief szekciójában. |
| **Smart defaults az AI válaszokból** | Ha az ügyfél korábban elmondta hogy "webshop" -- a "Cég tevékenységi köre" mező automatikusan kitölthető. | LOW | Prompt-szintű -- az AI az `update_brief` tool-lal rögzíti amint felismeri, nem kell explicit kérdezni. |

### Anti-Feature

| Anti-Feature | Miért kerülni | Alternatíva |
|--------------|---------------|-------------|
| **Hosszú form-jellegű kikérdezés** | 25+ mező sorban megkérdezve robotikus és fárasztó. Az ügyfél abba hagyja. | Az AI csoportosítva, természetesen kérdez. Pl. "Mesélj a cégről és a kampányról!" -- ebből 4-5 mező kitölthető egyetlen válaszból. Az AI implicit infókat is rögzít. |
| **Minden mező kötelező** | Sok mező opcionális (persona, inspiráló kampányok). Kötelezőként kezelni felesleges friction. | Az AI kérdez, de elfogadja ha az ügyfél nem tud válaszolni. Az xlsx-ben üres marad -- a PM úgyis rákérdez személyesen. |

---

## Capability 2: Ügyfél jóváhagyási / megerősítő flow

### Kontextus

A v1.0-ban a flow: chat -> complete_brief tool -> "Brief áttekintése" gomb -> BriefEditor (read-only) -> email küldés + PDF letöltés. A v1.1-ben az ügyfélnek jóvá kell hagynia az adatokat MIELŐTT az AI háttérkutatás elindul. Az email cím gyűjtése kikerül (az ügyfélnek nem kell emailt megadnia).

### UX minta elemzés

A bevett UX pattern marketing brief eszközökben:
1. **Összesítő megjelenítés** -- Az összegyűjtött adatok áttekinthető formában
2. **Explicit megerősítés** -- "Jóváhagyom" gomb (nem alapértelmezett, NN/G ajánlás)
3. **Módosítás lehetősége** -- Ha valami nem stimmel, visszatérhet a chatbe
4. **Egyértelmű státusz kommunikáció** -- "Az adataid alapján elkészítjük a kutatást"

### Table Stakes

| Feature | Miért szükséges | Komplexitás | Megjegyzés |
|---------|----------------|-------------|------------|
| **Jóváhagyó képernyő (BriefEditor átalakítás)** | Az ügyfélnek explicit jóvá kell hagynia az adatokat mielőtt az AI kutatást indít. Ez a megerősítés a "handoff" pont az ügyfél és a háttér-folyamat között. | MEDIUM | A meglévő BriefEditor átalakítása. Két gomb: "Jóváhagyom" (indítja a háttér-flow-t) + "Visszatérek a chatbe" (módosítás). |
| **PDF letöltés a jóváhagyó képernyőn** | Az ügyfél kapjon saját másolatot. A v1.0-ban volt PDF letöltés -- megtartandó. | LOW | Meglévő `download-pdf` route marad. A BriefEditor-ből elérhető. |
| **Email cím eltávolítása a flow-ból** | Az ügyfélnek NEM kell emailt megadnia (a v1.1 kontextusban). Az xlsx-ek a PM-nek mennek, nem az ügyfélnek. | LOW | BriefEditor-ből kikerül az email input és "Küldés emailben" gomb. |
| **Háttérfolyamat indítás a jóváhagyás után** | A "Jóváhagyom" gomb elindítja az AI kutatást. Az ügyfélnek erről visszajelzést kell kapnia. | MEDIUM | A jóváhagyás után: 1) köszönő képernyő az ügyfélnek, 2) háttérben API hívás az AI kutatás indításához. |

### Differenciátorok

| Feature | Érték | Komplexitás | Megjegyzés |
|---------|-------|-------------|------------|
| **"Köszönjük" záró képernyő** | Professzionális lezárás: "Köszönjük! A csapatunk hamarosan felveszi veled a kapcsolatot." A PDF letöltés itt is elérhető. | LOW | Egyszerű statikus komponens. |
| **Vizuális progress az AI kutatáshoz** | Az ügyfél látja hogy "Az AI most dolgozik a te briefeden..." -- de NEM kell megvárnia. | LOW | Információ jellegű, nem blokkol. Az ügyfél bezárhatja az oldalt. |

### Anti-Feature

| Anti-Feature | Miért kerülni | Alternatíva |
|--------------|---------------|-------------|
| **Szerkeszthető jóváhagyó form** | A BriefEditor szerkeszthetővé tétele hatalmas komplexitás (40+ mező validáció, nested objektumok frissítése). Az ügyfél úgyis a chatben adta meg -- ha változtatni akar, menjen vissza a chatbe. | Read-only áttekintés + "Visszatérek a chatbe" gomb. |
| **Ügyfél bevárása az AI kutatásra** | Az AI kutatás 30-60 másodpercig tarthat. Az ügyfelet várakoztatni rossz UX. | Fire-and-forget: az ügyfél jóváhagy, PDF-et letölt, kész. Az AI háttérben dolgozik, az xlsx-ek a PM-nek mennek. |

---

## Capability 3: AI háttérkutatás

### Kontextus

Az ügyfél adataiból az AI háttérkutatást végez a ROI Works csapat számára. Ez a legértékesebb új funkció -- az ügynökség munkaórákat spórol vele. A kutatás eredményei az xlsx fájlokba kerülnek (nem az ügyfélnek látszanak).

### Iparági gyakorlat

A marketing ügynökségek AI kutatási workflow-ja (2026-os állapot):
- **Brief feldolgozás**: Az AI elemzi a brief adatokat (célok, célcsoport, büdzsé, időzítés)
- **Csatorna allokáció**: Büdzsé elosztási javaslat csatornánként (a brief által megjelölt csatornákra)
- **Targeting javaslatok**: Platform-specifikus érdeklődési körök, audience szegmensek
- **KPI becslés**: Iparági benchmark-ok alapján várható metrikák (CPM, CPC, CTR, konverzió)
- **Versenytárs-elemzés**: A megadott versenytársak online jelenlétének elemzése
- **Mediaplan metrikák**: Soronként megjelenés, kattintás, konverzió becslés a költség alapján

### Table Stakes

| Feature | Miért szükséges | Komplexitás | Megjegyzés |
|---------|----------------|-------------|------------|
| **Csatorna mix javaslat (büdzsé elosztás)** | A Mediaplan xlsx fő tartalma: melyik csatornára (Google Search, Meta Banner, TikTok Video, stb.) mennyi büdzsé menjen. Az AI a kampány célja + célcsoport + büdzsé alapján javasol. | HIGH | Ez a legkomplexebb AI feladat. A Mediaplan xlsx template struktúrájához kell illeszkednie (sorok = kampány sorok, oszlopok = cél, típus, csatorna, hirdetés típus, dátum, metrikák, költség). |
| **KPI becslés csatornánként** | Minden mediaplan sorhoz kell: megjelenés, kattintás (becsült), konverzió/lead, CPM/CPC/CPT, teljes ár. Iparági benchmark-ok alapján. | HIGH | Az AI-nak iparág-specifikus benchmark-okat kell alkalmaznia. Pl. Google Search CPC: 50-300 Ft (iparágtól függően), Meta CPM: 800-2500 Ft, TikTok CPM: 500-1500 Ft. A becslések HUF-ban kell legyenek. |
| **Targeting javaslatok** | Az Agency Brief xlsx-be kerülnek: érdeklődési körök platform-specifikusan (Google in-market, Meta interest targeting, TikTok interest categories). | MEDIUM | Claude API-val: a brief célcsoport leírásából és iparágából platform-specifikus targeting kategóriákat generál. Nem kell élő API -- az LLM tudása elég itt. |
| **Kampány sor struktúra generálás** | A Mediaplan xlsx sorai nem fix sablonok -- az AI generálja a kampány struktúrát (hány kampány, milyen típus, milyen csatornán). | HIGH | A template-ben egy példa: 5 sor (Search remarketing, GDN prospecting, Meta remarketing, Meta traffic, Meta awareness). Az AI-nak a brief alapján hasonló struktúrát kell generálnia. |

### Differenciátorok

| Feature | Érték | Komplexitás | Megjegyzés |
|---------|-------|-------------|------------|
| **Versenytárs-elemzés szekció** | A brief-ben megadott versenytársak online hirdetési jelenlétének elemzése. Értékes kontextus a PM-nek. | MEDIUM | Az LLM tudásából -- nincs élő scraping. "A [versenytárs] jellemzően Meta és Google Display csatornákon hirdet, erős szezonális kampányokkal." |
| **Iparág-specifikus benchmark alkalmazás** | A KPI becslések ne generikusak legyenek, hanem az ügyfél iparágához igazítsanak. Pl. e-commerce vs. B2B SaaS nagyon más CPL. | MEDIUM | Prompt engineering: az AI-nak az iparágat is figyelembe kell vennie a becslésekhez. |
| **Magyar piac árszintek** | Az AI a magyar piaci árszinteket alkalmazza (nem USA CPM-eket). | LOW | Prompt-szintű: explicit kérés hogy HUF-ban, magyar piaci benchmark-okkal becsüljön. |

### Anti-Feature

| Anti-Feature | Miért kerülni | Alternatíva |
|--------------|---------------|-------------|
| **Élő platform API hívások (Google/Meta/TikTok API)** | A hirdetési platform API-khoz hozzáférés kell, OAuth, account ID-k -- az ügyfélnek nincs hozzáférése, a rendszernek sincs. Hatalmas scope creep. | Az AI a tudásából becsül. A PM manuálisan finomítja a mediaplan-t. A cél az "első draft", nem a végleges terv. |
| **Automatikus bid/budget optimalizáció** | A valós idejű optimalizáció egy teljesen más product (DSP, campaign manager). | A brief asszisztens a TERVEZÉSI fázist automatizálja, nem a FUTTATÁSI fázist. |
| **Pontos ROI garancia/előrejelzés** | Az AI becslései tájékoztató jellegűek. Ha a rendszer "garantált ROAS" számokat ad, jogi és bizalmi kockázat. | Explicit disclaimer: "Becsült értékek iparági benchmark-ok alapján. A tényleges eredmények eltérhetnek." |

---

## Capability 4: Xlsx generálás (Agency Brief + Mediaplan)

### Kontextus

Két xlsx fájl generálása a ROI Works template-ek alapján:
1. **Agency Brief xlsx** (`ROIworks _ TEMPLATE_ Agency campaign brief.xlsx`) -- az ügyfél adataival kitöltve
2. **Mediaplan all channels xlsx** (`ROIworks _ TEMPLATE_ Mediaplan all channels.xlsx`) -- az AI kutatás eredményeivel kitöltve

### Template struktúra analízis

**Agency Brief xlsx:**
- Egyetlen sheet (Sheet1)
- Fix layout: label-ek az A oszlopban, értékek a B-E oszlopokban
- Checkbox-ok FALSE/TRUE értékekkel (B-E oszlopok, soronként 2-4 checkbox)
- Összevont cellák (merged cells) a fejlécekhez
- Formázás: ROI Works arculat (színek, betűtípus)

**Mediaplan all channels xlsx:**
- Egyetlen sheet (Media_plan)
- Fejléc blokk: ROIworks cégadatok + partner (ügyfél) adatok + kampány név + időszak + keretösszeg
- PPC MARKETING szekció: táblázat (kampány cél, típus, csatorna, hirdetés típus, dátum, metrikák, költségek)
- eDM szekció: hasonló struktúra más metrikákkal
- Egyéb média szekció: egyszerűbb sorok
- Gyártás szekció: megnevezés + részletek + ár
- Ügynökségi díj: százalékos számítás
- TELJES KAMPÁNY BUDGET sor: összesítés

### Table Stakes

| Feature | Miért szükséges | Komplexitás | Megjegyzés |
|---------|----------------|-------------|------------|
| **Agency Brief xlsx kitöltés template-ből** | A meglévő xlsx template betöltése, az ügyfél adataival kitöltése, formázás megőrzése. | MEDIUM | Lib választás: `xlsx-populate` az ideális (template betöltés + formázás megőrzés). A cellák fix pozíciókon vannak a template-ben, cell reference-ekkel címezhető. |
| **Mediaplan xlsx kitöltés template-ből** | A meglévő xlsx template betöltése, az AI kutatás adataival kitöltése. A fejléc (partner adatok, kampány név, időszak, keretösszeg) + a PPC táblázat sorai. | HIGH | A PPC szekció DINAMIKUS -- az AI generál N sort, a template-ben csak example sorok vannak. A sorok beszúrása formázással együtt trükkös. |
| **Checkbox kezelés az Agency Brief-ben** | A template TRUE/FALSE értékekkel jelzi a checkbox-okat (csatornák, KPI-k, kreatív típusok). Az AI-tól kapott adatokból ezeket kell kitölteni. | LOW | Egyszerű boolean mapping: ha az ügyfél választotta a Facebook ads-t, az adott cella TRUE-ra áll. |
| **Összeg számítások a Mediaplan-ban** | A template-ben összegző sorok vannak ("PPC MARKETING ÖSSZESEN", "TELJES KAMPÁNY BUDGET"). Ezeknek az AI-generált sorok összegeit kell tartalmazniuk. | MEDIUM | Formulák (SUM) vagy explicit számított értékek. A formula megőrzés xlsx-populate-tal lehetséges. |

### Differenciátorok

| Feature | Érték | Komplexitás | Megjegyzés |
|---------|-------|-------------|------------|
| **Dinamikus PPC sor generálás** | Az AI nem fix 5 sort generál, hanem a kampány komplexitásához igazítja a sorok számát (3-15 sor). | HIGH | A template-ben a PPC szekció sorait törölni/beszúrni kell. Az xlsx-populate row manipulation API-jával lehetséges, de a formázás másolása soronként szükséges. |
| **Ügynökségi díj automatikus számítás** | Az xlsx-ben "15%, Mass médiára vonatkozóan" -- automatikusan számított a PPC összesítőből. | LOW | Egyszerű számítás: PPC_total * 0.15 (vagy konfigurálható %). |

### Anti-Feature

| Anti-Feature | Miért kerülni | Alternatíva |
|--------------|---------------|-------------|
| **Xlsx generálás from scratch (template nélkül)** | ExcelJS-sel nulláról felépíteni az xlsx-t rengeteg formázási munka (merged cells, színek, betűméret, oszlopszélesség). A ROI Works design-ja pixel-perfect kell legyen. | Template-alapú megközelítés: a template-t betöltjük, csak az értékeket írjuk bele. A formázás a template-ből jön. |
| **Xlsx szerkesztő az UI-ban** | Az ügyfélnek nem kell xlsx-t szerkesztenie. A PM Excelben nyitja meg és finomítja. | A generált xlsx a PM-nek megy emailben. |
| **PDF konverzió az xlsx-ből** | Az xlsx-ek nem kell PDF-ek is legyenek. A PM xlsx-ben dolgozik tovább. | Két output: PDF az ügyfélnek (meglévő @react-pdf/renderer), xlsx a PM-nek. |

---

## Capability 5: PM email xlsx csatolmányokkal

### Kontextus

Az AI kutatás és xlsx generálás után a kitöltött fájlokat el kell küldeni a ROI Works projekt menedzsernek. A v1.0 SendGrid integráció már működik (PDF csatolmánnyal küld emailt).

### Table Stakes

| Feature | Miért szükséges | Komplexitás | Megjegyzés |
|---------|----------------|-------------|------------|
| **Xlsx fájlok email csatolmányként** | A SendGrid API támogatja a többszörös csatolmányt. A meglévő send-brief route-ot kell bővíteni. | LOW | A v1.0 `send-brief` route már base64-ben csatol PDF-et. Ugyanez xlsx-ekkel: `content: xlsxBase64, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"`. |
| **Két xlsx fájl csatolása** | Agency Brief xlsx + Mediaplan xlsx. | LOW | Mindkét buffer-t base64-re konvertálni, hozzáadni az attachments tömbhöz. |
| **Email tartalom bővítés** | Az email bodynak tartalmaznia kell az ügyfél nevét, kampány nevét, rövid összefoglalót. | LOW | A meglévő `generateEmailHtml` bővítése. |
| **Háttérben futtatás (fire-and-forget)** | Az AI kutatás + xlsx generálás + email küldés az ügyfél jóváhagyása után háttérben történik. Az ügyfél NEM vár rá. | MEDIUM | Next.js API route-ból indítva. A kihívás: a Vercel serverless function timeout (10s free, 60s pro). Az AI kutatás + xlsx generálás + email küldés 10s alatt kell legyen, vagy több lépcsős megoldás kell. |

### Differenciátorok

| Feature | Érték | Komplexitás | Megjegyzés |
|---------|-------|-------------|------------|
| **Email subject és body az ügyfél adataival** | "Kampány Brief: [Cégnév] - [Kampány neve]" + strukturált összefoglaló az email body-ban. | LOW | Meglévő pattern bővítése. |

### Anti-Feature

| Anti-Feature | Miért kerülni | Alternatíva |
|--------------|---------------|-------------|
| **Email küldés az ügyfélnek is** | A v1.1-ben az xlsx-ek belső dokumentumok, nem az ügyfél kapja. Az ügyfél a PDF-et tölti le a jóváhagyó képernyőn. | Az ügyfél PDF-et kap (letöltés), a PM xlsx-eket kap (email). |
| **Webhook / Slack / CRM integráció** | Premature -- a SendGrid email a legegyszerűbb csatorna. Ha a PM Slack-et preferálja, az v2-ben jöhet. | Email-first. |

---

## Capability összefüggések (Dependencies)

```
[1. Bővített adatgyűjtés]
    |
    +--kiterjeszti--> BriefBase séma (Zod)
    +--módosítja--> AI promptok (questioning)
    +--módosítja--> update_brief tool (új mezők)
    |
    v
[2. Jóváhagyási flow]
    |
    +--átalakítja--> BriefEditor (read-only + jóváhagyás + visszatérés)
    +--módosítja--> brief/page.tsx (állapotgép: chat -> review -> approved)
    +--eltávolítja--> email cím bekérés, email küldés gomb
    +--hozzáad--> "Köszönjük" képernyő
    |
    v
[3. AI háttérkutatás]
    |
    +--függ--> jóváhagyott briefData (capability 2 outputja)
    +--hozzáad--> új API route: /api/research (Claude API hívás)
    +--generálja--> ResearchData struktúra (channel mix, KPI-k, targeting, sorok)
    |
    v
[4. Xlsx generálás]
    |
    +--függ--> ResearchData (capability 3 outputja)
    +--függ--> briefData (capability 1 outputja)
    +--hozzáad--> xlsx-populate dependency
    +--betölti--> template xlsx fájlok (/docs/ROI_Mediaplan/)
    +--generálja--> kitöltött Agency Brief xlsx + Mediaplan xlsx (Buffer-ek)
    |
    v
[5. PM email]
    |
    +--függ--> xlsx Buffer-ek (capability 4 outputja)
    +--módosítja--> send-brief API route (xlsx csatolmányok)
    +--meglévő--> SendGrid integráció
```

### Kritikus szekvencia

A capability-k **szigorúan sorrendben** függenek egymástól:
1. Séma bővítés KELL HOGY megelőzze a promptot (az AI-nak tudnia kell milyen mezőket gyűjtsön)
2. Jóváhagyási flow KELL HOGY megelőzze az AI kutatást (a kutatás inputja a jóváhagyott brief)
3. AI kutatás KELL HOGY megelőzze az xlsx generálást (az xlsx tartalma a kutatás eredménye)
4. Xlsx generálás KELL HOGY megelőzze az emailt (az email csatolmánya az xlsx)

A párhuzamosítási lehetőség minimális. Kivétel: a séma bővítés és a jóváhagyási flow UI munkák részben párhuzamosíthatók.

---

## MVP ajánlás

### Prioritás 1 (v1.1 must-have)

1. **Séma bővítés** -- Agency Brief xlsx mezőire (Zod séma + prompt)
2. **Jóváhagyási flow** -- BriefEditor átalakítás, email eltávolítás, "Jóváhagyom" gomb
3. **AI háttérkutatás** -- Channel mix + KPI becslés + targeting (egyetlen Claude API hívás)
4. **Agency Brief xlsx kitöltés** -- Template betöltés, ügyfél adatok beírása
5. **Mediaplan xlsx kitöltés** -- Template betöltés, AI kutatás adatok beírása (fejléc + PPC sorok)
6. **PM email** -- Két xlsx csatolmány küldése

### Halasztandó (v1.2+)

- **eDM szekció a Mediaplan-ban** -- nem minden kampányhoz releváns, a PPC szekció a fő prioritás
- **Egyéb média / Gyártás szekciók** -- manuálisan tölti a PM
- **Versenytárs-elemzés részletes szekció** -- az AI rövid megjegyzésként belefoglalhatja a targeting javaslatokba

---

## Komplexitás összesítés

| Capability | Összesített komplexitás | Fő kockázat |
|------------|------------------------|-------------|
| 1. Bővített adatgyűjtés | LOW-MEDIUM | Prompt méret/minőség ~25 mezővel |
| 2. Jóváhagyási flow | MEDIUM | Állapotgép átstrukturálás (chat->review->approved->done) |
| 3. AI háttérkutatás | HIGH | AI output struktúra validáció, HUF benchmark pontosság |
| 4. Xlsx generálás | HIGH | Dinamikus sor beszúrás formázással, template manipulation |
| 5. PM email | LOW | Meglévő pattern, minimális bővítés |

**Legkockázatosabb**: Capability 3 (AI kutatás) es Capability 4 (xlsx generálás). Az AI kutatás kimenetének determinisztikusnak kell lennie ahhoz, hogy az xlsx template-et megbízhatóan kitöltse. Ha az AI nem strukturált JSON-t ad vissza, az xlsx generálás elbukik.

---

## Sources

- ROI Works Agency Brief xlsx template analízis (`docs/ROI_Mediaplan/ROIworks _ TEMPLATE_ Agency campaign brief.xlsx`) -- HIGH confidence (elsődleges forrás)
- ROI Works Mediaplan xlsx template analízis (`docs/ROI_Mediaplan/ROIworks _ TEMPLATE_ Mediaplan all channels.xlsx`) -- HIGH confidence (elsődleges forrás)
- [xlsx-populate -- npm](https://www.npmjs.com/package/xlsx-populate) -- HIGH confidence (hivatalos npm csomag)
- [xlsx-populate GitHub](https://github.com/dtjohnson/xlsx-populate) -- HIGH confidence (hivatalos repo, template filling docs)
- [xlsx-template -- npm](https://www.npmjs.com/package/xlsx-template) -- MEDIUM confidence (alternatíva, kisebb community)
- [Capably.ai -- Media Planning Automation](https://www.capably.ai/resources/media-planning-automation) -- MEDIUM confidence (iparági trend)
- [TAU Marketing Solutions -- AI Agents in Media Planning](https://taums.ai/ai-agents-in-media-planning-and-buying/) -- MEDIUM confidence (iparági trend)
- [AdAmigo -- KPIs for Cross-Platform Ad Benchmarking](https://www.adamigo.ai/blog/top-7-kpis-for-cross-platform-ad-benchmarking) -- MEDIUM confidence (benchmark adatok)
- [AI Digital -- 15 Essential Digital Marketing KPIs 2026](https://www.aidigital.com/blog/digital-marketing-kpi) -- MEDIUM confidence
- [Planable -- Marketing Approval Process 2026](https://planable.io/blog/marketing-approval-process/) -- MEDIUM confidence (UX patterns)
- [NN/G -- Confirmation Dialogs](https://www.nngroup.com/articles/confirmation-dialog/) -- HIGH confidence (UX best practices)
- [Material Design -- Confirmation & Acknowledgement](https://m2.material.io/design/communication/confirmation-acknowledgement.html) -- HIGH confidence (design pattern)

---
*Feature research: v1.1 Enhanced Brief + AI Research*
*Researched: 2026-02-12*
