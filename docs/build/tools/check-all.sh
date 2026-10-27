#!/usr/bin/env bash
# Run every Milo check against one checkout: syntax, integrity, Node tests and the four browser suites.
# Usage: check-all.sh <repo-dir> <port> [suite.html ...]
# Each caller uses its own port, so browser storage (per origin) never collides between parallel runs.
set -u
REPO="${1:?repo dir}"; PORT="${2:?port}"; shift 2
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO" || exit 2
status=0
echo "== syntax"; node --check boot.js && node --check app.js && node --check security.js && node --check sw.js || status=1
echo "== integrity"; node tools/update-integrity.cjs --check || { echo "integrity out of date: run node tools/update-integrity.cjs"; status=1; }
echo "== node tests"; node --test tests/*.test.cjs 2>&1 | grep -E "^# (tests|pass|fail)|^not ok" || true
node --test tests/*.test.cjs >/dev/null 2>&1 || status=1
echo "== browser suites (port $PORT)"
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
sleep 1
node "$HERE/run-suites.cjs" "$PORT" "$@" || status=1
kill $SRV 2>/dev/null
if [ "$#" -eq 0 ]; then
  echo "== installed-app upgrade"
  node "$HERE/check-upgrade.cjs" || status=1
  echo "== reopening paint"
  node "$HERE/check-startup.cjs" || status=1
fi
echo "== overall: $([ $status -eq 0 ] && echo PASS || echo FAIL)"
exit $status
