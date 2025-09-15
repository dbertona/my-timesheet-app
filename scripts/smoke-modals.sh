#!/bin/bash
set -euo pipefail

fail() { echo "❌ $1"; exit 1; }

# No se permiten alert/confirm/prompt en el código de UI
if grep -RnE "\b(alert|confirm|prompt)\(" src/components >/dev/null; then
  fail "Se encontró uso de alert/confirm/prompt. Usa BcModal/ApprovalModal"
fi

echo "✅ Smoke modals OK (sin alert/confirm/prompt)"

