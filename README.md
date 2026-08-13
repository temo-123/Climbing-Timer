# Climbing Trainer

A mobile training app for climbers and boulderers. Follow expert-built training plans or quick exercises from the climbing.ge library, build your own custom workouts, run timed sessions with automatic phase transitions, and track your history and progress.

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

## Getting Started

The first time you open the app, it walks you through a short setup:

1. **Language** — English or Georgian (ქართული). Changeable later from the ☰ menu.
2. **How It Works** — a 30-second tour of the app's main pieces: quick training, training plans, the timer, history/progress, and reminders.
3. **About You** — age, sex, weight, and height, used to calibrate training load.
4. **Equipment** — what you train with (fingerboard, campus board, system wall, climbing wall, pull-up bar, weights), either by picking a climbing.ge product you own or selecting equipment types manually.
5. **Climbing Experience** — how long you've been climbing and your current grade (optional), used to pick sensible training intensity.

None of this is sent anywhere unless you later choose to log in — see **Account & Sync** below.

---

## Home Screen

The home screen shows:
- **Today's Session** — if you have an active training plan, what's scheduled for today (or that it's a rest day).
- **Quick Access** — jump straight to Quick Training, Training Plans, Progress, or History.
- **My Workouts** — your own custom-built workouts, plus a shortcut to create a new one.

---

## Ways to Train

### Quick Training
Browse ready-made exercises from the climbing.ge library, grouped by type — fingerboard, campus board, flexibility, strength, or endurance. Tap one to see the details and start it.

### Training Plans
Multi-week structured programs built around real coaching methodology (fingerboard strength, campus power, flexibility, and more). Activate a plan and the Home screen tells you exactly what to do each training day. Only one plan can be active at a time. When you activate a plan you can optionally turn on:
- **Reminders** — a notification at 10 AM and 4:30 PM on training days.
- **Calendar** — training sessions added to your device calendar.

### Create Your Own Workout
Go to **Create Workout** and fill in:

| Field | What it means | Default |
|-------|--------------|---------|
| Name | Label for this workout | — |
| Hang Time | How long you hang each rep | varies by type |
| Rest Time | Rest between reps | varies by type |
| Reps | Reps per set | varies by type |
| Sets | Number of sets | varies by type |
| Recover Time | Rest between sets | varies by type |
| Description | Optional notes | — |

All times are in **seconds**. Minimum value for each field is 1. Find it later under **My Workouts**.

---

## Running a Workout (Timer)

Some exercises (mostly from Training Plans and Quick Training) walk you through a specific sequence of steps defined by the coach, each with its own instructions and sometimes a photo. Your own custom workouts, and any exercise without a defined sequence, run the classic cycle instead:

```
GET READY (12s) → HANG → REST → HANG → REST → ... → RECOVER → HANG → ...
```

Either way, each phase has a distinct color and the phone vibrates on every transition so you don't have to watch the screen.

**Controls:**

| Button | Action |
|--------|--------|
| START / PAUSE | Begin or pause the timer |
| STOP | End the session early (saved as failed) |
| Reset | Restart from the beginning (saved as failed if you were past rep 1) |
| Skip | Jump to the next phase immediately |

### Phase Colors

| Phase | Color | Vibration |
|-------|-------|-----------|
| Get Ready | Orange | — |
| Hang / Work | Red | Double buzz |
| Rest | Blue | Single buzz |
| Recover / Stretch | Green | Single buzz |
| Finished | — | Triple buzz |

---

## History & Progress

- **History** — every session you run is saved here, finished or not, with the date, workout name, and reps/sets completed.
- **Progress** (Analytics) — your current and best streaks, success rate, training mix by type, and a few personalized insights based on your recent activity.

---

## Account & Sync

Logging in is entirely optional — everything above works fully offline without an account. If you'd like your workouts, training plan, and history to follow you (e.g. between devices, or from the climbing.ge website), open the ☰ menu and log in or create a climbing.ge account. Data still lives on your device first; an account just lets it sync to your account in the background.

---

## Settings

Reachable from the ☰ menu:
- **Account** — log in, create an account, or log out.
- **Training Server** — the address the app fetches training content from (advanced; only change this if you know you need to).
- **Danger Zone** — permanently clear your profile, workouts, history, and active plans from this device.

---

## Data Storage

All data is stored locally on your device by default — no account required, and uninstalling the app deletes all saved workouts and history. Logging in (see **Account & Sync**) additionally syncs that data to your climbing.ge account.

---

## License

MIT — Built with love for climbers.
