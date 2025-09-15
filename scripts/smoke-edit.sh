#!/bin/bash
set -euo pipefail

fail() { echo "❌ $1"; exit 1; }

LINES="src/components/TimesheetLines.jsx"
EDIT="src/components/TimesheetEdit.jsx"

# 1) En edición se debe pasar showResponsible=true
grep -n "<TimesheetLines" "$EDIT" | grep -n "showResponsible=\{true\}" >/dev/null || fail "TimesheetEdit debe pasar showResponsible={true}"

# 2) TimesheetLines: si status === Approved -> isLineEditable devuelve false
grep -n "status === \"Approved\".*return false" "$LINES" >/dev/null || fail "Líneas Approved deben ser no editables"

echo "✅ Smoke UI Edición OK"

