---
version: 1
slug: "app-tsx"
primary_target: "App.tsx"
related_targets: []
---

# Surface brief: FlexTrack app (all screens)

Scope: whole app redesign. Mode: Operate. Build path: code-led (Operate surface; user-pinned direction, no comp round).
Audience and job: hybrid lifter mid-session on the gym floor; plan, run, log, review training.
Constraints: React Native + Expo, one look on iOS and Android, kg only, local-first. Tab bar (Today, Routines, History, Progress; the second tab was renamed from Workouts so templates are called routines everywhere) and quick-start sheet stay as the navigation model.
Memorable moment: the loaded barbell on the active set card and the judge lights on set completion.
Unresolved: lock-screen rest timer (Live Activity), shareable session card, muscle map are deferred.

## Direction contract

THESIS: Calibrated. The app is a meet-day platform where colour is a measurement: the only hues are the IWF calibrated-plate colours, so red means 25 kg and a no-lift (a missed or skipped set, and destructive actions), a white light means a good lift, yellow means a record, and category colours (push red, pull blue, legs green, cardio chrome) sort the training. It refuses the category default of a navy dashboard with one neon accent, glow and icon-tile stat cards.

OWN-WORLD: Rubber-floor black #141516 ground, raised rubber surfaces #1D1F21/#26292C, chalk text #F2F1EC. Plate hues red #D2232A, blue #1E5BC6, yellow #F3C316, green #1E9B4B, chalk-white plates. Big Shoulders Display for numbers and titles (scoreboard voice), Archivo for text. 4px inputs/chips, 10px cards, filled surfaces without borders, hairlines only inside lists, sentence-case labels, no eyebrows, no glow. Chalk-filled primary buttons with rubber text. The 2.5 kg plate is drawn charcoal rather than IWF small-plate red so it never reads as a 25 kg plate at a glance. Improvement is printed in chalk with a sign; green belongs to legs only.

STORY: The lifter sees today's session and its load at a glance, starts it in one tap, works through compact set rows prefilled from last time, gets an unmissable rest countdown, and finishes on a summary that names what improved.

FIRST VIEWPORT: Today: date line, routine name in 40pt display, the session as a strip of category-coloured segments, full-width 56pt chalk Start bar, week as seven volume bars, a scoreboard line of counts. Active workout: elapsed clock, exercise title, a current-set card with a side-view loaded barbell and 48pt reps/kg steppers, done sets collapsed to 44pt rows, a docked rest bar that drains.

FORM: Calibrated (meet-day competition platform), first of three proposed directions, user-pinned. seed: none (no roll; user-pinned direction). The user chose this direction directly, so no concept roll ran.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
