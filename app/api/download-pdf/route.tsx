import { renderToBuffer } from "@react-pdf/renderer";
import { BriefPDF } from "@/lib/pdf-template";
import type { BriefData } from "@/types/brief";

export async function POST(request: Request) {
  let briefData: BriefData;

  try {
    const body = await request.json();
    briefData = body.briefData;
  } catch {
    return Response.json(
      { error: "Hiányzó brief adatok" },
      { status: 400 }
    );
  }

  if (!briefData) {
    return Response.json(
      { error: "Hiányzó brief adatok" },
      { status: 400 }
    );
  }

  // JSX outside try/catch for lint compliance (same pattern as send-brief)
  const pdfElement = <BriefPDF data={briefData} />;

  try {
    const pdfBuffer = await renderToBuffer(pdfElement);
    const bytes = new Uint8Array(pdfBuffer);

    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="roi-works-brief.pdf"',
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return Response.json(
      { error: "Hiba a PDF generálás során" },
      { status: 500 }
    );
  }
}
