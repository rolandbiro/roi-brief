import type { BriefData } from "@/types/brief";
import type { ResearchResults, ChannelRow, KpiEstimate } from "./types";
import { selectTemplate } from "./template-mapper";
import { runWebSearch } from "./search";
import { structureResults } from "./structure";

export function normalizeBudget(results: ResearchResults): ResearchResults {
  const totalBudget = results.summary.total_budget_huf;
  const channels = results.channels;

  const actualSum = channels.reduce(
    (sum, ch) => sum + ch.budget_allocation_huf,
    0,
  );
  const diff = Math.abs(actualSum - totalBudget);

  if (diff < 1) {
    return results;
  }

  console.log(
    `[research] Budget normalization: ${actualSum} -> ${totalBudget} (diff: ${diff})`,
  );

  const scale = totalBudget / actualSum;

  const normalizedChannels: ChannelRow[] = channels.map((ch) => ({
    ...ch,
    budget_allocation_huf: Math.round(ch.budget_allocation_huf * scale),
  }));

  // Kerekítési maradék az utolsó csatornára
  const normalizedSum = normalizedChannels.reduce(
    (sum, ch) => sum + ch.budget_allocation_huf,
    0,
  );
  const remainder = totalBudget - normalizedSum;
  if (normalizedChannels.length > 0) {
    normalizedChannels[normalizedChannels.length - 1].budget_allocation_huf +=
      remainder;
  }

  // Újraszámolás: pct + KPI-k
  const updatedChannels: ChannelRow[] = normalizedChannels.map((ch) => {
    const newBudget = ch.budget_allocation_huf;
    const pct = Math.round((newBudget / totalBudget) * 1000) / 10;

    const updated: ChannelRow = {
      ...ch,
      budget_allocation_pct: pct,
    };

    // Traffic csatornák: cpc + clicks
    if (ch.cpc && ch.clicks) {
      updated.clicks = invertedKpi(newBudget, ch.cpc);
      if (ch.ctr && ch.impressions) {
        updated.impressions = {
          min: Math.round(updated.clicks.min / (ch.ctr.min / 100)),
          likely: Math.round(updated.clicks.likely / (ch.ctr.likely / 100)),
          max: Math.round(updated.clicks.max / (ch.ctr.max / 100)),
        };
      }
    }
    // Reach csatornák: cpm + reach (de nincs cpc)
    else if (ch.cpm && !ch.cpc) {
      updated.impressions = {
        min: Math.round((newBudget / ch.cpm.max) * 1000),
        likely: Math.round((newBudget / ch.cpm.likely) * 1000),
        max: Math.round((newBudget / ch.cpm.min) * 1000),
      };
      if (ch.frequency && ch.reach) {
        updated.reach = {
          min: Math.round(updated.impressions.min / ch.frequency.max),
          likely: Math.round(
            updated.impressions.likely / ch.frequency.likely,
          ),
          max: Math.round(updated.impressions.max / ch.frequency.min),
        };
      }
    }

    // Conversion: cpa
    if (ch.cpa && ch.conversions) {
      updated.conversions = invertedKpi(newBudget, ch.cpa);
    }

    return updated;
  });

  // Summary aggregáció
  const totalClicks = aggregateKpi(updatedChannels, "clicks");
  const totalImpressions = aggregateKpi(updatedChannels, "impressions");
  const totalReach = aggregateKpi(updatedChannels, "reach");
  const totalConversions = aggregateKpi(updatedChannels, "conversions");

  let overallCtr: KpiEstimate | undefined;
  if (totalClicks && totalImpressions) {
    overallCtr = {
      min: Math.round((totalClicks.min / totalImpressions.max) * 10000) / 100,
      likely:
        Math.round((totalClicks.likely / totalImpressions.likely) * 10000) /
        100,
      max: Math.round((totalClicks.max / totalImpressions.min) * 10000) / 100,
    };
  }

  let overallCpc: KpiEstimate | undefined;
  if (totalClicks) {
    overallCpc = {
      min: Math.round(totalBudget / totalClicks.max),
      likely: Math.round(totalBudget / totalClicks.likely),
      max: Math.round(totalBudget / totalClicks.min),
    };
  }

  let overallCpm: KpiEstimate | undefined;
  if (totalImpressions) {
    overallCpm = {
      min: Math.round((totalBudget / totalImpressions.max) * 1000),
      likely: Math.round((totalBudget / totalImpressions.likely) * 1000),
      max: Math.round((totalBudget / totalImpressions.min) * 1000),
    };
  }

  return {
    ...results,
    channels: updatedChannels,
    summary: {
      ...results.summary,
      total_clicks: totalClicks,
      total_impressions: totalImpressions,
      total_reach: totalReach,
      total_conversions: totalConversions,
      overall_ctr: overallCtr,
      overall_cpc: overallCpc,
      overall_cpm: overallCpm,
    },
  };
}

function invertedKpi(budget: number, costKpi: KpiEstimate): KpiEstimate {
  return {
    min: Math.round(budget / costKpi.max),
    likely: Math.round(budget / costKpi.likely),
    max: Math.round(budget / costKpi.min),
  };
}

function aggregateKpi(
  channels: ChannelRow[],
  field: keyof ChannelRow,
): KpiEstimate | undefined {
  const withField = channels.filter(
    (ch) => ch[field] != null && typeof ch[field] === "object",
  );
  if (withField.length === 0) return undefined;
  return {
    min: withField.reduce(
      (sum, ch) => sum + (ch[field] as KpiEstimate).min,
      0,
    ),
    likely: withField.reduce(
      (sum, ch) => sum + (ch[field] as KpiEstimate).likely,
      0,
    ),
    max: withField.reduce(
      (sum, ch) => sum + (ch[field] as KpiEstimate).max,
      0,
    ),
  };
}

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

  // Step 3: Büdzsé normalizáció
  const normalized = normalizeBudget(results);
  console.log(
    "[research] Pipeline complete. Channels:",
    normalized.channels.length,
    "Targeting:",
    normalized.targeting.length,
  );

  return normalized;
}
