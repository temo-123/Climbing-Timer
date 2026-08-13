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
  // shop.climbing.ge product IDs selected during onboarding as "what I train with",
  // in place of (or alongside) the manual equipment checklist.
  products?: number[];
}

// A shop.climbing.ge product tagged by the backend as corresponding to a piece
// of training equipment — used by onboarding to let users pick gear they own
// instead of the abstract equipment checklist.
export interface TrainableProduct {
  id: number;
  urlTitle: string;
  title: string;
  imageUrl: string | null;
  equipmentType: Equipment | null;
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
  // Sync bookkeeping (utils/sync.ts) — only meaningful for locally-created
  // workouts, never set on API-fetched preset content. updatedAt drives
  // last-write-wins merge; deletedAt is a tombstone so a delete on one device
  // propagates instead of being silently un-done by a stale pull elsewhere.
  updatedAt?: string;
  deletedAt?: string;
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

export interface ShopProduct {
  id: number;
  urlTitle: string;
  title: string;
  imageUrl: string | null;
  price: number;
  discountedPrice: number | null;
  discountPercent: number;
  currency: string;
  outOfStock: boolean;
}

// A shop.climbing.ge product category (docs/SHOP.md's ProductCategoryController) —
// used to label the category filter tabs in ShopBanner.
export interface ShopCategory {
  id: number;
  name: string;
}

// A category paired with its in-stock products — only categories with at
// least one product are ever produced, so ShopBanner can render tabs
// straight off this list without checking for emptiness itself.
export interface ShopCategoryGroup {
  category: ShopCategory;
  products: ShopProduct[];
}

export interface HistoryEntry {
  date: string;
  workoutName: string;
  workoutType?: TrainingType;
  repsCompleted: number;
  setsCompleted: number;
  status: 'success' | 'failed';
  planId?: string;
  // Sync bookkeeping (utils/sync.ts) — see Workout.updatedAt.
  updatedAt?: string;
}
