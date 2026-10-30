#!/usr/bin/env bash
# Runs inside the emulator in CI (the emulator action runs each `script:` line in its own shell, so the logic lives here).
# Usage: ci-android.sh <smoke|full>. Maestro's output goes to maestro.log; the workflow attaches its tail to the run.
set -uo pipefail
MODE="${1:-smoke}"
fail() { tail -60 maestro.log; exit 1; }

adb install -r android/app/build/outputs/apk/release/app-release.apk
FLAGS=""
[ "$MODE" = "smoke" ] && FLAGS="--include-tags=smoke"
# shellcheck disable=SC2086
maestro test $FLAGS --format junit --output e2e-report.xml .maestro > maestro.log 2>&1 || fail
if [ "$MODE" = "full" ]; then bash .maestro/adb/unreadable-data.sh >> maestro.log 2>&1 || fail; fi
