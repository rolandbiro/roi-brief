# Phase 1: Type System & Foundation - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>
## Phase Boundary

A rendszer ismeri a 4 kampánytípust (médiavásárlás, performance/PPC, brand/awareness, social media), Zod sémákból építkezik, és az érdeklődő direkt linkről egyből chatbe érkezik. PDF feltöltés eltávolítva. Moduláris prompt rendszer és structured output a regex-alapú JSON parsing helyett.

</domain>

<decisions>
## Implementation Decisions

### Belépési élmény
- Landing szekció + chat layout: felső hero szekció, alatta/mellette a chat felület
- Hero tartalom: rövid értékajánlat (mi ez, hogyan működik, miért jó — 3 pontos struktúra) + adatkezelési irányelvek elfogadása
- Adatkezelés: kötelező checkbox + link az adatkezelési tájékoztatóra, checkbox nélkül nem indul a chat
- Mobil: hero felcsúsztatható — először a hero látszik, CTA-ra kattintva/lefelé scrollva a chat kitölti a képernyőt

### Kampánytípusok és adatmezők
- 4 típus megerősítve: Médiavásárlás, Performance/PPC, Brand/Awareness, Social Media
- Bővebb base mezők: cégnév, iparág, kampány célja, időzítés, büdzsékeret, célcsoport + meglévő anyagok, korábbi kampány tapasztalatok, versenytársak
- Típusspecifikus mezők számossága és tartalma: Claude's Discretion (a requirements TYPE-04 alapján dolgozza ki)
- Nincs extra must-have mező a requirements-en túl

### AI hangvétel és bemutatkozás
- Megszólítás: kontextusfüggő — alapból magáz, de ha az érdeklődő tegez, átváll tegezésre
- Személyiség: barátságos segítő — kedves, türelmes, könnyedebb hang, nem nyomasztó
- Bemutatkozás: ROI Works névvel — "Üdvözöljük! A ROI Works brief asszisztense vagyok..."
- Szakmai mélység: szakmai de nem ijesztő — használ szakmai kifejezéseket, de megmagyarázza ha kell (az érdeklődő nem feltétlen szakember)

### Claude's Discretion
- Típusspecifikus mezők pontos listája és részletessége (TYPE-04 alapján)
- Chat felület pontos kinézete és spacing
- Hero szekció vizuális design
- Mobile átmeneti animáció
- AI bemutatkozó üzenet pontos szövege

</decisions>

<specifics>
## Specific Ideas

- Adatkezelési checkbox kötelező a chat indításhoz — GDPR compliance
- Az AI alkalmazkodik az érdeklődő megszólítási stílusához (tegez/magáz detektálás)
- A hero 3 pontos értékajánlata rövid és lényegretörő legyen

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-type-system-foundation*
*Context gathered: 2026-02-10*
