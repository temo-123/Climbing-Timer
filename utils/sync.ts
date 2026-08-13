import AsyncStorage from '@react-native-async-storage/async-storage';
import { authClient, isLoggedIn } from './auth';
import { Workout, TrainingPlan, HistoryEntry } from '../types/models';

// --- Proposed backend contract (climbing.ge repo — not implemented yet) ---
// Full request/response shapes, DB schema, and implementation gotchas are
// documented in ../docs/BACKEND_SYNC_CONTRACT.md — that's the single source
// of truth for whoever builds the matching Laravel endpoint.
//
//   POST /api/user_training/sync, behind auth:sanctum (same as /api/auth_user)
//     body: { workouts: Workout[], plans: PlanActivationState[], history: HistoryEntry[] }
//     -> { workouts: Workout[], plans: PlanActivationState[], history: HistoryEntry[], syncedAt: string }
//        the server's canonical, merged copies — the server must echo back
//        the client-supplied id/date unchanged (see the doc for why)
//
// Until this route exists, every call below 404s and is swallowed — local
// AsyncStorage remains the sole source of truth, exactly like logged-out mode.

// Only the per-device activation state travels over the wire — not the full
// plan content (sessions/translations/etc. already come from fetchPlanById).
// PlanDetailScreen's loadPlan() already merges whatever's in AsyncStorage's
// 'plans' entry (partial or full) over freshly-fetched plan content, so
// writing back a minimal record here is safe.
interface PlanActivationState {
  id: string;
  isActive?: boolean;
  activatedAt?: string;
  startDate?: string;
  notificationsEnabled?: boolean;
  notificationTime?: string;
  notificationIds?: string[];
  calendarEnabled?: boolean;
  calendarEventIds?: string[];
}

const toActivationState = (p: TrainingPlan): PlanActivationState => ({
  id: p.id,
  isActive: p.isActive,
  activatedAt: p.activatedAt,
  startDate: p.startDate,
  notificationsEnabled: p.notificationsEnabled,
  notificationTime: p.notificationTime,
  notificationIds: p.notificationIds,
  calendarEnabled: p.calendarEnabled,
  calendarEventIds: p.calendarEventIds,
});

async function readLocal<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

// Last-write-wins union by id, using `stamp` (ISO string, '' if unset — always
// loses) as the freshness signal. Rows missing on one side pass through untouched.
function mergeById<T>(local: T[], remote: T[], getId: (t: T) => string, getStamp: (t: T) => string | undefined): T[] {
  const byId = new Map<string, T>();
  for (const row of local) byId.set(getId(row), row);
  for (const row of remote) {
    const existing = byId.get(getId(row));
    if (!existing || (getStamp(row) ?? '') >= (getStamp(existing) ?? '')) byId.set(getId(row), row);
  }
  return Array.from(byId.values());
}

// HistoryEntry has no id field — `date` (a full completion timestamp) is the
// closest thing to a stable identity it already has, so it doubles as the merge key.
function mergeHistory(local: HistoryEntry[], remote: HistoryEntry[]): HistoryEntry[] {
  return mergeById(local, remote, h => h.date, h => h.updatedAt);
}

let syncInFlight: Promise<void> | null = null;

// Best-effort, fire-and-forget: never throws, never blocks the caller.
// No-ops immediately when logged out. Call after any local write that should
// eventually reach the server, and once after a successful login.
export function syncNow(): Promise<void> {
  if (syncInFlight) return syncInFlight; // coalesce bursts (e.g. save then immediately navigate)
  syncInFlight = runSync().finally(() => { syncInFlight = null; });
  return syncInFlight;
}

async function runSync(): Promise<void> {
  if (!(await isLoggedIn())) return;
  try {
    const [workouts, plans, history] = await Promise.all([
      readLocal<Workout>('workouts'),
      readLocal<TrainingPlan>('plans'),
      readLocal<HistoryEntry>('history'),
    ]);

    const { data: remote } = await authClient.post<{ workouts: Workout[]; plans: PlanActivationState[]; history: HistoryEntry[] }>(
      '/user_training/sync',
      { workouts, plans: plans.map(toActivationState), history }
    );

    const mergedWorkouts = mergeById(workouts, remote.workouts, w => w.id, w => w.updatedAt)
      .filter(w => !w.deletedAt); // tombstones only need to exist long enough to push; drop them once merged
    const mergedPlans = mergeById<TrainingPlan | PlanActivationState>(plans, remote.plans, p => p.id, p => p.activatedAt);
    const mergedHistory = mergeHistory(history, remote.history);

    await AsyncStorage.setItem('workouts', JSON.stringify(mergedWorkouts));
    await AsyncStorage.setItem('plans', JSON.stringify(mergedPlans));
    await AsyncStorage.setItem('history', JSON.stringify(mergedHistory));
  } catch {
    // Network failure, or a 404 because the backend doesn't have these routes
    // yet — either way, local storage keeps working exactly as it does logged out.
  }
}
