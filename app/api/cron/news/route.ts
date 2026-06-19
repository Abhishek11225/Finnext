import { NextResponse } from 'next/server';
import { sendDailyNewsSummaryTask } from '@/lib/cron/tasks';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret') || req.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || (secret !== `Bearer ${cronSecret}` && secret !== cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sendDailyNewsSummaryTask();
    return NextResponse.json(result);
  } catch (error) {
    console.error('News cron failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
