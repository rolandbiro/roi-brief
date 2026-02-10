import type { CampaignType } from "@/lib/schemas/campaign-types";
import type { BriefState } from "@/lib/tools/types";
import { BASE_PROMPT } from "./base";
import { buildQuestioningStrategy } from "./questioning";
import { MEDIA_BUYING_MODULE } from "./types/media-buying";
import { PERFORMANCE_MODULE } from "./types/performance";
import { BRAND_MODULE } from "./types/brand";
import { SOCIAL_MODULE } from "./types/social";

const TYPE_MODULES: Record<CampaignType, string> = {
  media_buying: MEDIA_BUYING_MODULE,
  performance_ppc: PERFORMANCE_MODULE,
  brand_awareness: BRAND_MODULE,
  social_media: SOCIAL_MODULE,
};

export function composeSystemPrompt(briefState: BriefState): string {
  const activeTypes = briefState.confirmedTypes.length > 0
    ? briefState.confirmedTypes
    : briefState.detectedTypes;

  const parts = [BASE_PROMPT];

  parts.push(buildQuestioningStrategy(briefState));

  if (activeTypes.length > 0) {
    const typeModules = activeTypes.map(type => TYPE_MODULES[type]).join("\n\n");
    parts.push(typeModules);
  }

  return parts.join("\n\n");
}
