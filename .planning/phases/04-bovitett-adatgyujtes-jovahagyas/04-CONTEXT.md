# Phase 4: Bővített adatgyűjtés és jóváhagyás - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Az ügyfél a chatben természetes beszélgetésben megadja az Agency Brief összes üzleti adatát, áttekinti az összegyűjtött információkat read-only összefoglalóként, és jóváhagyással elindítja a háttérfeldolgozást. A jóváhagyás után PDF letöltés + köszönő oldal, session vége.

Kizárólag kliens-oldali munka: kibővített chat kikérdezés + jóváhagyási flow. Az AI kutatás (Phase 5) és xlsx generálás (Phase 6) nem része ennek a fázisnak.

</domain>

<decisions>
## Implementation Decisions

### Kikérdezés stratégia
- Az összes kérdést (régi v1.0 + új Agency Brief) teljesen újraszervezzük egy logikus sorrendbe az Agency Brief struktúra mentén
- Nyitás: cég/márka bemutatással indul ("Mesélj a cégről, a termékről/szolgáltatásról") — nem a kampány céllal
- Átfedések kezelése: Claude döntése — lényeg, hogy ne kérdezzen rá kétszer ugyanarra (régi kampány-specifikus + új Agency Brief mezők összeolvasztása)
- Extrakció mélysége: Claude döntése — mezőtípustól függően kezeli, mikor kell visszakérdezni részletekre és mikor elég az automatikus kinyerés

### Jóváhagyási képernyő
- A jóváhagyási képernyő read-only összefoglaló — az ügyfél NEM szerkeszthet rajta, csak áttekinti
- Ha módosítani akar, visszamegy a chatbe és ott az AI segítségével korrigál, majd újra megjeleníti az összefoglalót
- A vizuális layout Claude döntése (a ~25 mező áttekinthető megjelenítése)
- Kizárólag a chatből extractált ügyfél-adatokat mutatja — kutatási eredmények nem szerepelnek

### Záró flow
- Kétlépéses jóváhagyás: először "Jóváhagyom" gomb, utána külön "PDF letöltése" gomb a köszönő oldalon
- Köszönő oldal: köszönet + PDF letöltési link + rövid üzenet, hogy a PM hamarosan felveszi a kapcsolatot — session vége
- A jóváhagyás háttérben triggereli a Phase 5 kutatást (fire-and-forget) — technikai megvalósítás Claude döntése (Next.js after() vagy hasonló)

### Kontakt adatok
- Kontakt adatokat (email, telefon) NEM kérünk be — a PM már ismeri az ügyfelet, aki korábban megkereste a ROI Works-öt
- Bekérjük: cégnév (kötelező) + kapcsolattartó neve — a PM ebből azonosítja a brief-et
- DATA-05 requirement módosul: kontakt adatok kihagyva, helyette cégnév + kapcsolattartó neve elegendő

### Séma és adatmodell
- Az Agency Brief xlsx template alapján bővül a BriefData Zod séma (docs/ROI_Mediaplan/ mappából)
- Kötelező mezők: cégnév + kampány célja — ezek nélkül nem lehet jóváhagyni
- Többi mező opcionális — az AI gyűjti amit tud, de nem blokkol ha valami hiányzik
- Checkbox jellegű mezők (csatornák, KPI-k, kreatív típusok, nem) kezelése Claude döntése
- "Technikai követelmények" és "Belső jóváhagyási folyamatok" mezők kezelése Claude döntése (valószínűleg nem releváns az ügyfélnek)

### Claude's Discretion
- Kikérdezés során az átfedések és extrakció mélységének kezelése
- Jóváhagyási képernyő vizuális layoutja (~25 mező áttekinthetően)
- Visszamódosítás interakciós mintája (chat ↔ összefoglaló)
- Checkbox mezők megjelenítése a BriefEditorban
- Technikai/admin mezők relevanciájának eldöntése
- Háttér trigger technikai megvalósítása

</decisions>

<specifics>
## Specific Ideas

- Az Agency Brief xlsx template szekciói a referencia a kikérdezés és megjelenítés sorrendjéhez: Alapvető info → Kampány részletek → Kampány célja → Célcsoport → Időzítés → Költségvetés → Versenytársak → Egyéb
- A PM és főnöke email címe környezeti változóból jöjjön (PHASE 6 relevancia, de a konfiguráció most kerüljön tervezésbe)
- Az ügyfél nem kap emailt — letölti a PDF-et és kész

</specifics>

<deferred>
## Deferred Ideas

- PM + főnök email címek környezeti változóként → Phase 6 (Xlsx generálás és PM delivery) tervezi meg
- Hibaértesítés a PM-nek ha a háttérfeldolgozás hibázik → Phase 6

</deferred>

---

*Phase: 04-bovitett-adatgyujtes-jovahagyas*
*Context gathered: 2026-02-12*
