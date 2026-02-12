import Anthropic from "@anthropic-ai/sdk";
import type { BriefData } from "@/types/brief";
import type { MediaplanTemplate } from "./types";
import { RESEARCH_SYSTEM_PROMPT, buildResearchPrompt } from "./prompts";

export async function runWebSearch(
  briefData: BriefData,
  templateType: MediaplanTemplate,
): Promise<string> {
  const anthropic = new Anthropic();

  const messages: Anthropic.MessageParam[] = [
    { role: "user" as const, content: buildResearchPrompt(briefData, templateType) },
  ];

  let fullContent = "";
  let continueLoop = true;

  while (continueLoop) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: RESEARCH_SYSTEM_PROMPT,
      messages,
      tools: [
        {
          type: "web_search_20250305" as const,
          name: "web_search",
          max_uses: 5,
          user_location: {
            type: "approximate" as const,
            country: "HU",
            city: "Budapest",
            timezone: "Europe/Budapest",
          },
        },
      ],
    });

    if (response.stop_reason === "pause_turn") {
      messages.length = 0;
      messages.push(
        { role: "user" as const, content: buildResearchPrompt(briefData, templateType) },
        { role: "assistant" as const, content: response.content as Anthropic.ContentBlock[] },
      );
      continue;
    }

    for (const block of response.content) {
      if (block.type === "text") {
        fullContent += block.text;
      }
    }
    continueLoop = false;
  }

  return fullContent;
}
