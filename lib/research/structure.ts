import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { BriefData } from "@/types/brief";
import { ResearchResultsSchema, type ResearchResults } from "./types";
import { STRUCTURE_SYSTEM_PROMPT } from "./prompts";

export async function structureResults(
  rawResearch: string,
  briefData: BriefData,
): Promise<ResearchResults> {
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    system: STRUCTURE_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Kutatási eredmények:\n\n${rawResearch}\n\nBrief adatok:\n- Kampány név: ${briefData.campaign_name || briefData.company_name + " kampány"}\n- Kampány cél: ${briefData.campaign_goal}\n- Büdzsé: ${briefData.budget_range || "nem megadott"}\n- Időszak: ${briefData.start_date || "?"} - ${briefData.end_date || "?"}`,
      },
    ],
    output_config: {
      format: zodOutputFormat(ResearchResultsSchema),
    },
  });

  const textBlock = response.content[0];
  if (textBlock.type !== "text") {
    throw new Error("Unexpected response format: first block is not text");
  }
  return JSON.parse(textBlock.text) as ResearchResults;
}
