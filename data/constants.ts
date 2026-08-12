import { Difficulty, DifficultyLevel, TrainingPlan, TrainingType, Workout } from '../types/models';

// Fixed UI decoration for the finite set of training types / levels / difficulties.
// Actual training content (names, descriptions, coach tips) comes from the API.

export const TYPE_EMOJIS: Record<string, string> = {
  fingerboard: '🏔️',
  campus: '⚡',
  flexibility: '🧘',
  strength: '💪',
  endurance: '🧗',
};

export const TYPE_LABELS: Record<string, string> = {
  fingerboard: 'Fingerboard',
  campus: 'Campus Board',
  flexibility: 'Flexibility',
  strength: 'Strength',
  endurance: 'Endurance',
};

export const LEVEL_COLORS: Record<string, string> = {
  beginner: '#2ed573',
  intermediate: '#ffa502',
  expert: '#ff4757',
  maintenance: '#4ecdc4',
};

export const LEVEL_LABELS_LOCALIZED: Record<string, Record<string, string>> = {
  beginner: { en: 'BEGINNER', ka: 'დამწყები' },
  intermediate: { en: 'INTERMEDIATE', ka: 'საშუალო' },
  expert: { en: 'EXPERT', ka: 'ექსპერტი' },
  maintenance: { en: 'MAINTENANCE', ka: 'შენარჩუნება' },
};

export function getLevelLabel(level: DifficultyLevel | string, lang: string): string {
  return LEVEL_LABELS_LOCALIZED[level]?.[lang] ?? LEVEL_LABELS_LOCALIZED[level]?.en ?? String(level).toUpperCase();
}

// climbing.ge's "Climbing trainers" category (docs/SHOP.md's
// ProductCategoryController, id 1) is what ShopBanner leads with on Home —
// training gear is the most relevant shop content for this app. Every other
// category is fetched and labeled dynamically; only this priority pick is
// hardcoded, and only as an id (the API exposes no slug).
export const PRIORITY_SHOP_CATEGORY_ID = 1;

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#2ed573',
  medium: '#ffa502',
  hard: '#ff4757',
};

export const DIFFICULTY_LABELS_LOCALIZED: Record<Difficulty, Record<string, string>> = {
  easy: { en: 'BEGINNER', ka: 'დამწყები' },
  medium: { en: 'INTERMEDIATE', ka: 'საშუალო' },
  hard: { en: 'ADVANCED', ka: 'მოწინავე' },
};

export function getDifficultyLabel(difficulty: Difficulty, lang: string): string {
  return DIFFICULTY_LABELS_LOCALIZED[difficulty]?.[lang] ?? DIFFICULTY_LABELS_LOCALIZED[difficulty]?.en;
}

// Reads translations embedded on the object itself (populated from the API
// response) rather than a hardcoded dictionary — content now lives server-side.
export function localizedPlan(plan: TrainingPlan, lang: string) {
  const tr = lang !== 'en' ? (plan.translations?.[lang] ?? {}) : {};
  return {
    name: tr.name ?? plan.name,
    tagline: tr.tagline ?? plan.tagline,
    description: tr.description ?? plan.description,
    coachNote: tr.coachNote ?? plan.coachNote,
  };
}

// Many trainings only have per-step photos set (no training-level cover
// image), so fall back to the first step that has one rather than showing a
// placeholder when a real photo actually exists.
export function getWorkoutPreviewImage(workout: Workout): string | undefined {
  return workout.imageUrl || workout.steps?.find(s => !!s.imageUrl)?.imageUrl;
}

export function localizedWorkout(workout: Workout, lang: string) {
  const tr = lang !== 'en' ? (workout.translations?.[lang] ?? {}) : {};
  return {
    name: tr.name ?? workout.name,
    description: tr.description ?? workout.description ?? '',
    coachTip: tr.coachTip ?? workout.coachTip ?? '',
    targetMuscle: tr.targetMuscle ?? workout.targetMuscle ?? '',
  };
}
