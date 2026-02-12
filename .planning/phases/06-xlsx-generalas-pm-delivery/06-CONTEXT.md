# Phase 6: Xlsx generálás és PM delivery - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<domain>
## Phase Boundary

A rendszer programmatikusan kitölti az Agency Brief és Mediaplan xlsx template-eket a brief adatokkal és az AI kutatás eredményeivel, majd emailben elküldi a PM-nek. Hiba esetén a PM értesítést kap retry lehetőséggel. Az xlsx template-ek a `docs/ROI_Mediaplan/` mappából jönnek, a kutatási eredmények a `ResearchResults` interface-ből.

</domain>

<decisions>
## Implementation Decisions

### PM email tartalom
- Subject line formátum: „Új brief: [Ügyfél neve] — [Kampány neve]"
- Email body: rövid összefoglaló (3-5 sor) — ügyfél neve, kampány cél, büdzsé, időszak — alatta a csatolt xlsx
- Plain text formátum (nem HTML)
- A kutatási források (URL-ek) az email body-ban jelennek meg, nem az xlsx-ben
- 1 db kombinált xlsx melléklet (Agency Brief + Mediaplan külön sheet-eken)

### KPI értékek megjelenítése
- Csak a "likely" érték kerül a meglévő template oszlopba — a template-ek nem módosulnak (plan-phase checkpoint döntés: 2026-02-12)
- Ha egy KPI metrika nem releváns (pl. CPA awareness kampánynál): üres cella
- Nincs AI-becslés jelölés — a PM tudja, hogy az AI tölti ki

### Hibaértesítés a PM-nek
- Közepes részletesség: melyik lépés bukott el (kutatás vs xlsx generálás) + mi a teendő
- Részleges siker: ami elkészült, azt elküldi + jelzi, mi hiányzik
- Retry link az email-ben — a PM újra tudja futtatni a feldolgozást
- Plain text formátum (konzisztens a sikeres email-lel)

### PM címzett beállítás
- Egyelőre env változóból (PM_EMAIL) — később admin felületről konfigurálható
- Feladó: info@valueonboard.com
- Több PM támogatás: fő címzett + opcionális CC címek
- SendGrid marad (már konfigurálva van a projektben)

### Claude's Discretion
- Xlsx library kiválasztása (ExcelJS, SheetJS, stb.)
- Template formázás megőrzésének technikai megoldása
- Retry link implementáció (egyedi token, session ID, stb.)
- Email szöveg pontos megfogalmazása

</decisions>

<specifics>
## Specific Ideas

- 5 xlsx template létezik a `docs/ROI_Mediaplan/` mappában: 1 Agency Brief + 4 Mediaplan variáns (all channels, PPC traffic, PPC reach, PPC mixed)
- A `ResearchResults.template_type` határozza meg, melyik Mediaplan template-et kell használni
- A feladó email (`info@valueonboard.com`) SendGrid-ben kell verifikálni (Domain Authentication vagy Single Sender Verification)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-xlsx-generalas-pm-delivery*
*Context gathered: 2026-02-12*
