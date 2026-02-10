import type { CampaignType } from "@/lib/schemas/campaign-types";
import { BASE_PROMPT } from "./base";
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

export function composeSystemPrompt(types: CampaignType[]): string {
  if (types.length === 0) {
    return BASE_PROMPT;
  }

  const typeModules = types.map((type) => TYPE_MODULES[type]).join("\n\n");
  return `${BASE_PROMPT}\n\n${typeModules}`;
}
