export const EXTRACTION_PROMPT = `A feladatod, hogy a felhasználó és az asszisztens közötti beszélgetésből kinyerd a kampány brief adatokat.

SZABÁLYOK:
- A beszélgetés alapján töltsd ki a mezőket amennyire lehet
- Ha egy információ nem hangzott el a beszélgetésben, hagyd üresen (optional mezők) vagy adj üres tömböt (array mezők)
- Magyar kontextusban gondolkodj — a cégnevek, iparágak, helyszínek magyarul szerepeljenek
- A campaign_type mezőt a beszélgetés tartalma alapján állapítsd meg
- Légy pontos: ne találj ki adatokat, csak azt írd amit a beszélgetésből ki lehet olvasni
- A típusspecifikus mezőket (media_specific, performance_specific, brand_specific, social_specific) a kampánytípusnak megfelelően töltsd ki
`;
