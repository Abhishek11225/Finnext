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

    return {
      slug,
      title,
      level: level.name,
      description,
      thumbnail: title,

      durationSeconds:
  title === 'Introduction to Stock Market'
    ? 269 // 4:29
    : title === 'NSE & BSE Basics'
    ? 218 // 3:38
    : title === 'Market Cap & P/E Ratio'
    ? 334 // 5:34
    : title === 'Bull vs Bear Market'
    ? 853 // 14:13
    : title === 'Candlestick Basics'
    ? 809 // 13:29
    : title === 'Fundamental Analysis'
    ? 246 // 4:06
    : title === 'Portfolio Diversification'
    ? 716 // 11:56
    : title === 'Risk Management'
    ? 763 // 12:43
    : title === 'Technical Analysis'
    ? 340 // 5:40
    : title === 'Valuation & DCF Basics'
    ? 1301 // 21:41
    : title === 'Market Psychology'
    ? 934 // 15:34
    : title === 'Economic Indicators'
    ? 57 // 0:57
    : 300,

      cloudinaryPublicId: `academy/${slug}`,

      videoUrl:
        title === 'Introduction to Stock Market'
          ? 'https://res.cloudinary.com/dz4zyjg3s/video/upload/v1781877409/vidssave.com_How_does_the_stock_market_work__-_Oliver_Elfenbaum_1080P_bskphd.mp4'
          : title === 'NSE & BSE Basics'
          ? 'https://res.cloudinary.com/dz4zyjg3s/video/upload/v1781877650/vidssave.com_What_is_a_Stock_Exchange_Stock_Market_Index__BSE_Sensex_NSE_Nifty_Index_Explained_in_Hindi_480P_u9ouek.mp4'
          : title === 'Market Cap & P/E Ratio'
          ? 'https://res.cloudinary.com/dz4zyjg3s/video/upload/v1781879600/vidssave.com_PE_Ratio_Explained_Simply___Finance_in_5_Minutes_720P_lfrzxj.mp4'
          : title === 'Bull vs Bear Market'
          ? 'https://res.cloudinary.com/dz4zyjg3s/video/upload/v1781879612/vidssave.com_Bull_Market_Vs._Bear_Market_The_Reason_You_re_Losing_Money....._720P_olcdaj.mp4'
          : title === 'Candlestick Basics'
          ? 'https://res.cloudinary.com/dz4zyjg3s/video/upload/v1781879618/vidssave.com_How_To_Read_Candlestick_Charts_FAST_Beginner_s_Guide_1080P_xmavfc.mp4'
          : title === 'Fundamental Analysis'
          ? 'https://res.cloudinary.com/dz4zyjg3s/video/upload/v1781879622/vidssave.com_1._Introduction_to_fundamental_analysis_720P_vcfru9.mp4'
          : title === 'Portfolio Diversification'
          ? 'https://res.cloudinary.com/dz4zyjg3s/video/upload/v1781879638/vidssave.com_How_to_Create_BEST_STOCK_PORTFOLIO__Diversification_for_Beginners_1080P_vbobfk.mp4'
          : title === 'Risk Management'
          ? 'https://res.cloudinary.com/dz4zyjg3s/video/upload/v1781879609/vidssave.com_7_RULES_OF_INVESTING_WARREN_BUFFETT_HINDI___MASTER_THE_BASICS_OF_RULES_OF_INVESTING___WARREN_BUFFETT_720P_j3qsse.mp4'
          : title === 'Technical Analysis'
          ? 'https://res.cloudinary.com/dz4zyjg3s/video/upload/v1781879635/vidssave.com_1._Fundamental_analysis_vs_technical_analysis_1080P_xwzcjt.mp4'
          : title === 'Valuation & DCF Basics'
          ? 'https://res.cloudinary.com/dz4zyjg3s/video/upload/v1781879609/Discounted_Cash_Flow___DCF_Model_Step_by_Step_Guide_zhuzdf.mp4'
          : title === 'Market Psychology'
          ? 'https://res.cloudinary.com/dz4zyjg3s/video/upload/v1781879607/vidssave.com_THE_PSYCHOLOGY_OF_MONEY_BY_MORGAN_HOUSEL_144P_hbauyx.mp4'
          : title === 'Economic Indicators'
          ? 'https://res.cloudinary.com/dz4zyjg3s/video/upload/v1781880340/vidssave.com_10_Key_Economic_Indicators_Explained_Must_Watch_720P_l1mgwi.mp4'
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
