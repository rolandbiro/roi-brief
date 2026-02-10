# Requirements: ROI Brief Assistant v2

**Defined:** 2026-02-10
**Core Value:** Az AI asszisztens kampánytípustól függően releváns, szakmai mélységű kérdéseket tesz fel — adaptív kikérdezés, ami profi brieffé áll össze.

## v1 Requirements

### Type System (TYPE)

- [ ] **TYPE-01**: AI felismeri a kampánytípust az érdeklődő válaszaiból (médiavásárlás, performance/PPC, brand/awareness, social media)
- [ ] **TYPE-02**: AI megerősítteti az érdeklődővel a detektált típust, mielőtt típus-specifikus kérdésekre vált
- [ ] **TYPE-03**: Egy brief egyszerre több kampánytípust is lefedhet (multi-típus)
- [ ] **TYPE-04**: Kampánytípusonként külön kérdéskészlet definiálva (médiavásárlás: GRP, reach, frequency; PPC: ROAS, CPA, landing page, fiókok; brand: lift, recall, positioning; social: organic/paid, platformok, influencer)

### Questioning (QUES)

- [ ] **QUES-01**: AI előbb a nagy képet érti meg (cél, típus, üzenet), utána kérdez részleteket — nem fix sorrend
- [ ] **QUES-02**: AI mélyít ha vékony a válasz (visszakérdez, konkretizál, példát kér)
- [ ] **QUES-03**: AI átugorja amit már megtudott korábbi válaszokból
- [ ] **QUES-04**: Típus-specifikus szakmai kérdések (pl. médiavásárlásnál médiatípusok, viewability; PPC-nél konverzió tracking, hirdetési fiókok)
- [ ] **QUES-05**: Quick-reply gombok a chat-ben (előre definiált válaszlehetőségek a kérdés típusától függően)

### Entry Flow (FLOW)

- [ ] **FLOW-01**: Érdeklődő direkt linkről érkezik, egyből a chatbe (nincs PDF feltöltés)
- [ ] **FLOW-02**: PDF feltöltés és kapcsolódó logika eltávolítva (PdfUpload, sessionStorage, /api/parse-pdf)
- [ ] **FLOW-03**: Home page átalakítva: üdvözlő szöveg + chat indítás

### Report (REPT)

- [ ] **REPT-01**: Dinamikus riport szekciók — csak a releváns szekciók jelennek meg a kampánytípus(ok)nak megfelelően
- [ ] **REPT-02**: Multi-típus brief esetén minden típusnak saját szekciója van a riportban
- [ ] **REPT-03**: BriefEditor dinamikusan megjeleníti a típus-specifikus mezőket (szerkeszthető)
- [ ] **REPT-04**: PDF letöltés funkció az érdeklődőnek (a dinamikus riportból)
- [ ] **REPT-05**: Email küldés a dinamikus riporttal (ROI csapatnak)

### Technical Foundation (TECH)

- [ ] **TECH-01**: Zod sémák definiálják a BriefData struktúrát (base + típus-specifikus kiterjesztések)
- [ ] **TECH-02**: Claude structured outputs a törékeny BRIEF_JSON_START/END regex helyett
- [ ] **TECH-03**: Moduláris prompt rendszer (base prompt + típusonkénti prompt modulok, dinamikus összeállítás)
- [ ] **TECH-04**: Anthropic SDK upgrade (structured outputs GA támogatás)
- [ ] **TECH-05**: Flexibilis BriefData típus (BriefBase + opcionális típus-specifikus blokkok)

### Branding (BRND)

- [ ] **BRND-01**: ROI Works arculat alkalmazva a riporton (narancs #FF6400, kék #0022D2, szürke #E3E3E3)
- [ ] **BRND-02**: Archivo betűtípus használata a PDF riportban

## v2 Requirements

### UX Enhancement

- **UX-01**: Progress indikátor (hány kérdés van hátra hozzávetőlegesen)
- **UX-02**: Brief quality scoring (mennyire teljes a brief, hol vannak hiányok)
- **UX-03**: Conversation auto-save / draft recovery

### Analytics

- **ANLYT-01**: Brief completion rate tracking
- **ANLYT-02**: Drop-off point monitoring
- **ANLYT-03**: Kampánytípus statisztikák

### Advanced

- **ADV-01**: Conversation summarization hosszú chatekhez (context window management)
- **ADV-02**: Enrichment notes (AI megjegyzések a ROI csapatnak a brief mellé)
- **ADV-03**: Új kampánytípusok hozzáadása config-ból (admin felület nélkül)

## Out of Scope

| Feature | Reason |
|---------|--------|
| PDF feltöltés / ajánlat elemzés | v2 ajánlatadás előtti flow, nincs mit feltölteni |
| Felhasználói fiók / bejelentkezés | Anonim session, konverziót rontaná |
| Real-time collaboration | Pre-sale tool, nem team collaboration |
| Voice input | Komplexitás vs. érték nem indokolja |
| Iframe/widget beágyazás | Direkt link, egyszerűbb karbantartás |
| Multi-language | Csak magyar piac, egynyelvű |
| Database / persistent storage | Session-based marad, nincs szükség |
| Design brief / website brief | Más domain, más kérdéskészlet — későbbi milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TYPE-01 | — | Pending |
| TYPE-02 | — | Pending |
| TYPE-03 | — | Pending |
| TYPE-04 | — | Pending |
| QUES-01 | — | Pending |
| QUES-02 | — | Pending |
| QUES-03 | — | Pending |
| QUES-04 | — | Pending |
| QUES-05 | — | Pending |
| FLOW-01 | — | Pending |
| FLOW-02 | — | Pending |
| FLOW-03 | — | Pending |
| REPT-01 | — | Pending |
| REPT-02 | — | Pending |
| REPT-03 | — | Pending |
| REPT-04 | — | Pending |
| REPT-05 | — | Pending |
| TECH-01 | — | Pending |
| TECH-02 | — | Pending |
| TECH-03 | — | Pending |
| TECH-04 | — | Pending |
| TECH-05 | — | Pending |
| BRND-01 | — | Pending |
| BRND-02 | — | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 0
- Unmapped: 24 ⚠️

---
*Requirements defined: 2026-02-10*
*Last updated: 2026-02-10 after initial definition*
