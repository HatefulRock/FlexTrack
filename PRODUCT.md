# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

One shared design language on iOS and Android (Expo). Only OS mechanics adapt per platform: safe areas, system Back and edge-swipe, haptics, keyboard behaviour, Reduce Motion. The Vite + react-native-web build is a preview and screenshot surface, not a separate product.

## Users

Hybrid lifters: people who train strength in a gym on a repeatable routine and also log runs, walks and rides. The core usage scene is mid-session on the gym floor: phone on the bench or in a pocket between sets, one hand, often chalky or sweaty, glancing from a metre or more away during rest.

## Product Purpose

FlexTrack plans, runs and records training sessions so a lifter can follow a routine, hit the numbers they hit last time or better, and see progress over weeks. Success is a session logged without friction and a lifter who trusts the record enough to train from it.

## Positioning

Local-first and account-free: every routine, log and body metric lives on the device. It treats lifting and cardio as one training record rather than two apps.

## Operating Context

- Routines with a weekly schedule; a Today view that surfaces the scheduled session.
- Guided workouts: per-set logging of reps, weight, duration or distance, previous-session values, plate calculator, adjustable rest timer, keep-awake.
- Quick log for activities completed outside a routine (strength, run, walk, cycle, timed, other).
- History (28-day grid, filters, session details) and Progress (records, consistency, training split, progression per exercise, bodyweight and BMI).

## Capabilities and Constraints

- React Native 0.81 + Expo 54, TypeScript, AsyncStorage persistence, manual view-state navigation in `App.tsx`.
- Weight units: kilograms only.
- Exercise types: reps (weighted, bodyweight, assisted), timer, distance (m, km, miles).
- The AI Creator page exists in code but is not reachable from the app.

## Brand Commitments

- Name: FlexTrack. MIT-licensed, open source.

## Evidence on Hand

- No real user data, testimonials or metrics. Screenshots in `docs/screenshots/` use deterministic demo data and must stay labelled as such.

## Product Principles

1. The gym floor is the design scene: every in-session control works one-handed, at a glance, from a distance.
2. Never lose a session: logging must survive interruptions, reloads and mistakes.
3. Show the lifter their last performance and a reason to beat it.
4. Lifting and cardio are one training record.
5. Local-first means no accounts, no sync prompts, no network dependence.

## Accessibility & Inclusion

Glanceable in dim gyms and bright outdoor light. Meaning is never carried by colour alone (weights and states are always also printed). Respect Reduce Motion and system text size where the platform supports it.
