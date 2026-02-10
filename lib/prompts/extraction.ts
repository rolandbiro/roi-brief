export const EXTRACTION_PROMPT = `A feladatod, hogy a felhasználó és az asszisztens közötti beszélgetésből kinyerd a kampány brief adatokat.

SZABÁLYOK:
- A beszélgetés alapján töltsd ki a mezőket amennyire lehet
- Ha egy információ nem hangzott el, hagyd üresen (optional mezők) vagy adj üres tömböt (array mezők)
- Magyar kontextusban gondolkodj — a cégnevek, iparágak, helyszínek magyarul szerepeljenek
- A campaign_types mezőbe MINDEN felismert kampánytípust tedd (tömb, lehet több is)
- A típusspecifikus mezőket (media_specific, performance_specific, brand_specific, social_specific) CSAK akkor töltsd ki ha a campaign_types tartalmazza az adott típust
- Légy pontos: ne találj ki adatokat, csak azt írd amit a beszélgetésből ki lehet olvasni
- Ha a beszélgetésben tool use által rögzített adatok is vannak, azokat vedd figyelembe
`;
