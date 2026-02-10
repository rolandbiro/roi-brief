export const TOOL_DEFINITIONS = [
  {
    name: "classify_campaign",
    description: `Amikor felismerted a kampanytipus(oka)t az erdeklodo valaszaibol, hasznald ezt a tool-t a tipus(ok) rogzitesere. Tipusok: media_buying, performance_ppc, brand_awareness, social_media. Tobb tipus is megadhato egyszerre. Akkor is hasznald ha az erdeklodo menet kozben uj tipust emlit.`,
    input_schema: {
      type: "object" as const,
      properties: {
        campaign_types: {
          type: "array",
          items: {
            type: "string",
            enum: ["media_buying", "performance_ppc", "brand_awareness", "social_media"],
          },
          description: "A felismert kampanytipus(ok)",
        },
        confidence: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Mennyire vagy biztos a tipusfelismeresben",
        },
        reasoning: {
          type: "string",
          description: "Miert gondolod hogy ez(ek) a tipus(ok) — rovid indoklas",
        },
      },
      required: ["campaign_types", "confidence"],
    },
  },
  {
    name: "update_brief",
    description: `Amikor az erdeklodo valaszabol kinyertel konkret brief adatot, hasznald ezt a tool-t az adat rogzitesere. Ne vard meg amig minden adat megvan — minden ertekes informaciot azonnal rogzits ahogy elhangzik. A field lehet nested is (pl. "media_specific.grp_target").`,
    input_schema: {
      type: "object" as const,
      properties: {
        field: {
          type: "string",
          description: "Melyik mezo frissuljon (pl. 'company_name', 'campaign_goal', 'media_specific.grp_target')",
        },
        value: {
          type: "string",
          description: "A mezo uj erteke",
        },
      },
      required: ["field", "value"],
    },
  },
];
