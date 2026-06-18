import { Schema, model, models, Document } from 'mongoose';

export interface IAcademyLessonProgress {
  lessonSlug: string;
  completed: boolean;
  quizScore: number;
  notes: string;
  learningSeconds: number;
  completedAt?: Date;
  updatedAt?: Date;
}

export interface IAcademyProgress extends Document {
  userId: string;
  currentLevel: 'Beginner' | 'Intermediate' | 'Pro';
  dailyStreak: number;
  xpEarned: number;
  lessonProgress: IAcademyLessonProgress[];
  createdAt: Date;
  updatedAt: Date;
}

const LessonProgressSchema = new Schema<IAcademyLessonProgress>(
  {
    lessonSlug: { type: String, required: true },
    completed: { type: Boolean, default: false },
    quizScore: { type: Number, default: 0, min: 0, max: 100 },
    notes: { type: String, default: '' },
    learningSeconds: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date },
  },
  { _id: false, timestamps: true }
);

const AcademyProgressSchema = new Schema<IAcademyProgress>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    currentLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Pro'],
      default: 'Beginner',
    },
    dailyStreak: { type: Number, default: 1, min: 0 },
    xpEarned: { type: Number, default: 0, min: 0 },
    lessonProgress: { type: [LessonProgressSchema], default: [] },
  },
  { timestamps: true }
);

export const AcademyProgress =
  models.AcademyProgress || model<IAcademyProgress>('AcademyProgress', AcademyProgressSchema);
