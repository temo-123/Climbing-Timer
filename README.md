# ClimbingTimer

A mobile training timer for climbers and boulderers. Build custom hangboard workouts, run timed sessions with automatic phase transitions, and track your history.

**Product by [climbing.ge](https://climbing.ge)** — Georgia's premier climbing community.  
**Author:** Temo Samsonadze

---

## Quick Start

Requirements: Node.js v20+, npm v10+

```bash
npm install
npm start          # opens Expo dev server — scan QR with Expo Go app
npm run android    # launch on connected Android device or emulator
npm run ios        # launch on iOS simulator (Mac only)
```

---

## How to Use

### 1. Create a Workout
Go to **Create New Workout** and fill in:

| Field | What it means | Default |
|-------|--------------|---------|
| Name | Label for this workout | — |
| Hang Time | How long you hang each rep | 240s (4 min) |
| Rest Time | Rest between reps | 240s (4 min) |
| Reps | Reps per set | 6 |
| Sets | Number of sets | 4 |
| Recover Time | Rest between sets | 180s (3 min) |
| Description | Optional notes | — |

All times are in **seconds**. Minimum value for each field is 1.

### 2. Run a Workout
Open **My Workouts**, find your workout, tap **Start**.

The timer cycles automatically:
```
GET READY (12s) → HANG → REST → HANG → REST → ... → RECOVER → HANG → ...
```
Each phase has a distinct color and the phone vibrates on every transition so you don't have to watch the screen.

**Controls:**

| Button | Action |
|--------|--------|
| START / PAUSE | Begin or pause the timer |
| STOP | End the session early (saved as failed) |
| Reset | Restart from the beginning (saved as failed if you were past rep 1) |
| Skip | Jump to the next phase immediately |

### 3. View History
Open **Workout History** to see your recent sessions. Each entry shows the date, workout name, reps and sets completed, and whether it was a success or stopped early.

---

## Workout Phase Colors

| Phase | Color | Vibration |
|-------|-------|-----------|
| Get Ready | Orange | — |
| Hang | Red | Double buzz |
| Rest | Blue | Single buzz |
| Recover | Green | Single buzz |
| Finished | — | Triple buzz |

---

## Data Storage

All data is stored locally on your device using AsyncStorage. There is no cloud sync or account required. Uninstalling the app will delete all saved workouts and history.

---

## License

MIT — Built with love for climbers.
