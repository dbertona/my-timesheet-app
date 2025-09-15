#!/bin/bash
set -euo pipefail

fail() { echo "❌ $1"; exit 1; }

LINES="src/components/TimesheetLines.jsx"
EDIT="src/components/TimesheetEdit.jsx"

# Debe existir lógica específica para estado Rejected en TimesheetLines
grep -n 'status === "Rejected"' "$LINES" >/dev/null || fail "Falta manejo visual para líneas Rechazadas en TimesheetLines"

# En edición se debe renderizar con showResponsible=true
grep -n '<TimesheetLines' "$EDIT" | grep -n 'showResponsible=\{true\}' >/dev/null || fail "TimesheetEdit debe pasar showResponsible={true}"

echo "✅ Smoke Rejected en Edición OK"

