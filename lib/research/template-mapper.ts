import type { MediaplanTemplate } from "./types";
import type { BriefData } from "@/types/brief";

export function selectTemplate(briefData: BriefData): MediaplanTemplate {
  const goal = briefData.campaign_goal?.toLowerCase() ?? "";
  const types = briefData.campaign_types ?? [];

  const hasMedia = types.includes("media_buying");
  const hasSocial = types.includes("social_media");

  if (hasMedia || hasSocial || types.length > 2) {
    return "all_channels";
  }

  const isTraffic =
    /traffic|forgalom|kattintás|click|konverzió|conversion|lead/i.test(goal);
  const isReach =
    /awareness|ismertség|reach|elérés|megjelenés|brand/i.test(goal);

  if (isTraffic && isReach) return "ppc_mixed";
  if (isReach) return "ppc_reach";
  return "ppc_traffic";
}
