export type TrainingType = 'fingerboard' | 'campus' | 'flexibility' | 'strength' | 'endurance';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'expert' | 'maintenance';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Sex = 'male' | 'female' | 'other';
export type Equipment = 'fingerboard' | 'campus_board' | 'climbing_wall' | 'system_wall' | 'pull_up_bar' | 'weights';

// A single ordered step in a step-by-step training, as returned by the training API.
export type StepPhase = 'prepare' | 'hang' | 'rest' | 'recover' | 'work' | 'stretch';

export interface TrainingStep {
  order: number;
  phase: StepPhase;
  label?: string;
  durationSeconds: number;
  imageUrl?: string;
  instructions?: string;
}

export interface UserProfile {
  age: number;
  sex: Sex;
  weight: number;
  height: number;
  equipment: Equipment[];
  wallDegree?: number;
  experienceYears: number;
  climbingGrade?: string;
}

export interface WorkoutTranslation {
  name?: string;
  description?: string;
  coachTip?: string;
  targetMuscle?: string;
}

export interface PlanTranslation {
  name?: string;
  tagline?: string;
  description?: string;
  coachNote?: string;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  type: TrainingType;
  level?: DifficultyLevel;
  difficulty?: Difficulty;
  targetMuscle?: string;
  imageUrl?: string;
  hangTime: number;
  restTime: number;
  reps: number;
  sets: number;
  recoverTime: number;
  coachTip?: string;
  isPreset?: boolean;
  // Ordered steps from the training API. When present, TimerScreen walks
  // these directly instead of computing the sequence from hangTime/restTime/reps/sets.
  steps?: TrainingStep[];
  translations?: Record<string, WorkoutTranslation>;
}

export interface PlanSession {
  dayLabel: string;
  dayIndex: number; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  workouts: Workout[];
}

export interface TrainingPlan {
  id: string;
  name: string;
  emoji: string;
  level: DifficultyLevel;
  tagline: string;
  description: string;
  coachNote: string;
  daysPerWeek: number;
  weeks: number;
  sessions: PlanSession[];
  isPreset: boolean;
  isActive?: boolean;
  activatedAt?: string;
  startDate?: string; // ISO date — user-chosen plan start (today or next Monday)
  notificationsEnabled?: boolean;
  notificationTime?: string; // "HH:MM"
  notificationIds?: string[];
  calendarEnabled?: boolean;
  calendarEventIds?: string[];
  translations?: Record<string, PlanTranslation>;
}

export interface HistoryEntry {
  date: string;
  workoutName: string;
  workoutType?: TrainingType;
  repsCompleted: number;
  setsCompleted: number;
  status: 'success' | 'failed';
  planId?: string;
}
