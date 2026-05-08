# ClimbingTimer 🧗

**Product by [climbing.ge](https://climbing.ge)** - Georgia's premier climbing community platform for routes, gyms, events, and training tools.

**Author: Temo Samsonadze** - Full-stack developer passionate about climbing and mobile apps.

A mobile training timer app for climbers and boulderers. Create custom hangboard workouts, run timed sessions with hang/rest/recover phases, and track your history with charts and stats.

![App Screenshot](screenshots/home.png) <!-- Add screenshots here -->

## 🚀 Quick Start

**Environment Versions:**
- Node.js: v20.20.1
- npm: 10.8.2  
- npx: 10.8.2

```bash
# Clone or navigate to project
cd ClimbingTimer

# Install dependencies
npm install

# Start development server
npx expo start

# For Android
npx expo start --android

# For iOS (Mac only)
npx expo start --ios
```


## 📱 Screens Overview

The app uses a **Native Stack Navigator** (React Navigation v7) with 5 screens. No tab bar or drawer – pure stack navigation with custom back buttons.

| Screen | Route | Component | Purpose | Input Params |
|--------|-------|-----------|---------|--------------|
| **Home** 🏠 | `Home` | `HomeScreen.tsx` | Main hub with quick action buttons | None |
| **Create Workout** ➕ | `CreateWorkout` | `WorkoutCreatorScreen.tsx` | Build &amp; save custom workouts | None |
| **My Workouts** 📋 | `LoadWorkouts` | `WorkoutsListScreen.tsx` | List saved workouts &amp; start sessions | None |
| **Timer** ⏱️ | `Timer` | `TimerScreen.tsx` | Run workout with live timing | `{ workout: Workout }` |
| **History** 📊 | `History` | `HistoryScreen.tsx` | View session stats &amp; charts | None |

### Navigation Flow
```
Home ──➤ CreateWorkout (save workouts)
     ├──➤ LoadWorkouts ──➤ Timer (run workout ──➤ auto-save history)
     └──➤ History (view history)
```
- **Back Navigation**: Manual `< Back` buttons in custom headers + `navigation.goBack()`.
- Headers hidden globally (`headerShown: false`).

## 💾 Data Storage &amp; Persistence

**Local-only** using `@react-native-async-storage/async-storage`. No cloud sync.

### Storage Schema

```typescript
// WORKOUTS: AsyncStorage.getItem('workouts') → Workout[]
interface Workout {
  id: string;           // Date.now().toString()
  name: string;         // e.g. "4/4 x6"
  hangTime: number;     // seconds, default 240 (4min)
  restTime: number;     // seconds, default 240
  reps: number;         // default 6
  sets: number;         // default 4
  recoverTime: number;  // seconds, default 180 (3min)
}

// HISTORY: AsyncStorage.getItem('history') → HistoryEntry[]
interface HistoryEntry {
  date: string;             // ISO string, new Date().toISOString()
  workoutName: string;      // Copied from Workout.name
  repsCompleted: number;    // Actual reps finished (tracked live)
  setsCompleted: number;    // Actual sets finished
}
```

### How Workouts Are Saved
1. User fills form in **CreateWorkout** (name required, others numeric inputs w/ defaults).
2. `saveWorkout()`:
   ```typescript
   const workout: Workout = { id: Date.now().toString(), ... };
   const workouts: Workout[] = await getItem('workouts') || [];
   workouts.push(workout);
   await setItem('workouts', JSON.stringify(workouts));
   Alert.success → goBack();
   ```
3. Appended to array (no updates/deletes).

### How Workout History Is Saved
1. Select workout in **My Workouts** → `navigate('Timer', { workout })`.
2. **Timer** runs phases: HANG → REST (x reps) → RECOVER (x sets). Tracks `currentRep`, `currentSet` via refs.
3. On final set complete (auto or skip):
   ```typescript
   const entry: HistoryEntry = {
     date: new Date().toISOString(),
     workoutName: workout.name,
     repsCompleted: currentRep - 1,
     setsCompleted: currentSet - 1
   };
   const history: HistoryEntry[] = await getItem('history') || [];
   history.push(entry);
   await setItem('history', JSON.stringify(history));
   Alert('Session Complete!') → goBack();
   ```
4. **History** screen loads, sorts reverse (newest first, max 30), computes charts.

## 🏋️ Workout Lifecycle (Detailed)

### 1. Create → Home → CreateWorkout
- Inputs: Name, Hang (s), Rest (s), Reps, Sets, Recover (s).
- Defaults: 240s hang/rest, 6 reps, 4 sets, 180s recover.
- Save appends to `'workouts'`.

### 2. List → Home → My Workouts
- Loads/sorts `'workouts'`.
- Displays: "Hang Xm / Rest Xm xN reps \| M sets \| Recover Xm".
- Tap **Start** → TimerScreen with workout param.

### 3. Run → TimerScreen
- **State**: `timeLeft`, `phase` ('hang'/'rest'/'recover'), `currentRep/Set`, `isRunning`.
- **1s Interval** (useEffect + refs for perf):
  - Counts down `timeLeft`.
  - At 0:
    | Current | Next Action |
    |---------|-------------|
    | hang (rep < reps) | → rest @ restTime, rep++ |
    | rest | → hang @ hangTime |
    | hang (rep == reps) | → recover @ recoverTime, rep=1 |
    | recover (set < sets) | → hang @ hangTime, set++ |
    | recover (set == sets) | SAVE history, complete |
- **Controls**:
  | Button | Action |
  |--------|--------|
  | START/PAUSE | Toggle interval |
  | RESET | Back to rep1/set1 hang |
  | Skip Rep/Set | Manual advance (no time save) |
- **Visual**: Large timer MM:SS, phase label, progress "Rep X/6 \| Set Y/4".

### 4. Track → HistoryScreen
- **Daily Chart** (last 7 days): Sessions count bars (#4ecdc4).
- **Monthly Chart** (last 6 mo): Total reps bars (#ff6b6b, max 500).
- **Recent** (top 10): Date, Name, "X reps x Y sets".
- Reloads on mount (`useEffect`).

## 🏗️ Architecture

```
App.tsx
├── NavigationContainer + Stack.Navigator (5 screens)
├── RootStackParamList (types)

Screens/
├── HomeScreen.tsx (buttons + Footer)
├── WorkoutCreatorScreen.tsx (form + AsyncStorage save)
├── WorkoutsListScreen.tsx (FlatList + load workouts)
├── TimerScreen.tsx (interval logic + refs + save history)
└── HistoryScreen.tsx (charts + aggregations)

Shared/
├── components/Footer.tsx (simple footer)
├── styles/globalStyles.ts (dark theme: #1a1a1a bg, teal #4ecdc4 buttons)
└── AsyncStorage utils (inline getItem/parse/setItem)
```

- **Hooks**: `useState`, `useEffect` (load + interval), `useCallback` (stable fns), `useRef` (mutable state).
- **No Context/Redux**: Pure local state + props.
- **Error Handling**: Try/catch + Alert on storage fails.
- **Perf**: Refs prevent re-renders in interval; cleanup on unmount.

## ✨ Key Features

- **Multi-Phase Timer**: Precise cycling w/ skips.
- **Progress Tracking**: Live rep/set counters.
- **History Analytics**: Bar charts (daily sessions, monthly reps).
- **Persistent Workouts**: Unlimited saves, no limits.
- **Responsive UI**: SafeArea, dark theme, tabular fonts.
- **Offline-First**: All data local.

## 🔮 Future Enhancements (Ideas)
- Edit/delete workouts.
- Cloud sync (Firebase).
- Workout templates.
- Export CSV history.
- Notifications.
- Share sessions.

## 📄 License
MIT - Built with ❤️ for climbers.

