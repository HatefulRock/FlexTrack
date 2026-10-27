---
name: FlexTrack
description: Calibrated. A meet-day platform where colour is a measurement.
colors:
  rubber-floor: "#141516"
  rubber-surface: "#1D1F21"
  rubber-raised: "#26292C"
  rubber-pressed: "#303438"
  list-hairline: "#2E3236"
  input-boundary: "#6B706C"
  chalk: "#F2F1EC"
  chalk-bright: "#FFFFFF"
  chalk-secondary: "#C9C9C3"
  chalk-muted: "#A3A59F"
  chalk-subtle: "#8E908B"
  plate-red-25: "#D2232A"
  no-lift-text: "#F0676B"
  plate-blue-20: "#1E5BC6"
  plate-yellow-15: "#F3C316"
  plate-green-10: "#1E9B4B"
  plate-charcoal-2-5: "#3A3D40"
  plate-chrome: "#B9BDC1"
  category-other: "#5A5E62"
  scrim: "rgba(8, 9, 10, 0.82)"
typography:
  timer:
    fontFamily: "BigShouldersDisplay_800ExtraBold"
    fontSize: "64px"
    lineHeight: "66px"
    letterSpacing: "-0.5px"
    fontFeature: "tnum"
  display:
    fontFamily: "BigShouldersDisplay_800ExtraBold"
    fontSize: "40px"
    lineHeight: "42px"
    letterSpacing: "-0.4px"
  title:
    fontFamily: "BigShouldersDisplay_700Bold"
    fontSize: "30px"
    lineHeight: "34px"
    letterSpacing: "-0.2px"
  metric:
    fontFamily: "BigShouldersDisplay_800ExtraBold"
    fontSize: "34px"
    lineHeight: "36px"
    fontFeature: "tnum"
  heading:
    fontFamily: "Archivo_600SemiBold"
    fontSize: "17px"
    lineHeight: "22px"
  body:
    fontFamily: "Archivo_400Regular"
    fontSize: "15px"
    lineHeight: "22px"
  label:
    fontFamily: "Archivo_600SemiBold"
    fontSize: "14px"
    lineHeight: "18px"
  button:
    fontFamily: "Archivo_700Bold"
    fontSize: "16px"
    lineHeight: "20px"
  caption:
    fontFamily: "Archivo_500Medium"
    fontSize: "12px"
    lineHeight: "16px"
rounded:
  sm: "4px"
  md: "6px"
  lg: "10px"
  xl: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
  xxxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.rubber-floor}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.rubber-raised}"
    textColor: "{colors.chalk}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "52px"
  button-ghost:
    textColor: "{colors.chalk}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "52px"
  button-danger:
    backgroundColor: "rgba(210, 35, 42, 0.14)"
    textColor: "{colors.no-lift-text}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "52px"
  card:
    backgroundColor: "{colors.rubber-surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  chip:
    backgroundColor: "{colors.rubber-surface}"
    textColor: "{colors.chalk-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "44px"
  chip-active:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.rubber-floor}"
  input:
    backgroundColor: "{colors.rubber-floor}"
    textColor: "{colors.chalk}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "48px"
  stepper-button:
    backgroundColor: "{colors.rubber-raised}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.md}"
    width: "56px"
    height: "64px"
  record-band:
    backgroundColor: "{colors.plate-yellow-15}"
    textColor: "{colors.rubber-floor}"
    rounded: "{rounded.lg}"
    padding: "16px"
  tab-bar:
    backgroundColor: "{colors.rubber-surface}"
    textColor: "{colors.chalk-subtle}"
    typography: "{typography.caption}"
    height: "72px"
  sheet:
    backgroundColor: "{colors.rubber-surface}"
    rounded: "{rounded.xl}"
    padding: "10px 16px 20px"
---

# Design System: FlexTrack

<!-- Provenance: direction "Calibrated" (meet-day competition platform), first of three proposed directions. The direction was user-pinned, so no concept roll ran. seed: none (no roll; user-pinned direction). Tokens extracted from the shipped build (constants/theme.ts and components); finish review verdict: ship (scored fixes only, web evidence). -->

## Overview

**Creative North Star: "Calibrated"**

