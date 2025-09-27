#!/bin/bash
set -euo pipefail

fail() { echo "❌ $1"; exit 1; }

LINES="src/components/TimesheetLines.jsx"
EDIT="src/components/TimesheetEdit.jsx"

grep -n 'status === "Rejected"' "$LINES" >/dev/null || fail "Falta manejo de Rechazadas"
# En edición no deben mostrarse columnas de recurso: asegurarse de que NO se pasa showResourceColumns
! grep -n 'showResourceColumns=\{true\}' "$EDIT" >/dev/null || fail "Edición no debe pasar showResourceColumns={true}"

echo "✅ Smoke rejected OK"

