import { after } from 'next/server';
import { runResearchPipeline } from '@/lib/research/pipeline';

export const maxDuration = 120; // 2 perc — after() callback-nek kell az idő

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
      const results = await runResearchPipeline(briefData);
      // Phase 6 will store/send results
      console.log('[approve] Research complete:', results.template_type, '- channels:', results.channels.length);
    } catch (error) {
      // Phase 6 will handle PM error notification
      console.error('[approve] Research pipeline error:', error);
    }
  });

  return Response.json({ approved: true });
}
