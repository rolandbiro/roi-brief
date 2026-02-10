import { renderToBuffer } from "@react-pdf/renderer";
import sgMail from "@sendgrid/mail";
import type { BriefData } from "@/types/brief";
import { BriefPDF } from "@/lib/pdf-template";
import { generateEmailHtml } from "@/lib/email-template";

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: Request) {
  let briefData: BriefData;
  let clientEmail: string;

  try {
    const body = await request.json();
    briefData = body.briefData;
    clientEmail = body.clientEmail;
  } catch {
    return Response.json(
      { error: "Érvénytelen kérés" },
      { status: 400 }
    );
  }

  // Recipients: only ROI Works team (NOT the client)
  const recipients = [
    process.env.BRIEF_RECIPIENT_1,
    process.env.BRIEF_RECIPIENT_2,
  ].filter(Boolean) as string[];

  if (recipients.length === 0) {
    return Response.json(
      { error: "Nincs konfigurált címzett" },
      { status: 500 }
    );
  }

  // Generate PDF buffer (JSX outside try/catch for lint compliance)
  const pdfElement = <BriefPDF data={briefData} />;

  try {
    const pdfBuffer = await renderToBuffer(pdfElement);
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    // Generate email HTML (pass clientEmail for team reference)
    const emailHtml = generateEmailHtml(briefData, clientEmail);

    const filename = `brief-${(briefData.company_name || "brief").toLowerCase().replace(/\s+/g, "-")}.pdf`;

    // Create email messages
    const messages = recipients.map((to) => ({
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: "ROI Works Brief",
      },
      subject: `Kampány Brief: ${briefData.company_name || "Új brief"}`,
      html: emailHtml,
      attachments: [
        {
          content: pdfBase64,
          filename,
          type: "application/pdf",
          disposition: "attachment" as const,
        },
      ],
    }));

    // Send all emails
    await Promise.all(messages.map((msg) => sgMail.send(msg)));

    return Response.json({ success: true });
  } catch (error: unknown) {
    console.error("Send brief error:", error);

    // Check for SendGrid specific errors
    const sgError = error as { code?: number; message?: string };
    if (sgError.code === 401) {
      return Response.json(
        { error: "Email küldési hiba: érvénytelen API kulcs. Kérjük, ellenőrizze a SendGrid konfigurációt." },
        { status: 500 }
      );
    }
    if (sgError.code === 403) {
      return Response.json(
        { error: "Email küldési hiba: a feladó email cím nincs hitelesítve a SendGrid-ben." },
        { status: 500 }
      );
    }

    return Response.json(
      { error: "Hiba történt a brief küldése során. Kérjük, próbálja újra később." },
      { status: 500 }
    );
  }
}
