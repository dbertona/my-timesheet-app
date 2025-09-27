#!/bin/bash
set -euo pipefail

fail() { echo "❌ $1"; exit 1; }

APPROVAL="src/components/ApprovalPage.jsx"
EDIT="src/components/TimesheetEdit.jsx"

grep -n "BackToDashboard" "$APPROVAL" >/dev/null || fail "Falta BackToDashboard en ApprovalPage"
grep -n "BackToDashboard" "$EDIT" >/dev/null || fail "Falta BackToDashboard en TimesheetEdit"

echo "✅ Smoke dashboard OK"

