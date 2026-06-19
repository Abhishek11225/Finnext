import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/database/mongoose';
import { AcademyProgress, IAcademyLessonProgress } from '@/database/models/AcademyProgress';
import { getAuth } from '@/lib/better-auth/auth';
import { academyLessons, academyLevels, formatDuration, getAcademyVideoUrl } from '@/lib/academy';

type AcademyUpdateBody = {
  lessonSlug?: string;
  completed?: boolean;
};

const buildAcademyPayload = async (userId: string) => {
  let progress = await AcademyProgress.findOne({ userId });

  if (!progress) {
    progress = await AcademyProgress.create({ userId });
  }

  const progressBySlug = new Map<string, IAcademyLessonProgress>(
    progress.lessonProgress.map((lesson: IAcademyLessonProgress) => [lesson.lessonSlug, lesson])
  );

  const lessons = academyLessons.map((lesson) => {
    const saved = progressBySlug.get(lesson.slug);

    return {
      ...lesson,
      duration: formatDuration(lesson.durationSeconds),
      videoUrl: lesson.videoUrl ?? getAcademyVideoUrl(lesson.cloudinaryPublicId),
      completed: Boolean(saved?.completed),
    };
  });

  const completedLessons = lessons.filter((lesson) => lesson.completed);
  const completedByLevel = new Map<string, number>();

  for (const lesson of completedLessons) {
    completedByLevel.set(lesson.level, (completedByLevel.get(lesson.level) ?? 0) + 1);
  }

  const getLevelLessonsCount = (levelName: string) => lessons.filter((l) => l.level === levelName).length;

  const beginnerCount = getLevelLessonsCount('Beginner') || 1;
  const intermediateCount = getLevelLessonsCount('Intermediate') || 1;

  const beginnerPercent = Math.round(((completedByLevel.get('Beginner') ?? 0) / beginnerCount) * 100);
  const intermediatePercent = Math.round(((completedByLevel.get('Intermediate') ?? 0) / intermediateCount) * 100);

  const levelPayload = academyLevels.map((level) => {
    const levelLessons = lessons.filter((lesson) => lesson.level === level.name);
    const completed = levelLessons.filter((lesson) => lesson.completed).length;
    const complete = Math.round((completed / levelLessons.length) * 100);
    const locked =
      (level.name === 'Intermediate' && beginnerPercent < level.unlockAtPercent) ||
      (level.name === 'Pro' && intermediatePercent < level.unlockAtPercent);

    return {
      ...level,
      status: locked ? 'Locked' : complete > 0 && complete < 100 ? 'In Progress' : 'Unlocked',
      complete,
      lessons: levelLessons,
    };
  });

  const unlockedBadges = levelPayload
    .filter((level) => level.complete >= 100)
    .map((level) => level.badge);

  const currentLevel =
    levelPayload.find((level) => level.name === progress.currentLevel && level.status !== 'Locked') ??
    levelPayload.find((level) => level.status !== 'Locked') ??
    levelPayload[0];

  return {
    levels: levelPayload,
    summary: {
      lessonsCompleted: completedLessons.length,
      totalLessons: lessons.length,
      courseCompletionPercent: Math.round((completedLessons.length / lessons.length) * 100),
      currentLevel: currentLevel.name,
      currentBadge: currentLevel.badge,
      unlockedBadges,
    },
  };
};

export async function GET(req: NextRequest) {
  const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const payload = await buildAcademyPayload(session.user.id);

  return NextResponse.json(payload);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json()) as AcademyUpdateBody;
    const { lessonSlug, completed } = body;
    const lesson = academyLessons.find((item) => item.slug === lessonSlug);

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    await connectToDatabase();
    let progress = await AcademyProgress.findOne({ userId: session.user.id });

    if (!progress) {
      progress = await AcademyProgress.create({ userId: session.user.id });
    }

    const existing = progress.lessonProgress.find((item: IAcademyLessonProgress) => item.lessonSlug === lessonSlug);
    const wasCompleted = Boolean(existing?.completed);

    if (existing) {
      if (typeof completed === 'boolean') {
        existing.completed = completed;
        if (completed && !existing.completedAt) {
          existing.completedAt = new Date();
        }
      }
    } else {
      progress.lessonProgress.push({
        lessonSlug,
        completed: Boolean(completed),
        quizScore: 0,
        notes: '',
        learningSeconds: 0,
        completedAt: completed ? new Date() : undefined,
      });
    }

    if (completed && !wasCompleted) {
      progress.currentLevel = lesson.level;
    }

    await progress.save();

    const payload = await buildAcademyPayload(session.user.id);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Failed to update academy progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
