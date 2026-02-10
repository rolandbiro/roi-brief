# Phase 3: Dynamic Report & Branding - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>
## Phase Boundary

A brief riport dinamikusan alkalmazkodik a kampánytípus(ok)hoz, ROI Works arculatban jelenik meg, és az érdeklődő le tudja tölteni PDF-ben. A chat utáni flow: read-only áttekintés → jóváhagyás → email (ROI-nak) + PDF letöltés.

</domain>

<decisions>
## Implementation Decisions

### Riport struktúra
- Executive summary az elején — hasonló formátumban mint amit a chat jelenleg ad (kampány neve, cél, budget, target CPA, platform, tartalom, szolgáltatások, technikai infó)
- Multi-típus brief: Claude dönti el a legjobb struktúrát (közös fejléc + külön szekciók vs. témakörönként összevonva)
- Szekciók sorrendje: Claude optimalizálja típusonként
- Üres mezők (amit az érdeklődő nem mondott el) NEM jelennek meg — csak az derül ki amit mondott

### Brief áttekintés (korábban BriefEditor)
- **Read-only nézet** — nem szerkeszthető editor, hanem strukturált áttekintés a chat-ből gyűjtött adatokról
- Az érdeklődő a chat végén „Brief áttekintése" gombbal jut ide (nem automatikus átirányítás)
- Elérhető akciók: „Jóváhagyás és küldés" + „PDF letöltés" (nincs „vissza a chatbe" és „link másolás")
- Ha valami nem stimmel, az érdeklődő a chatben javítja (nem az editorban)
- Email cím mező a jóváhagyás oldalon — az érdeklődő itt adja meg

### PDF kinézet és arculat
- ROI Works arculati útmutató: `docs/demand/roi_arculat_2026.pdf` — ebből kell dolgozni
- Minden arculati elem használandó: logó, márka színek, Archivo betűtípus, egyéb grafikus elemek
- Hangvétel: barátságos, modern — tegező, közvetlen stílus (mint a chat)

### Letöltés és küldés flow
- Jóváhagyás gomb = email elmegy a ROI Works-nek + PDF letölthető egyben
- Email csak a ROI Works csapatnak megy (az érdeklődő nem kap email másolatot)
- Email cím az érdeklődőtől a jóváhagyás oldalon kérendő (nem a chatben)
- Jóváhagyás után: „Köszönjük!" siker oldal + PDF letöltés link

### Claude's Discretion
- Multi-típus brief szekció struktúra (közös fejléc + külön szekciók vs. témakör alapú)
- Szekciók sorrendje kampánytípusonként
- BriefEditor dinamikus mezőmegjelenítés logikája
- PDF layout részletei (margók, fejléc/lábléc, oldalszámozás)

</decisions>

<specifics>
## Specific Ideas

- A chat-összefoglaló formátuma jó referencia az executive summary-hoz (kampány neve, cél, budget, CPA, platform, tartalom, szolgáltatások, technikai)
- A BriefEditor eredeti terv → read-only áttekintés döntés, mert: (1) a chatben már korrigálhat, (2) szabad szerkesztésnél az érdeklődő beleírhatna hülyeségeket, (3) egyszerűbb fejlesztés
- PDF hangvétele illeszkedjen a chat tegező stílusához — ne legyen hivatalos/formális váltás

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-dynamic-report-branding*
*Context gathered: 2026-02-10*
