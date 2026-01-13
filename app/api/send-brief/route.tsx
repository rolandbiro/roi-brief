import { renderToBuffer } from "@react-pdf/renderer";
import sgMail from "@sendgrid/mail";
import { BriefData } from "@/types/chat";
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

  // Generate PDF buffer (JSX outside try/catch for lint compliance)
  const pdfElement = <BriefPDF data={briefData} />;

  try {
    const pdfBuffer = await renderToBuffer(pdfElement);
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    // Generate email HTML
    const emailHtml = generateEmailHtml(briefData);

    // Recipient list
    const recipients = [
      clientEmail,
      process.env.BRIEF_RECIPIENT_1,
      process.env.BRIEF_RECIPIENT_2,
    ].filter(Boolean) as string[];

    // Create email messages
    const messages = recipients.map((to) => ({
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: "ROI Works Brief",
      },
      subject: `Kampány Brief: ${briefData.campaign.name}`,
      html: emailHtml,
      attachments: [
        {
          content: pdfBase64,
          filename: `brief-${briefData.campaign.name.toLowerCase().replace(/\s+/g, "-")}.pdf`,
          type: "application/pdf",
          disposition: "attachment" as const,
        },
      ],
    }));

    // Send all emails
    await Promise.all(messages.map((msg) => sgMail.send(msg)));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Send brief error:", error);
    return Response.json(
      { error: "Hiba történt a brief küldése során" },
      { status: 500 }
    );
  }
}
