#!/bin/bash
set -euo pipefail

fail() { echo "❌ $1"; exit 1; }

APPROVAL="src/components/ApprovalPage.jsx"
LINES="src/components/TimesheetLines.jsx"

grep -F -n 'showResponsible={false}' "$APPROVAL" >/dev/null || fail "ApprovalPage debe pasar showResponsible={false}"
grep -F -n 'showResourceColumns={true}' "$APPROVAL" >/dev/null || fail "ApprovalPage debe pasar showResourceColumns={true}"
grep -F -n 'line.status === "Pending" && !showResponsible' "$LINES" >/dev/null || fail "TimesheetLines debe usar checkbox en Aprobación"

echo "✅ Smoke aprobación OK"

