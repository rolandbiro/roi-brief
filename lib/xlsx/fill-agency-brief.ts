import ExcelJS from "exceljs";
import fs from "fs";
import type { BriefData } from "@/types/brief";
import { CAMPAIGN_TYPE_LABELS, type CampaignType } from "@/types/brief";
import { getTemplatePath } from "./template-paths";

export async function fillAgencyBrief(briefData: BriefData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const fileData = fs.readFileSync(getTemplatePath("agency_brief"));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await wb.xlsx.load(fileData as any);

  const ws = wb.worksheets[0];
  fillBriefCells(ws, briefData);

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** Case-insensitive check: does the array contain a value starting with prefix? */
function hasChannel(channels: string[], label: string): boolean {
  const prefix = label.replace(/ ads$/i, "").toLowerCase();
  return channels.some(
    (c) => c.toLowerCase() === prefix || c.toLowerCase() === label.toLowerCase(),
  );
}

function hasAny(arr: string[], ...needles: string[]): boolean {
  const lower = arr.map((s) => s.toLowerCase());
  return needles.some((n) => lower.some((l) => l.includes(n.toLowerCase())));
}

function fillBriefCells(ws: ExcelJS.Worksheet, brief: BriefData): void {
  // --- Alapveto informaciok ---
  if (brief.company_name) ws.getCell("B7").value = brief.company_name;
  if (brief.contact_name) ws.getCell("B9").value = brief.contact_name;
  if (brief.industry) ws.getCell("B13").value = brief.industry;
  if (brief.brand_positioning) ws.getCell("B15").value = brief.brand_positioning;

  // --- Kampany reszletek ---
  if (brief.campaign_name) ws.getCell("B19").value = brief.campaign_name;
  // B21 = "Kampány típusa" — campaign_types labels
  if (brief.campaign_types && brief.campaign_types.length > 0) {
    ws.getCell("B21").value = brief.campaign_types
      .map((t) => CAMPAIGN_TYPE_LABELS[t as CampaignType] ?? t)
      .join(", ");
  }
  if (brief.main_message) ws.getCell("B23").value = brief.main_message;

  // --- Kreativok (checkbox cellak) ---
  // C25 = "Ügyfél biztosítja", C26 = "ROIworks készíti"
  // Values can be English ("client"/"agency") or Hungarian from quick replies
  const sources = brief.creative_source || [];
  const isMindketto = hasAny(sources, "mindkettő", "both");
  ws.getCell("C25").value =
    isMindketto || hasAny(sources, "client", "ügyfél", "saját");
  ws.getCell("C26").value =
    isMindketto || hasAny(sources, "agency", "roiworks", "roi works", "készíti");

  // E25 = "Statikus kreatívok", E26 = "Videós kreatívok"
  const creativeTypes = brief.creative_types || [];
  ws.getCell("E25").value = hasAny(creativeTypes, "statikus", "static", "kép");
  ws.getCell("E26").value = hasAny(creativeTypes, "videó", "video");

  // --- Kommunikacios stilus ---
  if (brief.communication_style)
    ws.getCell("B28").value = brief.communication_style;

  // --- Online hirdetesi csatornak (checkbox cellak) ---
  // Quick reply values: "Facebook", "Instagram", "Google Search", "Google GDN",
  // "TikTok", "YouTube", "Microsoft" — template labels have " ads" suffix
  const channels = brief.ad_channels || [];
  ws.getCell("C30").value = hasChannel(channels, "Facebook ads");
  ws.getCell("E30").value = hasChannel(channels, "Instagram ads");
  ws.getCell("C31").value = hasChannel(channels, "Google GDN");
  ws.getCell("E31").value = hasChannel(channels, "Google Search");
  ws.getCell("C32").value = hasChannel(channels, "Tiktok ads");
  ws.getCell("E32").value = hasChannel(channels, "Microsoft ads");
  ws.getCell("C33").value = hasChannel(channels, "YouTube ads");

  // --- Kampany celja ---
  if (brief.campaign_goal) ws.getCell("B37").value = brief.campaign_goal;

  // --- KPI-k (checkbox cellak) ---
  const kpis = brief.kpis || [];
  ws.getCell("C39").value = kpis.includes("Elérés");
  ws.getCell("E39").value =
    kpis.includes("Website event") || hasAny(kpis, "konverzió", "lead");
  ws.getCell("C40").value = kpis.includes("Megjelenés");
  ws.getCell("E40").value =
    kpis.includes("Social aktivitás") || hasAny(kpis, "social");
  ws.getCell("C41").value = kpis.includes("Link kattintás");

  // --- Celcsoport ---
  const genders = brief.gender || [];
  const allGenders = hasAny(genders, "mindkettő", "both");
  ws.getCell("C46").value =
    allGenders || genders.includes("Nő") || genders.includes("nő");
  ws.getCell("E46").value =
    allGenders || genders.includes("Férfi") || genders.includes("férfi");
  if (brief.location) ws.getCell("C47").value = brief.location;
  if (brief.age_range) ws.getCell("C48").value = brief.age_range;

  if (brief.psychographics) ws.getCell("B50").value = brief.psychographics;
  if (brief.persona) ws.getCell("B52").value = brief.persona;

  // --- Idozites ---
  if (brief.start_date) ws.getCell("B56").value = brief.start_date;
  if (brief.end_date) ws.getCell("B58").value = brief.end_date;
  if (brief.key_events) ws.getCell("B60").value = brief.key_events;

  // --- Koltsegvetes ---
  if (brief.budget_range) ws.getCell("B64").value = brief.budget_range;
  if (brief.budget_allocation) ws.getCell("B66").value = brief.budget_allocation;

  // --- Versenytarsak ---
  if (brief.competitors) {
    ws.getCell("B70").value = Array.isArray(brief.competitors)
      ? brief.competitors.join(", ")
      : brief.competitors;
  }
  if (brief.inspiring_campaigns) ws.getCell("B72").value = brief.inspiring_campaigns;

  // --- Egyeb ---
  if (brief.notes) ws.getCell("B76").value = brief.notes;
}
