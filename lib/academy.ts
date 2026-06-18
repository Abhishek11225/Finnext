export type AcademyLevelName = 'Beginner' | 'Intermediate' | 'Pro';

export type AcademyLessonSeed = {
  slug: string;
  title: string;
  level: AcademyLevelName;
  description: string;
  thumbnail: string;
  durationSeconds: number;
  cloudinaryPublicId: string;
  videoUrl?: string;
};

export type AcademyLevelSeed = {
  name: AcademyLevelName;
  badge: string;
  tone: string;
  accent: string;
  unlockAtPercent: number;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const academyLevels: AcademyLevelSeed[] = [
  {
    name: 'Beginner',
    badge: 'Beginner Investor',
    tone: 'Start with market foundations, exchange basics, and investing vocabulary.',
    accent: '#0FEDBE',
    unlockAtPercent: 0,
  },
  {
    name: 'Intermediate',
    badge: 'Smart Investor',
    tone: 'Build practical analysis habits, watchlist routines, and portfolio discipline.',
    accent: '#FDD458',
    unlockAtPercent: 100,
  },
  {
    name: 'Pro',
    badge: 'Market Analyst',
    tone: 'Advance into valuation, market psychology, portfolio optimization, and research.',
    accent: '#FF495B',
    unlockAtPercent: 100,
  },
];

const beginnerTopics = [
  ['Introduction to Stock Market', 'Understand what markets do, why companies list shares, and how investors participate.'],
  ['NSE & BSE Basics', 'Learn how India\'s major exchanges organize listed stocks, indices, and market sessions.'],
  ['Market Cap & P/E Ratio', 'Separate large-cap, mid-cap, and small-cap companies by size and use price-to-earnings as a valuation lens.'],
  ['Bull vs Bear Market', 'Recognize trend regimes and how investor behavior changes in each environment.']
] as const;

const intermediateTopics = [
  ['Candlestick Basics', 'Read candle bodies, wicks, and short-term price intent without overfitting signals.'],
  ['Fundamental Analysis', 'Evaluate businesses through revenue, margins, debt, growth, and quality.'],
  ['Portfolio Diversification', 'Balance position count, sector exposure, and correlation risk.'],
  ['Risk Management', 'Use stop rules, allocation limits, and review habits to protect capital.']
] as const;

const proTopics = [
  ['Technical Analysis', 'Combine trend, momentum, volatility, and market structure responsibly.'],
  ['Valuation & DCF Basics', 'Estimate intrinsic value using cash flows, discount rates, and assumptions.'],
  ['Market Psychology', 'Study fear, greed, confirmation bias, and crowd behavior.'],
  ['Economic Indicators', 'Connect inflation, rates, GDP, and liquidity to equity markets.']
] as const;

const topicsByLevel = {
  Beginner: beginnerTopics,
  Intermediate: intermediateTopics,
  Pro: proTopics,
};

export const academyLessons: AcademyLessonSeed[] = academyLevels.flatMap((level) =>
  topicsByLevel[level.name].map(([title, description], index) => {
    const slug = slugify(title);
    const isIntroLesson = level.name === 'Beginner' && slug === 'introduction-to-stock-market';

    return {
      slug,
      title,
      level: level.name,
      description,
      thumbnail: title,
      durationSeconds: isIntroLesson ? 338 : 480 + ((index + level.name.length) % 6) * 120,
      cloudinaryPublicId: `academy/${slug}`,
      videoUrl: isIntroLesson
        ? 'https://res.cloudinary.com/dz4zyjg3s/video/upload/v1781790181/vidssave.com_Share_Market_Explained_by_Dhruv_Rathee_Hindi___Learn_Everything_on_Investing_Money_1080P_dlalmt.mp4'
        : undefined,
    };
  })
);

export const getAcademyVideoUrl = (publicId: string) => {
  const baseUrl = process.env.ACADEMY_CLOUDINARY_VIDEO_BASE_URL || process.env.NEXT_PUBLIC_ACADEMY_CLOUDINARY_VIDEO_BASE_URL;
  if (!baseUrl) return '';

  return `${baseUrl.replace(/\/$/, '')}/${publicId}.mp4`;
};

export const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(1, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  if (remainingSeconds === 0) return `${minutes} min`;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} min`;
};
