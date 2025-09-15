#!/bin/bash
set -euo pipefail

fail() { echo "❌ $1"; exit 1; }

FILE="src/components/ApprovalPage.jsx"

# 1) No texto "Seleccionar todo" literal en la cabecera de líneas
if grep -n "Seleccionar todo" "$FILE" >/dev/null; then
  fail "No debe haber texto 'Seleccionar todo' en la cabecera de líneas"
fi

# 2) Acciones deben estar en lines-header (no bloque inferior approval-actions)
if grep -n "approval-actions" "$FILE" >/dev/null; then
  fail "No debe existir el contenedor inferior 'approval-actions'"
fi

# 3) Debe existir el bloque lines-actions dentro de lines-header con botones
grep -n "lines-actions" "$FILE" >/dev/null || fail "Falta 'lines-actions' en cabecera"
grep -n "Aprobar Selección" "$FILE" >/dev/null || fail "Falta botón Aprobar Selección en cabecera"
grep -n "Rechazar Selección" "$FILE" >/dev/null || fail "Falta botón Rechazar Selección en cabecera"

echo "✅ Smoke UI Aprobación OK"

