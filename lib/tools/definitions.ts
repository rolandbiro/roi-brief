export const TOOL_DEFINITIONS = [
  {
    name: "classify_campaign",
    description: `Amikor felismerted a kampánytípus(oka)t az érdeklődő válaszaiból, használd ezt a tool-t a típus(ok) rögzítésére. Típusok: media_buying, performance_ppc, brand_awareness, social_media. Több típus is megadható egyszerre. Akkor is használd ha az érdeklődő menet közben új típust említ.`,
    input_schema: {
      type: "object" as const,
      properties: {
        campaign_types: {
          type: "array",
          items: {
            type: "string",
            enum: ["media_buying", "performance_ppc", "brand_awareness", "social_media"],
          },
          description: "A felismert kampánytípus(ok)",
        },
        confidence: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Mennyire vagy biztos a típusfelismerésben",
        },
        reasoning: {
          type: "string",
          description: "Miért gondolod hogy ez(ek) a típus(ok) — rövid indoklás",
        },
      },
      required: ["campaign_types", "confidence"],
    },
  },
  {
    name: "update_brief",
    description: `Amikor az érdeklődő válaszából kinyertél konkrét brief adatot, használd ezt a tool-t az adat rögzítésére. Ne várd meg amíg minden adat megvan — minden értékes információt azonnal rögzíts ahogy elhangzik. A field lehet nested is (pl. "media_specific.grp_target"). FONTOS: Egy hívásban csak egy mezőt frissíts, de egy válaszban TÖBB update_brief hívást is tehetsz egyszerre (parallel tool use).`,
    input_schema: {
      type: "object" as const,
      properties: {
        field: {
          type: "string",
          description: "Melyik mező frissüljön (pl. 'company_name', 'campaign_goal', 'media_specific.grp_target')",
        },
        value: {
          type: "string",
          description: "A mező új értéke",
        },
      },
      required: ["field", "value"],
    },
  },
  {
    name: "suggest_quick_replies",
    description: `Amikor zárt kérdést teszel fel (igen/nem, választás opciók közül, platform választás, stb.), használd ezt a tool-t hogy gyors válasz gombokat javasolj. NE használd nyílt kérdéseknél (pl. "Mesélj a cégedről"). A gombok az érdeklődő chat felületén jelennek meg. Mindig adj egy "Egyéb" opciót is (value: null) hogy szabad szöveget is írhassanak.`,
    input_schema: {
      type: "object" as const,
      properties: {
        options: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: {
                type: "string",
                description: "A gomb felirata (rövid, max 3-4 szó)",
              },
              value: {
                type: ["string", "null"],
                description: "Az elküldendő szöveg, vagy null ha szabad szöveg (Egyéb opció)",
              },
            },
            required: ["label", "value"],
          },
          description: "A gyors válasz opciók (2-5 darab, az utolsó legyen Egyéb value:null)",
        },
      },
      required: ["options"],
    },
  },
];
