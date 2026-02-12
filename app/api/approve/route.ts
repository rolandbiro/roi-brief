import { after } from 'next/server';

export async function POST(request: Request) {
  let briefData;
  try {
    const body = await request.json();
    briefData = body.briefData;
  } catch {
    return Response.json({ error: 'Érvénytelen kérés' }, { status: 400 });
  }

  if (!briefData?.company_name || !briefData?.campaign_goal) {
    return Response.json(
      { error: 'Cégnév és kampány célja kötelező' },
      { status: 400 }
    );
  }

  // Fire-and-forget: Phase 5 research pipeline trigger
  after(async () => {
    try {
      // Phase 5 will implement runResearchPipeline(briefData)
      console.log('[approve] Research pipeline triggered for:', briefData.company_name);
    } catch (error) {
      // Phase 6 will handle PM error notification
      console.error('[approve] Research pipeline error:', error);
    }
  });

  return Response.json({ approved: true });
}
