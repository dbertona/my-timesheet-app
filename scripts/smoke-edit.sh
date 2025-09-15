#!/bin/bash
set -euo pipefail

fail() { echo "❌ $1"; exit 1; }

EDIT="src/components/TimesheetEdit.jsx"
LINES="src/components/TimesheetLines.jsx"

grep -n 'showResponsible=\{true\}' "$EDIT" >/dev/null || fail "TimesheetEdit debe pasar showResponsible={true}"
grep -n 'line.status === "Pending" && showResponsible' "$LINES" >/dev/null || fail "TimesheetLines debe usar icono en Edición"

echo "✅ Smoke edición OK"

