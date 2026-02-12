import { renderToBuffer } from "@react-pdf/renderer";
import { BriefPDF } from "@/lib/pdf-template";
import type { BriefData } from "@/types/brief";

export async function generateBriefPdf(briefData: BriefData): Promise<Buffer> {
  const pdfElement = <BriefPDF data={briefData} />;
  const buffer = await renderToBuffer(pdfElement);
  return Buffer.from(buffer);
}
