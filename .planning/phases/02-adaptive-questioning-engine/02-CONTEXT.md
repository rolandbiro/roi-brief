# Phase 2: Adaptive Questioning Engine - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Az AI felismeri a kampánytípust az érdeklődő válaszaiból, megerősítteti, és típusspecifikus, adaptív kérdéseket tesz fel. A beszélgetés során strukturáltan gyűlik az adat, a végén összefoglalóval zárul. Quick-reply gombok segítik a válaszadást. Multi-típus brief is kezelhető egyetlen beszélgetésben.

Nem scope: PDF generálás, email küldés, BriefEditor szerkesztés (→ Phase 3), és az entry flow ami Phase 1-ben már kész.

</domain>

<decisions>
## Implementation Decisions

### Típusfelismerés élménye
- A jelenlegi nyitó üzenet marad (cégnév kérdéssel indul, nem kampánytípus-választóval)
- A típusdetektálás a beszélgetés során történik organikusan, nem upfront
- Ha az érdeklődő nem ért egyet a felismert típussal: az AI újrakezdés nélkül vált típust, az eddig összegyűjtött adatokat megtartja ami releváns

### Kérdezési stílus
- Tónus: baráti szakmai — tegező, közvetlen de professzionális, mint egy tapasztalt account manager
- Lezárás: az AI összefoglalja a briefet és megkérdezi "Ez így jó? Van még valami?" — csak utána zár

### Multi-típus kezelés
- Bármennyi típus kombinálható egyetlen briefben (mind a 4 is)
- Menet közben is hozzáadható új típus — ha az érdeklődő újat említ, az AI rugalmasan felveszi és kérdezi annak a kérdéseit is

### Claude's Discretion
- Típusmegerősítés módja és időzítése (explicit vs soft, hány válasz után)
- Visszakérdezés stratégia vékony válaszokra (kérdés fontossága alapján mérlegeli)
- Kérdések száma típusonként (típustól és válaszok mélységétől függően)
- Quick-reply gombok: mikor jelennek meg, technikai megvalósítás, kattintás viselkedés, szabad szöveg kezelés
- Multi-típus kérdéssorrend (szekvenciális vs kevert)
- Multi-típus összefoglaló struktúrája

</decisions>

<specifics>
## Specific Ideas

- A jelenlegi nyitó üzenet referencia: "Szia! A ROI Works brief asszisztense vagyok. Segítek összeállítani a kampány briefjét, hogy kollégáim a lehető legjobb ajánlatot tudják elkészíteni Neked. Kezdjük is – melyik cég nevében keresed meg az ügynökségünket?"
- Account manager feeling — az érdeklődő érezze hogy egy profi, de emberi beszélgetést folytat

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-adaptive-questioning-engine*
*Context gathered: 2026-02-10*
