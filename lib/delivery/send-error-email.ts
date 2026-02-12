import sgMail from "@sendgrid/mail";
import type { BriefData } from "@/types/brief";

export async function sendErrorEmail(
  briefData: BriefData,
  failedStep: string,
  errorMessage: string,
  retryToken: string,
  partialXlsx?: Buffer,
): Promise<void> {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

  const companyName = briefData.company_name;
  const campaignName = briefData.campaign_name || `${companyName} kampány`;
  const retryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/retry/${retryToken}`;

  const ccRaw = process.env.PM_CC_EMAILS?.split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const cc = ccRaw && ccRaw.length > 0 ? ccRaw : undefined;

  const text = [
    `Hiba történt a brief feldolgozás során.`,
    ``,
    `Ügyfél: ${companyName}`,
    `Kampány: ${campaignName}`,
    ``,
    `Hibás lépés: ${failedStep}`,
    `Hiba: ${errorMessage}`,
    ``,
    partialXlsx
      ? `A részben elkészült xlsx csatolva. A ${failedStep} lépés nem sikerült.`
      : `Az xlsx generálás nem készült el.`,
    ``,
    `Újrapróbálható az alábbi linkre küldött POST kéréssel:`,
    retryUrl,
  ].join("\n");

  const attachments = partialXlsx
    ? [
        {
          content: partialXlsx.toString("base64"),
          filename: `${companyName}-brief-reszleges.xlsx`,
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          disposition: "attachment" as const,
        },
      ]
    : [];

  await sgMail.send({
    to: process.env.PM_EMAIL!,
    from: "info@valueonboard.com",
    cc,
    subject: `Brief hiba: ${companyName} — ${campaignName}`,
    text,
    attachments,
  });
}
