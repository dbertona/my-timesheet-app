#!/bin/bash
set -euo pipefail

fail() { echo "❌ $1"; exit 1; }

LINES="src/components/TimesheetLines.jsx"
EDIT="src/components/TimesheetEdit.jsx"

# Debe existir lógica específica para estado Rejected en TimesheetLines
grep -n 'status === "Rejected"' "$LINES" >/dev/null || fail "Falta manejo visual para líneas Rechazadas en TimesheetLines"
grep -n 'forceVisibleByStatus = l.status === "Rejected"' "$LINES" >/dev/null || fail "Las líneas Rechazadas deben forzarse visibles en el filtrado"
grep -n 'forceVisibleByStatus = l.status === "Rejected"' "$EDIT" >/dev/null || fail "Edición debe forzar visibles las Rechazadas en el filtrado"
grep -n '\[TimesheetEdit\] header:' "$EDIT" >/dev/null || echo "⚠️ Aviso: no se encontró log de depuración opcional"

# En edición se debe renderizar con showResponsible=true
grep -n '<TimesheetLines' "$EDIT" | grep -n 'showResponsible=\{true\}' >/dev/null || fail "TimesheetEdit debe pasar showResponsible={true}"

echo "✅ Smoke Rejected en Edición OK"

