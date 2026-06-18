import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/better-auth/auth';
import { connectToDatabase } from '@/database/mongoose';
import { Profile } from '@/database/models/Profile';
import { ExternalPortfolio, IExternalAsset } from '@/database/models/ExternalPortfolio';
import { Sandbox, ISandboxPosition } from '@/database/models/Sandbox';
import { AcademyProgress, IAcademyLessonProgress } from '@/database/models/AcademyProgress';
import { academyLessons } from '@/lib/academy';
import { groqChat } from '@/lib/groq';
import { nvidiaChat } from '@/lib/nvidia';

type AssistantBody = {
  message?: string;
  lessonSlug?: string;
};

const SYSTEM_PROMPT = `You are the FinNext Academy Tutor.

Rules:
- Explain concepts in simple beginner-friendly language.
- Use real-world examples.
- Avoid complex financial jargon.
- If jargon is necessary, explain it immediately.
- Format responses using Markdown.
- Use headings, bullet points, and bold text.
- Keep answers concise and educational.
- Relate explanations to the user's current lesson whenever possible.
- Never provide financial advice or stock recommendations.
- Focus on teaching concepts and improving financial literacy.`;

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json()) as AssistantBody;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    await connectToDatabase();
    const userId = session.user.id;

    const [profile, portfolio, sandbox, academyProgress] = (await Promise.all([
      Profile.findOne({ userId }).lean(),
      ExternalPortfolio.findOne({ userId }).lean(),
      Sandbox.findOne({ userId }).lean(),
      AcademyProgress.findOne({ userId }).lean(),
    ])) as any[];

    const progressItems = (academyProgress?.lessonProgress ?? []) as IAcademyLessonProgress[];
    const completedSlugs = new Set(progressItems.filter((item) => item.completed).map((item) => item.lessonSlug));
    const currentLesson = academyLessons.find((lesson) => lesson.slug === body.lessonSlug);
    const nextLesson = academyLessons.find((lesson) => !completedSlugs.has(lesson.slug));

    const completedLessons = academyLessons
      .filter((lesson) => completedSlugs.has(lesson.slug))
      .map((lesson) => lesson.title)
      .slice(-8);

    const portfolioAssets = ((portfolio?.assets ?? []) as IExternalAsset[])
      .map((asset) => `${asset.symbol} qty ${asset.quantity} avg ${asset.avgBuyPrice} ${asset.currency}`)
      .slice(0, 12);

    const sandboxPositions = ((sandbox?.positions ?? []) as ISandboxPosition[])
      .map((position) => `${position.ticker} qty ${position.quantity} avg ${position.avgBuyPrice} current ${position.currentPrice}`)
      .slice(0, 12);

    const context = [
      '=== USER ACADEMY CONTEXT ===',
      `Current level: ${academyProgress?.currentLevel ?? 'Beginner'}`,
      `XP earned: ${academyProgress?.xpEarned ?? 0}`,
      `Daily streak: ${academyProgress?.dailyStreak ?? 0}`,
      `Completed lessons: ${completedLessons.length ? completedLessons.join(', ') : 'None yet'}`,
      `Current lesson: ${currentLesson ? `${currentLesson.title} (${currentLesson.level}) - ${currentLesson.description}` : 'Not selected'}`,
      `Next recommended lesson from curriculum: ${nextLesson ? `${nextLesson.title} (${nextLesson.level})` : 'All lessons completed'}`,
      '',
      '=== USER FINNEXT CONTEXT ===',
      `Risk tolerance: ${profile?.riskTolerance ?? 'MEDIUM'}`,
      `Investment goal: ${profile?.investmentGoals ?? 'GROWTH'}`,
      `Real portfolio: ${portfolioAssets.length ? portfolioAssets.join('; ') : 'No imported holdings yet'}`,
      `Sandbox balance: ${sandbox?.virtualBalance ?? 100000}`,
      `Sandbox positions: ${sandboxPositions.length ? sandboxPositions.join('; ') : 'No open sandbox positions'}`,
      '',
      '=== USER QUESTION ===',
      message,
    ].join('\n');

    const reply = process.env.NVIDIA_API_KEY
      ? await nvidiaChat(SYSTEM_PROMPT, context, 900)
      : await groqChat(SYSTEM_PROMPT, context, 900);

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error('Academy assistant failed:', error);
    return NextResponse.json({ error: 'Academy assistant is unavailable right now.' }, { status: 500 });
  }
}
