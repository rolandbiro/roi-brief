import { runResearchPipeline } from "@/lib/research/pipeline";
import { fillAgencyBrief } from "@/lib/xlsx/fill-agency-brief";
import { fillMediaplan } from "@/lib/xlsx/fill-mediaplan";
import { combineWorkbooks } from "@/lib/xlsx/combine-workbook";
import { sendPmEmail } from "@/lib/delivery/send-pm-email";
import type { BriefData } from "@/types/brief";

export const maxDuration = 120;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  let briefData: BriefData;
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    briefData = JSON.parse(json);
  } catch {
    return Response.json(
      { error: "Ervenytelen retry token" },
      { status: 400 },
    );
  }

  if (!briefData?.company_name || !briefData?.campaign_goal) {
    return Response.json(
      { error: "Hianyos brief adatok a tokenben" },
      { status: 400 },
    );
  }

  try {
    const results = await runResearchPipeline(briefData);
    const briefBuffer = await fillAgencyBrief(briefData);
    const mediaplanBuffer = await fillMediaplan(results, briefData);
    const combinedBuffer = await combineWorkbooks(briefBuffer, mediaplanBuffer);
    await sendPmEmail(briefData, results, combinedBuffer);

    return Response.json({
      success: true,
      message: "Feldolgozas ujrainditva",
    });
  } catch (error) {
    console.error("[retry] Pipeline error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Ismeretlen hiba",
      },
      { status: 500 },
    );
  }
}
