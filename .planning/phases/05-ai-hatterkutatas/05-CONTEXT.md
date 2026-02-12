# Phase 5: AI háttérkutatás - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<domain>
## Phase Boundary

A szerver a jóváhagyott brief alapján háttérben (fire-and-forget) AI kutatást futtat. Három fő output: csatorna mix javaslat, targeting ajánlások, és KPI becslések — strukturált formátumban, ami közvetlenül mappelhető az xlsx template mezőire. Az ügyfélnek nem kell várnia, a PM kapja meg az eredményt (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Csatorna mix logika
- Kampánycél alapú szűrés: először a brief-ben megadott kampánycél határozza meg a releváns csatornákat, utána a büdzsé szűri a megvalósíthatóságot
- Nincs fix csatornaszám korlát — az AI a brief alapján dönti el, hány csatorna releváns
- Szabad csatorna javaslat — az AI bármit javasolhat ami releváns (nem csak Google/Meta/TikTok), kivéve ha az xlsx template-ek fixálják a csatorna listát (a researcher ellenőrizze)

### Targeting mélység
- A brief-ben megadott célpiac(ok) határozzák meg a lokalizációt — magyar kampányhoz magyar piaci adatok, multi-country esetén az adott piac(ok) specifikus adatai
- Több ország esetén Claude dönt: kevés ország → országonként külön targeting, sok ország → regionális összevonás

### KPI becslés megközelítés
- Tartomány + ajánlott érték: min-max tartomány és egy kiemelt "valószínű" érték
- Kampánycéltól függő metrikák: Awareness kampánynak Reach/Frequency, Conversion kampánynak CPA/ROAS — adaptív metrika készlet, nem fix lista
- Csatornánkénti részletezés + kampány szintű összegzés — mindkét szinten

### Claude's Discretion
- Büdzsé elosztás formátuma (százalék, Ft, vagy mindkettő)
- Targeting részletesség (téma szintű vs konkrét szegmens nevek — brief alapján)
- Platformonkénti vs összevont targeting struktúra
- Konzervatív vs reális becslés megközelítés
- Web search típusok (benchmark, versenytárs, trend — brief alapján)
- Web search hívások száma (költség/minőség egyensúly)
- Forrás hivatkozások szükségessége
- Hiányzó adatok kezelése (becslés jelzéssel vs üresen hagyás)

</decisions>

<specifics>
## Specific Ideas

- Az xlsx template-ek (docs/ROI_Mediaplan/) struktúrája határozza meg az output formátumot — a researcher vizsgálja meg a template-eket, hogy a ResearchResults interface pontosan illeszkedjen
- Az approve API már létezik fire-and-forget placeholder-rel (app/api/approve/route.ts) — ide kell bekötni a research pipeline-t
- Több mediaplan template létezik kampánytípusonként (PPC only Traffic, PPC only Reach, All channels) — a research pipeline-nak a brief alapján kell kiválasztania a megfelelő template típust

</specifics>

<deferred>
## Deferred Ideas

None — a megbeszélés a fázis scope-ján belül maradt

</deferred>

---

*Phase: 05-ai-hatterkutatas*
*Context gathered: 2026-02-12*
