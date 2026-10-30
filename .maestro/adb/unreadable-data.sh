#!/usr/bin/env bash
# Corrupts the stored routines of an installed debug-able emulator image (needs `adb root`, so a google_apis
# image, not a Play Store one), then checks how the app copes. Usage: unreadable-data.sh [adb-serial]
set -euo pipefail
cd "$(dirname "$0")"
PKG=com.HatefulRock.flextrack
# With several devices attached, name the one to use rather than guessing.
if [ -z "${1:-}" ] && [ "$(adb devices | grep -c 'device$')" -gt 1 ]; then
  echo "More than one device is connected: pass the serial, e.g. npm run e2e:corrupt -- emulator-5556" >&2
  exit 1
fi
DEVICE="${1:-$(adb devices | awk 'NR==2 {print $1}')}"

maestro --device "$DEVICE" test seed.yaml
adb -s "$DEVICE" root > /dev/null
adb -s "$DEVICE" wait-for-device
adb -s "$DEVICE" shell "sqlite3 /data/data/$PKG/databases/RKStorage \"insert or replace into catalystLocalStorage (key, value) values ('workout-templates', '{not json');\""
maestro --device "$DEVICE" test check-unreadable.yaml
