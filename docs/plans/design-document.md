# ROI Works Brief - Design dokumentáció

## 1. Projekt áttekintés

### 1.1 Projekt célja
Belső brief webapp a ROI Works marketing ügynökség számára, ahol az ügyfelek AI-asszisztált módon tudják kitölteni a kampány briefet.

### 1.2 Felhasználói probléma
- Az ügyfelek gyakran hiányos vagy nem megfelelő briefet adnak
- Az ügynökségnek sok időbe telik a visszakérdezés
- A brief template-ek nem interaktívak

### 1.3 Megoldás
AI chatbot (Claude Opus 4.5), ami:
- Elemzi az ügyfél ajánlatát (PDF)
- Strukturáltan kikérdezi a brief elemeket
- Magyarázó kontextussal segíti a válaszadást
- Automatikusan generálja a formázott briefet

---

## 2. Technikai architektúra

### 2.1 Tech stack
| Komponens | Technológia | Indoklás |
|-----------|-------------|----------|
| Framework | Next.js 14 (App Router) | Modern React, API routes, Vercel integráció |
| Styling | Tailwind CSS | Gyors, arculathoz illeszthető, KISS |
| AI | Claude API (claude-opus-4-5-20251101) | Streaming, PDF értelmezés, magyar nyelv |
| Email | SendGrid | Meglévő integráció, HTML + PDF melléklet |
| PDF generálás | @react-pdf/renderer | React-natív PDF készítés |
| Deploy | Vercel | Native Next.js support, egyszerű CI/CD |

### 2.2 Architektúra diagram
```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Upload Page │→ │  Chat View  │→ │ Brief Editor/Preview │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API ROUTES (Next.js)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ /api/chat   │  │ /api/send   │  │ /api/generate-pdf   │  │
│  │ (streaming) │  │ (SendGrid)  │  │ (react-pdf)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    KÜLSŐ SZOLGÁLTATÁSOK                      │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │ Claude API  │  │  SendGrid   │                           │
│  └─────────────┘  └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Adatáramlás
```
1. Ügyfél feltölt PDF-et
   └→ Base64 encode → localStorage (ideiglenesen)

2. Chat indul
   └→ Claude API hívás (system prompt + PDF content)
   └→ Streaming válasz a felhasználónak

3. Chat végén brief generálás
   └→ Claude összefoglalja strukturáltan
   └→ JSON formátumban kerül a brief editorba

4. Véglegesítés után email küldés
   └→ PDF generálás (react-pdf)
   └→ SendGrid: HTML body + PDF attachment
   └→ 3 címzett: ügyfél + 2 konfigurálható
```

---

## 3. Felhasználói élmény (UX)

### 3.1 User flow
```
┌──────────────────────────────────────────────────────────────┐
│                      FELHASZNÁLÓI FLOW                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│  │ Landing │ →  │ Upload  │ →  │  Chat   │ →  │ Preview │   │
│  │  Page   │    │   PDF   │    │   AI    │    │ & Edit  │   │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘   │
│       │              │              │              │         │
│       ▼              ▼              ▼              ▼         │
│  ROI Works      Drag & drop    Kérdés-válasz   Formázott    │
│  branding       ajánlat PDF    interakció      brief        │
│  üdvözlés                      streaming       szerkesztés  │
│                                                              │
│                                         ┌─────────┐         │
│                                         │  Send   │         │
│                                         │ Emails  │         │
│                                         └─────────┘         │
│                                              │              │
│                                              ▼              │
│                                         Visszajelzés        │
│                                         "Sikeresen          │
│                                          elküldve!"         │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Képernyők

#### 3.2.1 Landing / Upload oldal
- ROI Works logó (fejléc)
- Üdvözlő szöveg
- Drag & drop PDF feltöltő zóna
- "Tovább" gomb (aktív ha van feltöltött PDF)

#### 3.2.2 Chat felület
- Bal oldalon: Chat üzenetek (AI és user)
- AI üzenetek: streaming megjelenítés
- User input: szövegmező + küldés gomb
- Progress indikátor (hány kérdés van hátra - opcionális)

#### 3.2.3 Brief preview/editor
- Formázott brief megjelenítés
- Szerkeszthető mezők
- "Küldés" gomb
- Opcionális: PDF előnézet

#### 3.2.4 Sikeres küldés
- Visszaigazolás
- "Új brief indítása" opció

---

## 4. Vizuális design

### 4.1 Színpaletta (ROI Works arculat)
```css
:root {
  /* Elsődleges színek */
  --orange: #FF6400;
  --blue: #0022D2;

  /* Neutrals */
  --gray-light: #E3E3E3;
  --gray-dark: #3C3E43;
  --black: #000000;
  --white: #FFFFFF;

  /* Származtatott színek */
  --orange-80: #FF8333;
  --orange-60: #FFA266;
  --blue-80: #334ED8;
  --blue-60: #667ADE;
}
```

### 4.2 Tipográfia
```css
/* Elsődleges font: Archivo */
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700;900&family=Archivo+SemiExpanded:wght@400;500;700;900&display=swap');

/* Címek */
.heading {
  font-family: 'Archivo SemiExpanded', sans-serif;
  font-weight: 900;
}

/* Szöveg */
.body {
  font-family: 'Archivo', sans-serif;
  font-weight: 400;
}
```

