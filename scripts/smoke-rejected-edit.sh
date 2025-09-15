#!/bin/bash
set -euo pipefail

fail() { echo "❌ $1"; exit 1; }

LINES="src/components/TimesheetLines.jsx"
EDIT="src/components/TimesheetEdit.jsx"

grep -n 'status === "Rejected"' "$LINES" >/dev/null || fail "Falta manejo de Rechazadas"
grep -n 'showResponsible=\{true\}' "$EDIT" >/dev/null || fail "Edición debe pasar showResponsible={true}"

echo "✅ Smoke rejected OK"

