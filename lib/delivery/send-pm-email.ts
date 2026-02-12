import sgMail from "@sendgrid/mail";
import type { BriefData } from "@/types/brief";
import type { ResearchResults } from "@/lib/research/types";

export async function sendPmEmail(
  briefData: BriefData,
  research: ResearchResults,
  xlsxBuffer: Buffer,
): Promise<void> {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

  const companyName = briefData.company_name;
  const campaignName = briefData.campaign_name || `${companyName} kampány`;

  const ccRaw = process.env.PM_CC_EMAILS?.split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const cc = ccRaw && ccRaw.length > 0 ? ccRaw : undefined;

  const sourcesText =
    research.sources.length > 0
      ? `\nKutatási források:\n${research.sources.map((s) => `- ${s}`).join("\n")}`
      : "";

  const text = [
    `Ügyfél: ${companyName}`,
    `Kampány: ${campaignName}`,
    `Kampány cél: ${briefData.campaign_goal}`,
    briefData.budget_range ? `Büdzsé: ${briefData.budget_range}` : null,
    briefData.start_date || briefData.end_date
      ? `Időszak: ${briefData.start_date || "?"} - ${briefData.end_date || "?"}`
      : null,
    sourcesText,
    "\nA kitöltött Agency Brief és Mediaplan xlsx csatolva.",
  ]
    .filter(Boolean)
    .join("\n");

  await sgMail.send({
    to: process.env.PM_EMAIL!,
    from: "info@valueonboard.com",
    cc,
    subject: `Új brief: ${companyName} — ${campaignName}`,
    text,
    attachments: [
      {
        content: xlsxBuffer.toString("base64"),
        filename: `${companyName}-brief-mediaplan.xlsx`,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        disposition: "attachment",
      },
    ],
  });
}