FlexTrack is a meet-day competition platform. Colour is a measurement, not decoration: the only hues in the app are the IWF calibrated-plate colours, and each one carries exactly one meaning. Everything else is rubber floor and chalk. A lifter glancing at the phone from a metre away on a bench should read state from hue and number alone, with the meaning also printed in words or digits so colour is never the only carrier.

The voice is a scoreboard. Big Shoulders Display sets every number and every title tall and condensed; Archivo carries all running text. Surfaces are filled rubber tones stacked by lightness, never outlined, and depth comes from fill rather than shadow. The signature objects are literal gym-floor instruments: a side-view loaded barbell with real plate diameters, three judges' lights, a yellow record band, a draining rest bar.

The world explicitly replaces the category default of a navy dashboard with one neon accent, glow, and icon-tile stat cards.

Provenance: the direction was user-pinned, so no concept roll ran. `seed: none (no roll; user-pinned direction)`.

**Key Characteristics:**
- Rubber-black ground, filled rubber surfaces, chalk text and chalk primary actions.
- Plate hues are the only hues, each with a single fixed meaning.
- Scoreboard numerals (Big Shoulders Display, tabular) against plain Archivo text.
- No borders on surfaces, no glow, no eyebrows; hairlines only inside lists.
- Large one-handed targets (44px floor, 52 to 64px for in-session controls).

## Colors

A near-monochrome rubber-and-chalk field in which five plate hues appear only when they mean something.

