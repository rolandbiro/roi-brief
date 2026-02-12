import ExcelJS from "exceljs";
import fs from "fs";
import type { BriefData } from "@/types/brief";
import type { ResearchResults, ChannelRow, TargetingRow } from "@/lib/research/types";
import { getTemplatePath } from "./template-paths";
import type { TemplateName } from "./template-paths";

export async function fillMediaplan(
  research: ResearchResults,
  briefData: BriefData,
): Promise<Buffer> {
  const templateName = research.template_type as TemplateName;
  const wb = new ExcelJS.Workbook();
  const fileData = fs.readFileSync(getTemplatePath(templateName));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await wb.xlsx.load(fileData as any);

  switch (research.template_type) {
    case "ppc_traffic":
      fillPpcTraffic(wb.worksheets[0], research, briefData);
      break;
    case "ppc_reach":
      fillPpcReach(wb.worksheets[0], research, briefData);
      break;
    case "ppc_mixed":
      fillPpcMixed(wb.worksheets[0], research, briefData);
      break;
    case "all_channels":
      fillAllChannels(wb, research, briefData);
      break;
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// --- Header (shared across PPC templates) ---

function fillPpcHeader(
  ws: ExcelJS.Worksheet,
  research: ResearchResults,
  brief: BriefData,
): void {
  ws.getCell("E3").value = research.campaign_name;
  ws.getCell("E4").value = research.campaign_period;
  ws.getCell("E5").value = research.summary.total_budget_huf;
  ws.getCell("J3").value = brief.company_name;
  ws.getCell("J4").value = research.campaign_goal;
  ws.getCell("J5").value = brief.contact_name || "";
}

// --- Targeting rows (shared) ---

function fillTargeting(
  ws: ExcelJS.Worksheet,
  targeting: TargetingRow[],
  startRow: number,
): void {
  targeting.forEach((t, i) => {
    const row = startRow + i;
    ws.getCell(`A${row}`).value = t.ad_network;
    ws.getCell(`B${row}`).value = t.age;
    ws.getCell(`C${row}`).value = t.gender;
    ws.getCell(`D${row}`).value = t.location;
    ws.getCell(`E${row}`).value = t.interest;
  });
}

// --- PPC Traffic ---

function fillPpcTraffic(
  ws: ExcelJS.Worksheet,
  research: ResearchResults,
  brief: BriefData,
): void {
  fillPpcHeader(ws, research, brief);

  const DATA_START = 11;
  const MAX_ROWS = 3;
  const channels = research.channels.slice(0, MAX_ROWS);

  channels.forEach((ch, i) => {
    const row = DATA_START + i;
    fillTrafficRow(ws, row, ch, research.campaign_period);
  });

  fillTargeting(ws, research.targeting, 19);
}

function fillTrafficRow(
  ws: ExcelJS.Worksheet,
  row: number,
  ch: ChannelRow,
  period: string,
): void {
  ws.getCell(`A${row}`).value = ch.campaign_target;
  ws.getCell(`B${row}`).value = ch.campaign_type;
  ws.getCell(`C${row}`).value = ch.ad_network;
  ws.getCell(`D${row}`).value = ch.ad_type;
  ws.getCell(`E${row}`).value = period;
  ws.getCell(`F${row}`).value = ch.impressions?.likely;
  ws.getCell(`G${row}`).value = ch.ctr?.likely;
  ws.getCell(`H${row}`).value = ch.clicks?.likely;
  ws.getCell(`I${row}`).value = ch.cpc?.likely;
  ws.getCell(`J${row}`).value = ch.budget_allocation_huf;
  ws.getCell(`K${row}`).value = ch.budget_allocation_huf;
}

// --- PPC Reach ---

function fillPpcReach(
  ws: ExcelJS.Worksheet,
  research: ResearchResults,
  brief: BriefData,
): void {
  fillPpcHeader(ws, research, brief);

  const DATA_START = 11;
  const MAX_ROWS = 4;
  const channels = research.channels.slice(0, MAX_ROWS);

  channels.forEach((ch, i) => {
    const row = DATA_START + i;
    fillReachRow(ws, row, ch, research.campaign_period);
  });

  fillTargeting(ws, research.targeting, 17);
}

function fillReachRow(
  ws: ExcelJS.Worksheet,
  row: number,
  ch: ChannelRow,
  period: string,
): void {
  ws.getCell(`A${row}`).value = ch.campaign_target;
  ws.getCell(`B${row}`).value = ch.campaign_type;
  ws.getCell(`C${row}`).value = ch.ad_network;
  ws.getCell(`D${row}`).value = ch.ad_type;
  ws.getCell(`E${row}`).value = period;
  ws.getCell(`F${row}`).value = ch.impressions?.likely;
  ws.getCell(`G${row}`).value = ch.frequency?.likely;
  ws.getCell(`H${row}`).value = ch.reach?.likely;
  ws.getCell(`I${row}`).value = ch.cpm?.likely;
  ws.getCell(`J${row}`).value = ch.budget_allocation_huf;
}

// --- PPC Mixed ---

function fillPpcMixed(
  ws: ExcelJS.Worksheet,
  research: ResearchResults,
  brief: BriefData,
): void {
  fillPpcHeader(ws, research, brief);

  const reachChannels: ChannelRow[] = [];
  const trafficChannels: ChannelRow[] = [];

  for (const ch of research.channels) {
    if (ch.frequency || ch.reach || ch.cpm) {
      reachChannels.push(ch);
    } else {
      trafficChannels.push(ch);
    }
  }

  // Reach block: R9-R15 (data rows from R11)
  const REACH_START = 11;
  const REACH_MAX = 4;
  reachChannels.slice(0, REACH_MAX).forEach((ch, i) => {
    fillReachRow(ws, REACH_START + i, ch, research.campaign_period);
  });

  // Traffic block: R18-R23 (data rows from R20)
  const TRAFFIC_START = 20;
  const TRAFFIC_MAX = 3;
  trafficChannels.slice(0, TRAFFIC_MAX).forEach((ch, i) => {
    fillTrafficRow(ws, TRAFFIC_START + i, ch, research.campaign_period);
  });

  fillTargeting(ws, research.targeting, 27);
}

// --- All Channels ---

function fillAllChannels(
  wb: ExcelJS.Workbook,
  research: ResearchResults,
  brief: BriefData,
): void {
  const ws = wb.getWorksheet("Media_plan") || wb.worksheets[0];

  // Header
  ws.getCell("E3").value = research.campaign_name;
  ws.getCell("E4").value = research.campaign_period;
  ws.getCell("E5").value = research.summary.total_budget_huf;
  ws.getCell("J3").value = brief.company_name;
  ws.getCell("J4").value = research.campaign_goal;
  ws.getCell("J5").value = brief.contact_name || "";

  // PPC Marketing rows: R11-R20 (max 10 rows)
  const DATA_START = 11;
  const MAX_ROWS = 10;
  const channels = research.channels.slice(0, MAX_ROWS);

  channels.forEach((ch, i) => {
    const row = DATA_START + i;
    ws.getCell(`A${row}`).value = ch.ad_network;
    ws.getCell(`B${row}`).value = ch.ad_type;
    ws.getCell(`C${row}`).value = ch.campaign_type;
    ws.getCell(`D${row}`).value = ch.impressions?.likely;
    ws.getCell(`E${row}`).value = ch.clicks?.likely;
    ws.getCell(`F${row}`).value = ch.conversions?.likely;
    ws.getCell(`G${row}`).value = ch.cpc?.likely || ch.cpm?.likely;
    ws.getCell(`H${row}`).value = ch.budget_allocation_huf;
  });
}
