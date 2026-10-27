<div align="center">
  <img src="./assets/images/flextrack.png" width="120" height="120" alt="FlexTrack Logo" />

  <h1>FlexTrack</h1>
  <p><strong>Local-first fitness tracker built with React Native & Expo</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react" alt="React Native" />
    <img src="https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo" alt="Expo" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=flat-square" alt="Platform" />
  </p>
</div>

---

## Overview

FlexTrack is a mobile fitness tracking application that helps you plan, execute, and analyse your training. It includes a full active-workout experience with per-set logging and a rich stats dashboard — all stored locally on device with no account required.

---

## Current app

<div align="center">
<table>
  <tr>
    <td align="center"><b>Today</b></td>
    <td align="center"><b>Routines</b></td>
    <td align="center"><b>Active Session</b></td>
    <td align="center"><b>Session Summary</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/dashboard.png" width="200" alt="Dashboard" /></td>
    <td><img src="docs/screenshots/workouts.png" width="200" alt="Routines" /></td>
    <td><img src="docs/screenshots/active-workout.png" width="200" alt="Active session with a loaded barbell" /></td>
    <td><img src="docs/screenshots/summary.png" width="200" alt="Session summary with a new record" /></td>
  </tr>
  <tr>
    <td align="center"><b>Routine Editor</b></td>
    <td align="center"><b>History</b></td>
    <td align="center"><b>Training Progress</b></td>
    <td align="center"><b>Body Metrics</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/template-editor.png" width="200" alt="Routine editor" /></td>
    <td><img src="docs/screenshots/history.png" width="200" alt="History" /></td>
    <td><img src="docs/screenshots/stats.png" width="200" alt="Training Progress" /></td>
    <td><img src="docs/screenshots/body-metrics.png" width="200" alt="Body Metrics" /></td>
  </tr>
</table>
</div>

The screenshots use a 430 × 932 mobile viewport and are stored at 3× resolution (1290 × 2796). They use deterministic local demo data against the current web app.

---

## Features

### Today and scheduling

- Highlights a routine scheduled for today with one-tap start
- Shows sessions completed this week and total workout count
- Displays the seven-day routine schedule and quick access to the first three routines

### Workout routines

- Create, edit, search, start, and delete reusable routines
- Mix repetition, timed, and distance exercises in one routine
- Configure sets, reps, weight or assistance, duration, distance units, rest time, and weekly schedule
- Support weighted, bodyweight, and assisted repetition exercises

### Guided workouts

- Log every set with weight, reps, duration, or distance as appropriate
- Compare a set with values from the previous matching session
- Mark sets individually or complete all sets in an exercise
- Update an exercise's default weight during a session
- See the bar loaded plate by plate for the working weight, with ±2.5 kg steppers
- Run per-set timers and an adjustable rest countdown with vibration feedback
- Keep the screen awake and guard against accidentally leaving a session
- Review duration, completed exercises, sets, volume, and per-exercise results after saving

### Quick Log

- Record an activity that was completed outside a routine
- Supports strength, run, walk, cycle, timed, and other activities
- Captures completion time, duration, distance and unit when relevant, plus notes
- Adds the activity directly to History and Progress

### History

- Browse a tappable four-week calendar coloured by what you trained
- See total workouts, average duration, and current streak
- Filter by routine or a selected day
- Review sessions grouped by month with duration, volume, and exercise details

### Progress

- Derives personal records from the exercise data actually logged
- Shows a 12-week heat strip of weekly sets per Push / Pull / Legs / Cardio
- Charts progression for a selected exercise, with records marked
- Chooses metrics for each modality, including weight, estimated 1RM, reps, assistance, duration, distance, and pace
- Logs height and body weight, explains BMI in words, and charts weight over 30 days, 90 days or all time

### Navigation and feedback

- Bottom tabs for Today, Routines, History, and Progress
- Central Quick Start sheet for launching routines, logging completed activity, or creating a routine
- Haptic feedback for navigation, workout starts, and completed sets on supported devices
- Focused full-screen layouts for routine editing, active workouts, summaries, and Quick Log

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo 54 |
| UI library | React 19 |
| Language | TypeScript 5.9 |
| Web bundler | Vite 6 + `react-native-web` |
| Navigation | Manual view-state (`useState`) in `App.tsx` |
| Persistence | `@react-native-async-storage/async-storage` |
| Charts | Hand-built with `react-native-svg` |
| Date utilities | `date-fns` |
| Icons | `lucide-react-native` |
| Haptics | `expo-haptics` |
| Gradients | `expo-linear-gradient` |
| Screen awake | `expo-keep-awake` |
| Architecture | React Native New Architecture (enabled) |
| Compiler | React Compiler (experimental, enabled) |

