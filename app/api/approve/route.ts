import { after } from "next/server";
import { runResearchPipeline } from "@/lib/research/pipeline";
import { fillAgencyBrief } from "@/lib/xlsx/fill-agency-brief";
import { fillMediaplan } from "@/lib/xlsx/fill-mediaplan";
import { combineWorkbooks } from "@/lib/xlsx/combine-workbook";
import { sendPmEmail } from "@/lib/delivery/send-pm-email";
import { sendErrorEmail } from "@/lib/delivery/send-error-email";
import { generateBriefPdf } from "@/lib/pdf/generate-brief-pdf";

export const maxDuration = 120;

export async function POST(request: Request) {
  let briefData;
  try {
    const body = await request.json();
    briefData = body.briefData;
  } catch {
    return Response.json({ error: "Ervenytelen keres" }, { status: 400 });
  }

  if (!briefData?.company_name || !briefData?.campaign_goal) {
    return Response.json(
      { error: "Cegnev es kampany celja kotelezo" },
      { status: 400 },
    );
  }

  const retryToken = Buffer.from(JSON.stringify(briefData)).toString(
    "base64url",
  );

  after(async () => {
    let results;
    let briefBuffer: Buffer | undefined;

    // Step 1: Research pipeline
    try {
      results = await runResearchPipeline(briefData);
      console.log(
        "[approve] Research complete:",
        results.template_type,
        "- channels:",
        results.channels.length,
      );
    } catch (error) {
      console.error("[approve] Research pipeline error:", error);
      try {
        await sendErrorEmail(
          briefData,
          "Kutatas",
          error instanceof Error ? error.message : "Ismeretlen hiba",
          retryToken,
        );
      } catch (emailErr) {
        console.error("[approve] Error email send failed:", emailErr);
      }
      return;
    }

    // Step 2: Agency Brief xlsx
    try {
      briefBuffer = await fillAgencyBrief(briefData);
    } catch (error) {
      console.error("[approve] Agency Brief fill error:", error);
      try {
        await sendErrorEmail(
          briefData,
          "XLSX generalas (Agency Brief)",
          error instanceof Error ? error.message : "Ismeretlen hiba",
          retryToken,
        );
      } catch (emailErr) {
        console.error("[approve] Error email send failed:", emailErr);
      }
      return;
    }

    // Step 3: Mediaplan xlsx
    let mediaplanBuffer: Buffer;
    try {
      mediaplanBuffer = await fillMediaplan(results, briefData);
    } catch (error) {
      console.error("[approve] Mediaplan fill error:", error);
      try {
        await sendErrorEmail(
          briefData,
          "XLSX generalas (Mediaplan)",
          error instanceof Error ? error.message : "Ismeretlen hiba",
          retryToken,
          briefBuffer,
        );
      } catch (emailErr) {
        console.error("[approve] Error email send failed:", emailErr);
      }
      return;
    }

    // Step 4: Combine workbooks
    let combinedBuffer: Buffer;
    try {
      combinedBuffer = await combineWorkbooks(briefBuffer, mediaplanBuffer);
    } catch (error) {
      console.error("[approve] Combine workbooks error:", error);
      try {
        await sendErrorEmail(
          briefData,
          "XLSX osszefuzes",
          error instanceof Error ? error.message : "Ismeretlen hiba",
          retryToken,
          briefBuffer,
        );
      } catch (emailErr) {
        console.error("[approve] Error email send failed:", emailErr);
      }
      return;
    }

    // Step 5: Generate PDF for client brief
    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = await generateBriefPdf(briefData);
      console.log("[approve] PDF generated successfully");
    } catch (error) {
      // PDF hiba nem blokkolja az email küldést — XLSX elég
      console.error("[approve] PDF generation failed:", error);
    }

    // Step 6: Send PM email
    try {
      await sendPmEmail(briefData, results, combinedBuffer, pdfBuffer);
      console.log("[approve] PM email sent successfully");
    } catch (error) {
      // NEM kuldunk error emailt — infinite loop lenne
      console.error("[approve] PM email send failed:", error);
    }
  });

  return Response.json({ approved: true });
}
