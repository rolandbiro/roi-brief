import { extractText } from "unpdf";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { base64 } = await request.json();

    if (!base64) {
      return Response.json({ error: "No PDF data provided" }, { status: 400 });
    }

    // Convert base64 to Uint8Array
    const pdfBuffer = Buffer.from(base64, "base64");
    const pdfData = new Uint8Array(pdfBuffer);

    // Extract text using unpdf
    const { text } = await extractText(pdfData);

    return Response.json({
      text: text,
      success: true,
    });
  } catch (error) {
    console.error("PDF parse error:", error);
    return Response.json(
      { error: "Hiba történt a PDF feldolgozása során", text: "" },
      { status: 500 }
    );
  }
}
