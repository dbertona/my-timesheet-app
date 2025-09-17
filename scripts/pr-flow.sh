#!/usr/bin/env bash
set -euo pipefail

usage(){
  cat <<EOF
Uso: $0 <open|status|rerun-ci|merge|cleanup> [args]

Subcomandos:
  open [titulo] [cuerpo]    Crea/actualiza PR hacia reset/main desde la rama actual
  status                    Muestra estado de PR y checks
  rerun-ci                  Re-ejecuta el último workflow de CI de la PR
  merge [--squash|--merge]  Fusiona la PR si checks OK (no fuerza cuando hay fallos)
  cleanup [--remote BR]     Limpia ramas locales mergeadas y opcionalmente borra la remota BR
EOF
}

ensure_gh(){ command -v gh >/dev/null || { echo "gh CLI requerido"; exit 1; }; }
ensure_git_clean(){
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "⚠️  Hay cambios sin commitear. Haz commit o stash antes."; exit 1;
  fi
}

current_branch(){ git rev-parse --abbrev-ref HEAD; }
get_pr_number(){ gh pr list --head "$(current_branch)" --json number --jq '.[0].number' || true; }

cmd_open(){
  ensure_gh; ensure_git_clean || true
  local title="${1:-$(current_branch)}";
  local body="${2:-""}";
  echo "🚀 Creando/actualizando PR…"
  HUSKY=0 git push -u origin "$(current_branch)" >/dev/null 2>&1 || true
  if pr=$(get_pr_number); then
    if [[ -n "$pr" ]]; then
      gh pr edit "$pr" --title "$title" --body "$body" --base reset/main || true
      echo "✅ PR actualizada: $(gh pr view $pr --json url --jq .url)"; return
    fi
  fi
  url=$(gh pr create --base reset/main --head "$(current_branch)" --title "$title" --body "$body" 2>/dev/null || true)
  echo "✅ PR: ${url:-$(gh pr view --json url --jq .url)}"
}

cmd_status(){ ensure_gh; pr=$(get_pr_number); [[ -n "$pr" ]] || { echo "No hay PR para $(current_branch)"; exit 0; }
  gh pr view "$pr" --json url,state,mergeStateStatus,reviewDecision,statusCheckRollup | sed 's/\\n/\n/g'
}

cmd_rerun(){ ensure_gh; 
  run_id=$(gh run list --branch "$(current_branch)" --limit 1 --json databaseId --jq '.[0].databaseId' || true)
  [[ -n "$run_id" ]] || { echo "No hay runs de CI"; exit 0; }
  gh run rerun "$run_id" >/dev/null || true
  echo "🔁 CI relanzado: $run_id"
}

cmd_merge(){ ensure_gh; mode="--squash"; [[ ${1-} == "--merge" ]] && mode="--merge";
  pr=$(get_pr_number); [[ -n "$pr" ]] || { echo "No hay PR para $(current_branch)"; exit 1; }
  echo "🔎 Verificando checks…"
  status=$(gh pr view "$pr" --json statusCheckRollup --jq '.statusCheckRollup[].conclusion' 2>/dev/null || true)
  if echo "$status" | grep -q "FAILURE"; then echo "❌ Checks fallidos. No se hace merge."; exit 1; fi
  if echo "$status" | grep -q "PENDING"; then echo "⏳ Checks pendientes. Intenta más tarde."; exit 1; fi
  gh pr merge "$pr" $mode --delete-branch || { echo "⚠️  No mergeado (política de rama)."; exit 1; }
}

cmd_cleanup(){
  bash "$(dirname "$0")/cleanup-branches.sh" ${1-} ${2-}
}

case "${1-}" in
  open) shift; cmd_open "$@";;
  status) cmd_status;;
  rerun-ci) cmd_rerun;;
  merge) shift || true; cmd_merge "$@";;
  cleanup) shift || true; cmd_cleanup "$@";;
  *) usage; exit 1;;
 esac
