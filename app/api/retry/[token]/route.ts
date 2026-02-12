import { runResearchPipeline } from "@/lib/research/pipeline";
import { fillAgencyBrief } from "@/lib/xlsx/fill-agency-brief";
import { fillMediaplan } from "@/lib/xlsx/fill-mediaplan";
import { combineWorkbooks } from "@/lib/xlsx/combine-workbook";
import { sendPmEmail } from "@/lib/delivery/send-pm-email";
import type { BriefData } from "@/types/brief";

export const maxDuration = 120;

function decodeBriefData(token: string): BriefData {
  const json = Buffer.from(token, "base64url").toString("utf8");
  return JSON.parse(json);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  let companyName = "?";
  try {
    const data = decodeBriefData(token);
    companyName = data.company_name || "?";
  } catch {
    return new Response("Érvénytelen retry token", { status: 400 });
  }

  const html = `<!DOCTYPE html>
<html lang="hu">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Brief újrafeldolgozás</title>
<style>
  body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
  .card { background: white; border-radius: 12px; padding: 2rem; max-width: 400px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  h1 { font-size: 1.2rem; margin: 0 0 0.5rem; }
  p { color: #666; margin: 0 0 1.5rem; }
  button { background: #16a34a; color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-size: 1rem; cursor: pointer; }
  button:hover { background: #15803d; }
  button:disabled { background: #9ca3af; cursor: not-allowed; }
  .result { margin-top: 1rem; padding: 0.75rem; border-radius: 8px; }
  .success { background: #dcfce7; color: #166534; }
  .error { background: #fef2f2; color: #991b1b; }
</style>
</head>
<body>
<div class="card">
  <h1>Brief újrafeldolgozás</h1>
  <p>Ügyfél: <strong>${companyName}</strong></p>
  <button id="btn" onclick="retry()">Újraindítás</button>
  <div id="result"></div>
</div>
<script>
async function retry() {
  const btn = document.getElementById('btn');
  const result = document.getElementById('result');
  btn.disabled = true;
  btn.textContent = 'Feldolgozás folyamatban...';
  result.className = 'result';
  result.textContent = '';
  try {
    const res = await fetch(window.location.href, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      result.className = 'result success';
      result.textContent = 'Sikeres! Az email elküldve.';
      btn.textContent = 'Kész';
    } else {
      result.className = 'result error';
      result.textContent = 'Hiba: ' + (data.error || 'Ismeretlen hiba');
      btn.disabled = false;
      btn.textContent = 'Újrapróbálás';
    }
  } catch (e) {
    result.className = 'result error';
    result.textContent = 'Hálózati hiba';
    btn.disabled = false;
    btn.textContent = 'Újrapróbálás';
  }
}
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  let briefData: BriefData;
  try {
    briefData = decodeBriefData(token);
  } catch {
    return Response.json(
      { error: "Érvénytelen retry token" },
      { status: 400 },
    );
  }

  if (!briefData?.company_name || !briefData?.campaign_goal) {
    return Response.json(
      { error: "Hiányos brief adatok a tokenben" },
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
      message: "Feldolgozás újraindítva",
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
