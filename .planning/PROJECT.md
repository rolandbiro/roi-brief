# ROI Brief Assistant v2

## What This Is

A ROI Works marketing ügynökség ajánlatadás előtti brief asszisztense, ahol egy AI chatbot nulláról kérdezi ki az érdeklődőt kampánytípus-specifikus kérdésekkel. Az érdeklődő direkt linkről érkezik, nincs PDF feltöltés — tisztán chat alapú interakció, ami végén dinamikus riport generálódik.

## Core Value

Az AI asszisztens kampánytípustól függően releváns, szakmai mélységű kérdéseket tesz fel — nem sablonos, hanem adaptív kikérdezést végez, ami profi brieffé áll össze.

## Requirements

### Validated

- ✓ Chat alapú AI kikérdezés Claude API-val — existing
- ✓ Streaming válaszok — existing
- ✓ Brief riport szerkesztése (BriefEditor) — existing
- ✓ Email küldés SendGrid-en keresztül — existing
- ✓ PDF generálás (@react-pdf/renderer) — existing
- ✓ Magyar nyelvű UI és kommunikáció — existing
- ✓ ROI Works arculat (narancs/kék/szürke, Archivo betűtípus) — existing
- ✓ Vercel deployment — existing

### Active

- [ ] Kampánytípus-specifikus kikérdezés (médiavásárlás, performance, brand, social)
- [ ] Multi-típus támogatás (egy brief több kampánytípust fedhet le)
- [ ] Adaptív kérdezési logika (mélyít ha vékony a válasz, átugorja ha már kiderült)
- [ ] Szakmai mélységű kérdések típusonként (pl. GRP, reach, frequency médiavásárlásnál)
- [ ] PDF feltöltés eltávolítása — direkt link, chat-only belépés
- [ ] Dinamikus riport szekciók (csak releváns szekciók a típusnak megfelelően)
- [ ] Flexibilis BriefData struktúra (típusfüggő mezők)
- [ ] Brief sablonok beépítése tudásbázisként (docs/demand)
- [ ] ROI Works arculati útmutató alkalmazása a riporton
- [ ] PDF letöltés funkció az érdeklődőnek

### Out of Scope

- PDF feltöltés / ajánlat elemzés — a v2 ajánlatadás előtti, nem utáni
- Felhasználói fiók / bejelentkezés — anonim session marad
- Conversation history / draft mentés — későbbi iteráció
- Multi-language támogatás — csak magyar
- Beágyazás (iframe/widget) — direkt link marad
- Analytics / monitoring — későbbi iteráció

## Context

**Jelenlegi rendszer problémái:**
1. **Nem adaptálódik**: Ugyanazokat a kérdéseket teszi fel függetlenül a kampánytípustól
2. **Nem mélyít**: Nem kérdez vissza, ha vékony a válasz
3. **Rossz sorrend**: Túl korán kérdez részleteket, mielőtt a nagy képet értené
4. **Hiányzó szakkikérdezés**: Pl. médiavásárlásnál nem kérdez GRP-t, reach-et, frekvenciát

**Jelenlegi prompt (`lib/prompts.ts`)**: Fix 13 mezős sorrend, generikus "lehetséges válaszok" minden kérdéshez — ez a fő gyenge pont.

**Kampánytípusok és specifikus kérdéseik:**
- **Médiavásárlás**: GRP, reach, frequency, médiatípusok, OTS, adblocking, viewability
- **Performance (PPC)**: Landing page, hirdetési fiókok, mérés beállítás, kreatív timeline, konverziók, ROAS/CPA target
- **Brand / Awareness**: Brand lift, üzenetrecall, kreatív koncepció, tonality, positioning
- **Social media**: Organikus/paid mix, platformok, tartalom típusok, community management, influencer

**Elérhető brief sablonok (docs/demand/):**
- `Agency brief template-2.xlsx` — generikus agency brief
- `ROI Kampány BRIEF _ PLAN _TEMPLATE sablon.xlsx` — PPC specifikus brief (részletesebb: landing page, fiókok, mérés)
- `design_kerdesek_roi.docx` — design/arculat/website brief kérdések (külön domain)

**ROI Works arculat (docs/demand/roi_arculat_2026.pdf):**
- Elsődleges színek: Narancs (#FF6400), Kék (#0022D2), Szürke (#E3E3E3), Fekete (#3C3E43)
- Betűtípus: Archivo (elsődleges), Archivo SemiExpanded (headline), Arial (másodlagos)

**Tech stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Claude API, SendGrid, @react-pdf/renderer, Vercel

## Constraints

- **Tech stack**: Maradunk a jelenlegi Next.js + Claude API + SendGrid stacknél
- **Arculat**: ROI Works brand guidelines szerint (narancs/kék/szürke, Archivo)
- **Nyelv**: Magyar nyelvű UI és AI kommunikáció, magázódás
- **Anonim**: Nincs auth, nincs persistent storage — session-based marad
- **Kompatibilitás**: A meglévő email küldés és PDF generálás megmarad

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PDF feltöltés eltávolítása | Ajánlatadás előtti flow, nincs mit feltölteni | — Pending |
| Prompt alapú típusdetekció | AI az első pár kérdésből következtet típust, megerősítteti | — Pending |
| Flexibilis BriefData | Fix struktúra nem skálázik multi-típusra | — Pending |
| Sablonokból indulunk, iterálunk | docs/demand sablonok mint kiindulópont, gyakorlatban finomhangolás | — Pending |
| Dinamikus riport szekciók | Csak releváns szekciók jelennek meg típustól függően | — Pending |

---
*Last updated: 2026-02-10 after initialization*