### 4.3 Design elvek
1. **Sötét téma alapú** - Konzisztens az arculattal
2. **Narancs akcentus** - CTA-k, fontos elemek
3. **Geometrikus formák** - Az arculati minták használata díszítő elemként
4. **Tiszta, légies layout** - KISS elv, ne legyen zsúfolt
5. **Professzionális megjelenés** - B2B ügynökségi stílus

### 4.4 Komponens design
| Komponens | Háttér | Keret | Szöveg | Akcentus |
|-----------|--------|-------|--------|----------|
| Oldal háttér | #3C3E43 | - | #FFFFFF | - |
| Chat bubble (AI) | #2A2B2E | - | #FFFFFF | #FF6400 avatar |
| Chat bubble (User) | #FF6400 | - | #000000 | - |
| Input mező | #2A2B2E | 1px #555 | #FFFFFF | #FF6400 focus |
| Gomb (primary) | #FF6400 | - | #000000 | hover: #FF8333 |
| Gomb (secondary) | transparent | 1px #FF6400 | #FF6400 | - |
| Kártya | #2A2B2E | - | #FFFFFF | - |

---

## 5. AI chatbot specifikáció

### 5.1 System prompt vázlat
```
Te a ROI Works marketing ügynökség brief asszisztense vagy.
Professzionális, segítőkész tanácsadóként viselkedsz, magázódva kommunikálsz.

FELADATOD:
1. Elemezd az ügyfél által feltöltött ajánlatot
2. A brief template alapján kérdezd ki az ügyfelet
3. Minden kérdéshez adj magyarázó kontextust, ami segíti a válaszadást
4. Foglald össze a briefet strukturált formában

BRIEF MEZŐK:
- Cégnév, kapcsolattartó adatok
- Kampány neve, típusa
- Kampány célja, KPI-k
- Célcsoport (demográfia, pszichográfia)
- Üzenet, kommunikációs stílus
- Csatornák
- Időzítés, költségvetés
- Versenytársak
- Technikai követelmények

STÍLUS:
- Magyar nyelv
- Magázódás
- Professzionális de barátságos
- Egy kérdés egyszerre
- Mindig adj kontextust a kérdéshez
```

### 5.2 Kérdés-struktúra példa
```
AI: Kedves [Név]! Köszöntöm a ROI Works brief rendszerben.

Áttekintettem az ajánlatot, és látom, hogy [X szolgáltatásról] van szó.
Néhány kérdéssel szeretném pontosítani a kampány részleteit.

Első kérdésem: **Mi a kampány elsődleges célja?**

💡 *Kontextus: A kampánycél határozza meg a stratégiát és a mérési mutatókat.
Példák: márkaismertség növelése, lead generálás, webshop forgalom növelése,
alkalmazás letöltések ösztönzése.*

Kérem válasszon egyet, vagy fogalmazza meg saját szavaival.
```

### 5.3 Output formátum (brief JSON)
```json
{
  "company": {
    "name": "...",
    "contact_name": "...",
    "contact_email": "...",
    "contact_phone": "..."
  },
  "campaign": {
    "name": "...",
    "type": "...",
    "goal": "...",
    "message": "...",
    "kpis": ["...", "..."]
  },
  "target_audience": {
    "demographics": {
      "gender": "...",
      "age": "...",
      "location": "..."
    },
    "psychographics": "...",
    "persona": "..."
  },
  "channels": ["Facebook Ads", "Google Search", "..."],
  "timeline": {
    "start": "2024-...",
    "end": "2024-...",
    "important_dates": ["..."]
  },
  "budget": {
    "total": "...",
    "distribution": {}
  },
  "competitors": ["...", "..."],
  "notes": "..."
}
```

---

## 6. Email specifikáció

### 6.1 Email struktúra
- **Tárgy:** [Cégnév] - Kampány Brief - [Kampány neve]
- **Törzs:** HTML formázott brief összefoglaló
- **Melléklet:** PDF (teljes brief)

### 6.2 Címzettek
1. Ügyfél email címe (a briefből)
2. ROI Works címzett #1 (env: `BRIEF_RECIPIENT_1`)
3. ROI Works címzett #2 (env: `BRIEF_RECIPIENT_2`)

### 6.3 PDF design
- ROI Works fejléc (logó)
- Brief szekciók táblázatos formában
- Arculati színek és tipográfia
- Lábléc: dátum, generálva: brief.roi.works

---

## 7. Környezeti változók

```env
# AI
ANTHROPIC_API_KEY=sk-ant-...

# Email
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=brief@roi.works
BRIEF_RECIPIENT_1=team1@roi.works
BRIEF_RECIPIENT_2=team2@roi.works

# App
NEXT_PUBLIC_APP_URL=https://brief.roi.works
```

---

## 8. Sikerkritériumok

1. **Funkcionális:** Teljes flow működik (upload → chat → brief → email)
2. **UX:** Intuitív, nem szükséges útmutató
3. **Design:** ROI Works arculattal konzisztens
4. **Teljesítmény:** Chat válasz <2s indulás, streaming folyamatos
5. **Megbízhatóság:** Email küldés 99%+ sikerráta

---

## 9. Scope-on kívül (v1)

- Többnyelvűség (csak magyar)
- Felhasználói fiókok
- Brief mentés/folytatás
- Admin felület
- Analytics dashboard
- Mobilalkalmazás (de responsive web)

---

## 10. Verziótörténet

| Verzió | Dátum | Változás |
|--------|-------|----------|
| 1.0 | 2026-01-13 | Kezdeti design dokumentum |
