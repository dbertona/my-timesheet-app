#!/bin/bash
set -euo pipefail

fail() { echo "❌ $1"; exit 1; }

if grep -RnE "\b(alert|confirm|prompt)\(" src/components >/dev/null; then
  fail "Se encontró alert/confirm/prompt en componentes UI"
fi

echo "✅ Smoke modals OK"

