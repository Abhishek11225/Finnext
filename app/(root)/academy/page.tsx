'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Award,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  CirclePlay,
  Clock3,
  GraduationCap,
  Loader2,
  Lock,
  Play,
  Send,
  Unlock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

type LevelName = 'Beginner' | 'Intermediate' | 'Pro';

type Lesson = {
  slug: string;
  title: string;
  level: LevelName;
  description: string;
  thumbnail: string;
  duration: string;
  videoUrl: string;
  completed: boolean;
};

type Level = {
  name: LevelName;
  badge: string;
  tone: string;
  status: 'Unlocked' | 'In Progress' | 'Locked';
  accent: string;
  complete: number;
  lessons: Lesson[];
};

type AcademyPayload = {
  levels: Level[];
  summary: {
    lessonsCompleted: number;
    totalLessons: number;
    courseCompletionPercent: number;
    currentLevel: LevelName;
    currentBadge: string;
    unlockedBadges: string[];
  };
};

export default function AcademyPage() {
  const [academy, setAcademy] = useState<AcademyPayload | null>(null);
  const [selectedLevelName, setSelectedLevelName] = useState<LevelName>('Beginner');
  const [selectedLessonSlug, setSelectedLessonSlug] = useState('');
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantMessage, setAssistantMessage] = useState('Welcome! Select a lesson and ask me to explain it simply, or ask any question about the concepts.');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadAcademy = async () => {
    setError('');
    try {
      const response = await fetch('/api/academy', { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load Academy data.');

      const payload: AcademyPayload = await response.json();
      setAcademy(payload);

      // Default selection logic: current level from summary, first uncompleted lesson in that level
      const currentLevel = payload.levels.find((level) => level.name === payload.summary.currentLevel) ?? payload.levels[0];
      const nextLesson = currentLevel.lessons.find((lesson) => !lesson.completed) ?? currentLevel.lessons[0];

      setSelectedLevelName(currentLevel.name);
      setSelectedLessonSlug(nextLesson?.slug ?? '');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load Academy data.');
    }
  };

  useEffect(() => {
    loadAcademy();
  }, []);

  const selectedLevel = useMemo(() => {
    if (!academy) return null;
    return academy.levels.find((level) => level.name === selectedLevelName) ?? academy.levels[0];
  }, [academy, selectedLevelName]);

  const selectedLesson = useMemo(() => {
    if (!selectedLevel) return null;
    return selectedLevel.lessons.find((lesson) => lesson.slug === selectedLessonSlug) ?? selectedLevel.lessons[0];
  }, [selectedLevel, selectedLessonSlug]);

  const saveLessonProgress = async (completed = false) => {
    if (!selectedLesson) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/academy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonSlug: selectedLesson.slug,
          completed,
        }),
      });

      if (!response.ok) throw new Error('Could not save Academy progress.');

      const payload: AcademyPayload = await response.json();
      setAcademy(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save Academy progress.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssistant = async (prompt?: string) => {
    const question = (prompt ?? assistantInput).trim();
    if (!question || isAssistantLoading) return;

    setAssistantInput('');
    setIsAssistantLoading(true);

    try {
      const response = await fetch('/api/academy/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          lessonSlug: selectedLesson?.slug,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Academy assistant failed.');

      setAssistantMessage(data.message ?? 'I could not generate a response. Please try again.');
    } catch (err: unknown) {
      setAssistantMessage(err instanceof Error ? err.message : 'Academy assistant is unavailable right now.');
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const handleNextLesson = () => {
    if (!academy || !selectedLevel || !selectedLesson) return;
    const currentIndex = selectedLevel.lessons.findIndex((l) => l.slug === selectedLesson.slug);
    if (currentIndex !== -1 && currentIndex < selectedLevel.lessons.length - 1) {
      setSelectedLessonSlug(selectedLevel.lessons[currentIndex + 1].slug);
    } else {
      const nextLevelIndex = academy.levels.findIndex((lvl) => lvl.name === selectedLevel.name) + 1;
      if (nextLevelIndex < academy.levels.length) {
        const nextLvl = academy.levels[nextLevelIndex];
        if (nextLvl.status !== 'Locked') {
          setSelectedLevelName(nextLvl.name);
          setSelectedLessonSlug(nextLvl.lessons[0].slug);
        }
      }
    }
  };

  if (error) {
    return (
      <main className="academy-container">
        <div className="academy-card error-card">
          <h1 className="academy-title">Academy</h1>
          <p className="error-text">{error}</p>
          <button className="academy-primary-btn" onClick={loadAcademy}>
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (!academy || !selectedLevel || !selectedLesson) {
    return (
      <main className="academy-container">
        <div className="academy-loader">
          <Loader2 size={32} className="spin-animation" />
        </div>
      </main>
    );
  }

  const isCurrentLevelCompleted = selectedLevel.complete >= 100;
  const isLastLessonOfLevel = selectedLevel.lessons[selectedLevel.lessons.length - 1].slug === selectedLesson.slug;

  return (
    <main className="academy-container">
      {/* Top Header & Progress */}
      <section className="academy-header-section">
        <div className="academy-header-info">
          <div className="academy-logo-wrap">
            <GraduationCap size={32} className="academy-logo-icon" />
          </div>
          <div>
            <h1 className="academy-title" id="academy-main-title">FinNext Academy</h1>
            <p className="academy-subtitle">Master the markets, step by step.</p>
          </div>
        </div>

        <div className="academy-global-progress-card">
          <div className="progress-details">
            <span className="progress-label">Course Progress</span>
            <span className="progress-count">{academy.summary.lessonsCompleted} / {academy.summary.totalLessons} Lessons</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${academy.summary.courseCompletionPercent}%` }}
            />
          </div>
          <div className="progress-footer">
            <span className="progress-percentage">{academy.summary.courseCompletionPercent}% Completed</span>
            <div className="unlocked-badges-list">
              {academy.summary.unlockedBadges.map((badge) => (
                <span key={badge} className="badge-pill" title={`Unlocked: ${badge}`}>
                  <Award size={12} /> {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Level Selector Cards */}
      <section className="academy-levels-grid">
        {academy.levels.map((level) => {
          const isActive = selectedLevelName === level.name;
          const isLocked = level.status === 'Locked';
          return (
            <button
              key={level.name}
              className={`level-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
              onClick={() => {
                if (isLocked) return;
                setSelectedLevelName(level.name);
                setSelectedLessonSlug(level.lessons.find((lesson) => !lesson.completed)?.slug ?? level.lessons[0]?.slug ?? '');
              }}
              disabled={isLocked}
              style={{ '--level-accent': level.accent } as React.CSSProperties}
            >
              <div className="level-card-header">
                <div className="level-status-indicator">
                  {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                  <span>{level.status}</span>
                </div>
                <span className="level-percent">{level.complete}%</span>
              </div>
              <h3 className="level-name">{level.name}</h3>
              <p className="level-tone">{level.tone}</p>
              <div className="level-badge-info">
                <span className="level-badge-name">🏆 {level.badge}</span>
              </div>
              <div className="level-progress-bar">
                <div className="level-progress-fill" style={{ width: `${level.complete}%`, backgroundColor: level.accent }} />
              </div>
            </button>
          );
        })}
      </section>

      {/* Main Content Workspace */}
      <section className="academy-workspace-grid">
        {/* Left: Lessons List */}
        <div className="academy-sidebar-card">
          <h2 className="sidebar-title">
            <BookOpen size={16} /> Lessons in {selectedLevel.name}
          </h2>
          <div className="lessons-list">
            {selectedLevel.lessons.map((lesson, index) => {
              const isSelected = selectedLesson.slug === lesson.slug;
              return (
                <button
                  key={lesson.slug}
                  className={`lesson-item-btn ${isSelected ? 'selected' : ''} ${lesson.completed ? 'completed' : ''}`}
                  onClick={() => setSelectedLessonSlug(lesson.slug)}
                >
                  <div className="lesson-item-status">
                    {lesson.completed ? (
                      <CheckCircle2 size={16} className="status-icon completed" />
                    ) : (
                      <CirclePlay size={16} className="status-icon pending" />
                    )}
                  </div>
                  <div className="lesson-item-details">
                    <span className="lesson-item-title">{index + 1}. {lesson.title}</span>
                    <span className="lesson-item-duration"><Clock3 size={11} /> {lesson.duration}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="badges-list-footer-card">
            <h3 className="card-mini-title"><Award size={14} /> Level Rewards</h3>
            <div className="level-reward-item">
              <span className="reward-icon">{selectedLevel.name === 'Beginner' ? '🟢' : selectedLevel.name === 'Intermediate' ? '🟡' : '🔴'}</span>
              <div className="reward-details">
                <strong>{selectedLevel.badge}</strong>
                <p>{selectedLevel.complete >= 100 ? 'Unlocked & visible on profile' : `Complete all ${selectedLevel.name} lessons to unlock.`}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Lesson Player & Assistant */}
        <div className="academy-main-panel">
          <div className="video-player-container">
            {selectedLesson.videoUrl ? (
              <video
                key={selectedLesson.videoUrl}
                className="lesson-video-player"
                controls
                poster=""
                preload="metadata"
              >
                <source src={selectedLesson.videoUrl} />
              </video>
            ) : (
              <div className="no-video-placeholder">
                <CirclePlay size={48} className="placeholder-icon" />
                <h3>No video configured for this lesson</h3>
                <p>Cloudinary URL pending for {selectedLesson.title}</p>
              </div>
            )}
          </div>

          <div className="lesson-info-row">
            <div className="lesson-headline">
              <span className="lesson-level-pill" style={{ borderColor: selectedLevel.accent, color: selectedLevel.accent }}>
                {selectedLesson.level}
              </span>
              <h2 className="lesson-title">{selectedLesson.title}</h2>
            </div>
            <div className="lesson-actions">
              <button
                className={`complete-btn ${selectedLesson.completed ? 'completed' : ''}`}
                onClick={() => saveLessonProgress(!selectedLesson.completed)}
                disabled={isSaving}
              >
                <CheckCircle2 size={16} />
                {isSaving ? 'Saving...' : selectedLesson.completed ? 'Completed' : 'Mark as Complete'}
              </button>
              
              <button 
                className="next-lesson-btn"
                onClick={handleNextLesson}
                disabled={isLastLessonOfLevel && isCurrentLevelCompleted}
              >
                <span>Next Lesson</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <p className="lesson-description-text">{selectedLesson.description}</p>

          {/* AI Assistant card */}
          <div className="assistant-section-card">
            <div className="assistant-header-row">
              <div className="assistant-badge">
                <Bot size={16} />
                <span>AI Tutor</span>
              </div>
              <h3 className="assistant-title">AI Learning Assistant</h3>
            </div>
            <div className="assistant-chat-bubble">
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {assistantMessage}
                </ReactMarkdown>
              </div>
            </div>
            <div className="assistant-actions-row">
              <button 
                className="quick-prompt-btn" 
                onClick={() => handleAssistant('Explain this lesson simply')}
                disabled={isAssistantLoading}
              >
                <Sparkles size={13} />
                <span>Explain this lesson simply</span>
              </button>
              
              <div className="assistant-input-box">
                <input
                  type="text"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAssistant()}
                  placeholder="Ask a custom question..."
                  disabled={isAssistantLoading}
                />
                <button 
                  className="send-btn" 
                  onClick={() => handleAssistant()} 
                  disabled={isAssistantLoading || !assistantInput.trim()}
                >
                  {isAssistantLoading ? <Loader2 size={14} className="spin-animation" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
