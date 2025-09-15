#!/bin/bash
set -euo pipefail

fail() { echo "❌ $1"; exit 1; }

FILE_APPROVAL="src/components/ApprovalPage.jsx"
FILE_EDIT="src/components/TimesheetEdit.jsx"

grep -n "BackToDashboard" "$FILE_APPROVAL" >/dev/null || fail "Falta BackToDashboard en ApprovalPage"
grep -n "BackToDashboard" "$FILE_EDIT" >/dev/null || fail "Falta BackToDashboard en TimesheetEdit"

echo "✅ Smoke BackToDashboard OK"