### Primary
- **Chalk** (#F2F1EC): the primary action colour (filled buttons, active chip, quick-start disc, drain bar), all primary text, and the good-lift light. Rubber Floor text sits on it.
- **Chalk Bright** (#FFFFFF): pressed/strong variant of chalk only.

### Secondary (plate hues: meaning, never decoration)
- **Plate Red 25** (#D2232A): the 25 kg plate, the push category, and the judges' no-lift light: a missed or skipped set, and destructive actions (as a 14% soft fill behind danger buttons).
- **No-Lift Text** (#F0676B): red lightened for legible danger text on rubber; same meaning as Plate Red.
- **Plate Blue 20** (#1E5BC6): the 20 kg plate and the pull category.
- **Plate Yellow 15** (#F3C316): the 15 kg plate and personal records. Nothing else.
- **Plate Green 10** (#1E9B4B): the 10 kg plate and the legs category. Nothing else.
- **Plate Chrome** (#B9BDC1): 1.25 and 0.5 kg change plates, the bar's sleeves and collars, and the cardio category.
- **Plate Charcoal 2.5** (#3A3D40): the 2.5 kg plate only.
- **Category Other** (#5A5E62): exercises that classify as none of push, pull, legs, cardio.

### Neutral
- **Rubber Floor** (#141516): app canvas, text on chalk and yellow, input wells.
- **Rubber Surface** (#1D1F21): cards, tab bar, sheets, dialogs.
- **Rubber Raised** (#26292C): secondary buttons, stepper buttons, empty calendar and heat cells, unlit judge-light sockets.
- **Rubber Pressed** (#303438): sheet handle, partial-state tick track.
- **List Hairline** (#2E3236): dividers between rows inside a list, chart gridlines.
- **Input Boundary** (#6B706C): the 1px 3:1 boundary of text inputs and steppers. Nothing else.
- **Chalk Secondary / Muted / Subtle** (#C9C9C3 / #A3A59F / #8E908B): secondary copy, captions and meta, inactive tab labels and chart axes.
- **Scrim** (rgba(8, 9, 10, 0.82)): behind sheets and dialogs.

### Named Rules
**The Calibrated Plate Rule.** Plate hues are the only hues. A new colour may enter only as a plate or as a meaning already listed here.

**The Yellow Is a Record Rule.** Yellow (#F3C316) means a personal record and nothing else: the record band, record points on charts, the "new" value mark. Never warnings, highlights or streaks.

**The Red Light Rule.** Red (#D2232A) means push, a 25 kg plate, or a no-lift: a missed or skipped set and destructive actions. A good lift or a completed set is a chalk-white light.

**The Green Is Legs Rule.** Green (#1E9B4B) belongs to the legs category only. Improvement is printed in chalk with a sign (+2.5 kg), never coloured green.

**The Two-and-a-Half Rule.** The 2.5 kg plate is charcoal (#3A3D40), not IWF small-plate red, so it can never be read as a 25 kg plate at a glance.

## Typography

**Display Font:** Big Shoulders Display (ExtraBold 800, Bold 700, Black 900)
**Body Font:** Archivo (Regular 400, Medium 500, SemiBold 600, Bold 700)

**Character:** A condensed scoreboard face for every number and title against a plain grotesque that keeps instructions and meta quiet.

### Hierarchy
- **Timer** (Big Shoulders 800, 64/66, tabular): elapsed session clock; the full-screen rest countdown scales it to 128.
- **Display** (Big Shoulders 800, 40/42): screen titles, today's routine name, record values.
- **Title** (Big Shoulders 700, 30/34): sheet and dialog titles, inline headers; section headers use it at 24/28.
- **Metric** (Big Shoulders 800, 34/36, tabular): scoreboard counts; stepper values use the same face at 48.
- **Heading** (Archivo 600, 17/22): list-row titles, record exercise names.
- **Body** (Archivo 400, 15/22): running text and meta.
- **Label** (Archivo 600, 14/18): chips, row names, units, sentence case.
- **Button** (Archivo 700, 16/20): all button labels, sentence case.
- **Caption** (Archivo 500, 12/16): legends, axes, tab labels. The floor of the scale.

### Named Rules
**The Family-Per-Weight Rule.** Each weight is its own registered family (`BigShouldersDisplay_800ExtraBold`, `Archivo_600SemiBold`, ...), loaded by `useAppFonts` on native and via FontFace on web. Pick weight by family; never set `fontWeight`.

**The Scoreboard Rule.** Numbers and titles are Big Shoulders Display; text is Archivo. Every numeral that updates or is compared is tabular.

**The Twelve Floor Rule.** No text below 12px.

## Layout

Single-column phone layout with 16px screen gutters on a 4px base rhythm (4, 8, 12, 16, 20, 24, 32). Cards pad 16px and stack with 8 to 16px between them. A fixed bottom tab bar (72px Android, 88px iOS) carries four tabs split around a centred 56px quick-start disc. In-session screens put primary controls in the thumb zone: a full-width chalk bar at the bottom, a rest dock above it that never covers Next or Finish.

**The Gym-Floor Target Rule.** Every touch target is at least 44px; in-session controls are larger (52px buttons, 56x64px steppers, 64px value fields).

## Elevation & Depth

Flat by default. Depth is tonal: Rubber Floor, then Surface, then Raised, then Pressed, each a step lighter. Cards carry no shadow. The only shadow is on bottom sheets and dialogs, which rise over a scrim. There is no glow anywhere.

### Shadow Vocabulary
- **Sheet** (shadowColor #000, offset 0/-6, opacity 0.4, radius 18, elevation 12): bottom sheets and the web dialog only.

### Named Rules
**The Fill Separates Rule.** Surfaces are separated by fill, never by borders or card shadows.

## Shapes

Small, machined corners: 4px for inputs, chips and value wells; 6px for buttons and steppers; 10px for cards, record band and judge-light board; 14px top corners on sheets and dialogs. Circles are reserved for lights, ticks and the quick-start disc. Borders exist in three places only: the 1px Input Boundary on fields, hairlines between rows inside a list, and a 2px chalk outline marking the selected cell in the calendar and heat strip.

**The No-Outline Surface Rule.** No card borders. `borderStrong` (Input Boundary) is used only as the 3:1 boundary of inputs.

## Components

### Buttons
Confident, filled, sentence case.
- **Shape:** gently squared (6px), 52px minimum height, 20px horizontal padding, optional 18px icon with 10px gap.
- **Primary:** Chalk fill, Rubber Floor label. One per view, the action that moves the session forward (Start session, Set done, Next exercise).
- **Secondary:** Rubber Raised fill, chalk label. **Ghost:** transparent, chalk label. **Danger:** 14% red soft fill with No-Lift Text label, for destructive actions only.
- **Press:** `PressableScale` scales to 0.97 (0.92 to 0.95 for small controls) over 100ms with `easeOut`, back over 160ms. Never an opacity strobe. Disabled is 40% opacity.

### Chips
- **Style:** Rubber Surface fill, Chalk Secondary label, 4px corners, 44px tall.
- **State:** active is a Chalk fill with Rubber Floor label.

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** Rubber Surface.
- **Shadow Strategy:** none (see Elevation).
- **Border:** none.
- **Internal Padding:** 16px.

### Inputs / Fields
- **Style:** Rubber Floor well (Rubber Surface on search fields), 1px Input Boundary, 4px corners, 48px minimum height.
- **Focus:** the boundary turns Chalk.

### Navigation
Rubber Surface tab bar with a single list hairline on top. Icons 22px; inactive in Chalk Subtle with caption labels; active in Chalk with a SemiBold label and a 28x3px chalk bar at the top edge. The centre quick-start disc is a 56px chalk circle ringed 4px in Rubber Raised and opens the bottom sheet. Headers use Display for top-level titles and Title beside a 44px back chevron.

### Sheet and Dialog
Rubber Surface, 14px top corners, 36x4px handle, Sheet shadow over the Scrim. The sheet rises with the `drawer` curve in 320ms and leaves in 220ms; exits are faster than entrances. On web, alerts route to the same sheet form with Button variants mapped from alert styles.

### Loaded Barbell (signature)
Side-view SVG of a 20kg bar loaded heaviest-in, plate heights at true relative diameters (25 and 20 share the full face). Each plate is its calibrated colour and printed with its kg in Big Shoulders 900 at 12px, dark ink on yellow, white and chrome plates. A caption states "20 kg bar + X kg a side" and any remainder that will not load.

### Judges' Lights (signature)
Three lights. Lit is a chalk-white disc (good lift); a no-lift is a red disc. On set completion they stagger on (80ms apart, 200ms each), hold, then fade; on the session summary they become a 34px board reporting what share of sets were done, with the verdict also spoken in the accessibility label.

### Steppers
A 56x64px Rubber Raised minus and plus around a Rubber Floor value well with the Input Boundary, the value in Big Shoulders 800 at 48px, unit in Label.

### Record Band (signature)
The whole band is the yellow plate: Rubber Floor text, exercise name in Heading, value in Display, "was" value in Label.

### Category Strip, Training Calendar, Heat Strip (signature)
Training category is always shown as its plate hue: the session strip (one segment per exercise, width by sets), calendar days split into category stripes, and a heat strip of four mixed steps of each category hue over Rubber Raised. Counts are printed alongside or in the cells.

### Rest Dock
Docked above the footer: a 3px chalk drain bar that slides out linearly, a 40px Big Shoulders countdown, the next load, 48px adjust and skip buttons. Expanded, it becomes a full-screen 128px countdown with controls in the thumb zone; the last three seconds pulse.

### Motion
Built on React Native's Animated API with tokens from `theme.motion`: `easeOut` cubic-bezier(0.23, 1, 0.32, 1), `easeInOut` cubic-bezier(0.77, 0, 0.175, 1), `drawer` cubic-bezier(0.32, 0.72, 0, 1); durations 120 / 200 / 280ms; native driver off on web. `useReducedMotion` disables scale and travel; reduced-motion sheets cross-fade in 120ms.

## Do's and Don'ts

### Do:
- **Do** take every hue from a plate, and give each hue only its listed meaning.
- **Do** print improvement in chalk with a sign (+2.5 kg).
- **Do** pair every colour signal with a printed word or number.
- **Do** set numbers and titles in Big Shoulders Display, text in Archivo, by family name.
- **Do** separate surfaces by fill (Floor, Surface, Raised, Pressed).
- **Do** keep touch targets at 44px or more.
- **Do** animate with the Animated API and `theme.motion` tokens, and honour Reduce Motion.

### Don't:
- **Don't** use yellow for anything but records.
- **Don't** use green for success, improvement or progress; it is legs.
- **Don't** draw the 2.5 kg plate red.
- **Don't** set `fontWeight`, or any text below 12px.
- **Don't** add eyebrows or kickers above titles.
- **Don't** put borders or shadows on cards; hairlines live only inside lists, and the Input Boundary only on inputs.
- **Don't** add glow, gradients, or icon-tile stat cards.
