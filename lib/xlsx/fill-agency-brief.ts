import ExcelJS from "exceljs";
import fs from "fs";
import type { BriefData } from "@/types/brief";
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

function fillBriefCells(ws: ExcelJS.Worksheet, brief: BriefData): void {
  // --- Alapveto informaciok ---
  if (brief.company_name) ws.getCell("B7").value = brief.company_name;
  if (brief.contact_name) ws.getCell("B9").value = brief.contact_name;
  if (brief.industry) ws.getCell("B13").value = brief.industry;
  if (brief.brand_positioning) ws.getCell("B15").value = brief.brand_positioning;

  // --- Kampany reszletek ---
  if (brief.campaign_name) ws.getCell("B19").value = brief.campaign_name;
  if (brief.campaign_goal) ws.getCell("B21").value = brief.campaign_goal;
  if (brief.main_message) ws.getCell("B23").value = brief.main_message;

  // --- Kreativok (checkbox cellak) ---
  if (brief.creative_source) {
    ws.getCell("C25").value = brief.creative_source.includes("client");
    ws.getCell("C26").value = brief.creative_source.includes("agency");
  }

  // --- Kommunikacios stilus ---
  if (brief.communication_style)
    ws.getCell("B28").value = brief.communication_style;

  // --- Online hirdetesi csatornak (checkbox cellak) ---
  const channels = brief.ad_channels || [];
  ws.getCell("C30").value = channels.includes("Facebook ads");
  ws.getCell("E30").value = channels.includes("Instagram ads");
  ws.getCell("C31").value = channels.includes("Google GDN");
  ws.getCell("E31").value = channels.includes("Google Search");
  ws.getCell("C32").value = channels.includes("Tiktok ads");
  ws.getCell("E32").value = channels.includes("Microsoft ads");
  ws.getCell("C33").value = channels.includes("YouTube ads");

  // --- Kampany celja ---
  if (brief.campaign_goal) ws.getCell("B37").value = brief.campaign_goal;

  // --- KPI-k (checkbox cellak) ---
  const kpis = brief.kpis || [];
  ws.getCell("C39").value = kpis.includes("Elérés");
  ws.getCell("E39").value = kpis.includes("Website event");
  ws.getCell("C40").value = kpis.includes("Megjelenés");
  ws.getCell("E40").value = kpis.includes("Social aktivitás");
  ws.getCell("C41").value = kpis.includes("Link kattintás");

  // --- Celcsoport ---
  const genders = brief.gender || [];
  ws.getCell("C46").value =
    genders.includes("Nő") || genders.includes("nő");
  ws.getCell("E46").value =
    genders.includes("Férfi") || genders.includes("férfi");
  if (brief.location) ws.getCell("C47").value = brief.location;
  if (brief.age_range) ws.getCell("C48").value = brief.age_range;

  if (brief.psychographics) ws.getCell("B50").value = brief.psychographics;
  if (brief.persona) ws.getCell("B52").value = brief.persona;

  // --- Idozites ---
  if (brief.start_date) ws.getCell("B56").value = brief.start_date;
  if (brief.end_date) ws.getCell("B58").value = brief.end_date;
  if (brief.key_events) ws.getCell("B60").value = brief.key_events;
}
