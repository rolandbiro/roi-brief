import type { BriefData } from "@/types/brief";
import type { ResearchResults } from "./types";
import { selectTemplate } from "./template-mapper";
import { runWebSearch } from "./search";
import { structureResults } from "./structure";

export async function runResearchPipeline(
  briefData: BriefData,
): Promise<ResearchResults> {
  // Step 0: Template típus kiválasztás
  const templateType = selectTemplate(briefData);
  console.log("[research] Template type:", templateType);

  // Step 1: Web search kutatás
  console.log("[research] Starting web search for:", briefData.company_name);
  const rawResearch = await runWebSearch(briefData, templateType);
  console.log("[research] Web search complete, length:", rawResearch.length);

  // Step 2: Strukturált output formázás
  console.log("[research] Structuring results...");
  const results = await structureResults(rawResearch, briefData);
  console.log(
    "[research] Pipeline complete. Channels:",
    results.channels.length,
    "Targeting:",
    results.targeting.length,
  );

  return results;
}
