#!/bin/bash
set -euo pipefail

fail() { echo "❌ $1"; exit 1; }

APPROVAL="src/components/ApprovalPage.jsx"
EDIT="src/components/TimesheetEdit.jsx"

# Verificar uso de clases comunes en títulos
grep -n "ts-page-title" "$APPROVAL" >/dev/null || fail "Aprobación debe usar ts-page-title"
grep -n "ts-page-title--link" "$EDIT" >/dev/null || fail "Edición debe usar ts-page-title--link"

echo "✅ Smoke estilos de títulos OK"