---

## Project Structure

```
flex-track/
├── App.tsx                     # Root view-state router and data wiring
├── constants/
│   └── theme.ts                # Shared colors, type, spacing, and shadows
├── types/
│   └── index.ts                # Templates, exercises, logs, profile, and views
├── hooks/
│   ├── useWorkoutDataSafe.ts   # Validated, serialized AsyncStorage operations
│   └── useWorkoutTimer.ts      # Exercise timers and rest countdown
├── utils/
│   ├── progress.ts             # Modality-aware progress calculations
│   ├── time.ts                 # Duration parsing and formatting
│   ├── formatters.ts           # Schedule labels
│   └── helpers.ts              # ID generation
├── components/
│   ├── layout/                 # Header and bottom navigation
│   └── ui/                     # Buttons, cards, chips, and empty states
└── pages/
    ├── Dashboard/              # Today, schedule, and routine shortcuts
    ├── Templates/              # Routine list and editor
    ├── ActiveWorkout/          # Guided session, set logging, rest, and summary
    ├── QuickLog/               # Completed-activity entry
    ├── History/                # Activity grid, filters, and workout cards
    └── Stats/                  # Training progress and body metrics
```

---

## Data Model

```typescript
WorkoutTemplate {
  id, name, description?,
  exercises: Exercise[],
  tags?: string[],
  scheduleDays?: number[]   // 0 = Sun … 6 = Sat
}

Exercise {
  id, name,
  type: 'reps' | 'timer' | 'distance',
  loadMode?: 'external' | 'bodyweight' | 'assisted',
  targetSets?, targetReps?, targetWeight?,
  targetDurationSeconds?, targetDistance?, targetDistanceUnit?,
  restSeconds?, notes?
}

WorkoutLog {
  id, templateId?, templateName,
  source?: 'routine' | 'quick',
  activityCategory?: 'strength' | 'run' | 'walk' | 'cycle' | 'timed' | 'other',
  notes?,
  startTime: number,        // Unix ms
  endTime?: number,
  exercises: ExerciseLog[]
}

ExerciseLog {
  exerciseId, exerciseName,
  exerciseType?, loadMode?, distanceUnit?,
  sets: SetLog[],
  completed: boolean
}

SetLog {
  setNumber, reps?, weight?,
  distance?, durationSeconds?,
  completed: boolean, notes?
}

UserProfile {
  height?: number,         // centimetres
  weightLogs: { date: number, weight: number }[] // kilograms
}
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- For mobile: [Expo Go](https://expo.dev/client) on your physical device, **or** an iOS Simulator / Android Emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/HatefulRock/FlexTrack.git
cd flextrack/flex-track

# Install dependencies
npm install
```

### Running the App

**Web (Vite — recommended for development):**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Mobile (Expo):**

```bash
npx expo start
```

Then:
- **Physical device:** Scan the QR code with the Expo Go app
- **iOS Simulator:** Press `i`
- **Android Emulator:** Press `a`

---

## Building for Production

**Web:**

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

**Mobile (via EAS):**

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Build for Android (APK)
eas build --platform android --profile preview

# Build for iOS (requires Apple Developer account)
eas build --platform ios
```

Configuration is in `eas.json`.

---

## Architecture Notes

**State management** is intentionally simple: local React state in `App.tsx` drives the current screen and active session. There is no Redux, Zustand, or application context.

**Persistence** is handled by `useWorkoutDataSafe`, which validates and bounds stored values and serializes writes to the three AsyncStorage keys: `workout-templates`, `workout-logs`, and `user-profile`. No sync layer or remote database is involved.

**Performance** — expensive derivations are memoized, and the chart-heavy Stats screen is loaded only when opened.

### Current boundaries

- Data is local to the current browser or device; there is no account, cloud sync, or remote database.
- The included AI Creator screen is an unlinked coming-soon prototype. No AI provider or API key is configured, and the current product does not generate routines with AI.
- Exercise grouping for the training split is inferred from exercise names.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

<div align="center">
  <sub>Built with React Native · Expo · TypeScript</sub>
</div>
