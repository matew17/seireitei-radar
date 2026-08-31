#!/usr/bin/env bash
set -uo pipefail

FAILED=""

npx tsc --noEmit 2>&1 | tail -20 > /tmp/tsc.log || FAILED="$FAILED typecheck"
npm run lint --silent > /tmp/lint.log 2>&1      || FAILED="$FAILED lint"
npm test --silent > /tmp/test.log 2>&1          || FAILED="$FAILED tests"
npm run build --silent > /tmp/build.log 2>&1    || FAILED="$FAILED build"

if [[ -n "$FAILED" ]]; then
  {
    echo "QUALITY GATE FAILED:$FAILED"
    echo "This is an automated gate, not a user denial. Fix the errors and retry."
    echo "--- output ---"
    for f in tsc lint test build; do
      [[ -s /tmp/$f.log ]] && { echo "[$f]"; tail -15 /tmp/$f.log; }
    done
  } >&2
  exit 2
fi
echo "QUALITY GATE PASSED"
exit 0
