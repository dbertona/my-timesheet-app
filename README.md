[![CI](https://github.com/dbertona/my-timesheet-app/actions/workflows/ci.yml/badge.svg)](https://github.com/dbertona/my-timesheet-app/actions/workflows/ci.yml)

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Cómo ejecutar comandos en la terminal de Cursor sin que se cuelgue

Para evitar que el chat quede "esperando" cuando ejecutas comandos en la terminal integrada, usa este patrón.

- **Reglas rápidas**
  - **Finaliza siempre** con: `echo "__DONE__"` para señalizar fin y devolver el control.
  - **Evita interacción**: usa flags no interactivos (`--yes`, `-y`, etc.).
  - **Sin paginadores**: agrega `| cat` si el comando podría abrir un pager (p. ej. `git log | cat`).
  - **Limita salida**: usa `head -n` o `tail -n` para salidas grandes.
  - El mensaje `RPROMPT: parameter not set` es **benigno** del prompt de zsh.

- **Plantilla recomendada (PATRÓN QUE FUNCIONA)**

```bash
cd "/Users/marcelodanielbertona/POWER-SOLUTION-PROJECTS/my-timesheet-app" && set -euo pipefail; COMANDO_1; COMANDO_2; echo "__DONE__"
```

- **Plantilla alternativa (NO FUNCIONA)**

```bash
set -euo pipefail; COMANDO_1; COMANDO_2; echo "__DONE__"
```

- **Ejemplo mínimo (prueba de terminal)**

```bash
cd "/Users/marcelodanielbertona/POWER-SOLUTION-PROJECTS/my-timesheet-app" && echo "test"; echo "__DONE__"
```

- **Ejemplo práctico**

```bash
cd "/Users/marcelodanielbertona/POWER-SOLUTION-PROJECTS/my-timesheet-app" && pwd; ls -la | head -n 20; echo "__DONE__"
```

- **Ejemplo: actualizar workflow en n8n**

```bash
cd "/Users/marcelodanielbertona/POWER-SOLUTION-PROJECTS/my-timesheet-app" && set -euo pipefail; N8N_URL="https://n8n.powersolution.es"; N8N_API_KEY="<TU_API_KEY>"; NAME="001_sincronizacion_completa"; WF_FILE="src/scripts/n8n/workflows/001_sincronizacion_completa.json"; TMP_PAYLOAD="/tmp/wf_001_payload.json"; WF_ID=$(curl -sS -H "X-N8N-API-KEY: $N8N_API_KEY" "$N8N_URL/api/v1/workflows" | jq -r ".data[] | select(.name==\"$NAME\") | .id" | head -n1); jq 'del(.id,.active,.isArchived,.pinData,.meta,.versionId,.staticData,.tags,.shared,.triggerCount) | .settings = ( .settings // {} )' "$WF_FILE" > "$TMP_PAYLOAD"; curl -sS -X PUT -H "X-N8N-API-KEY: $N8N_API_KEY" -H "Content-Type: application/json" --data-binary "@$TMP_PAYLOAD" "$N8N_URL/api/v1/workflows/$WF_ID" | jq '{id,name,updatedAt}'; echo "__DONE__"
```

- **Consejos adicionales**
  - Para procesos potencialmente largos, confirma primero con un comando de prueba que el terminal devuelva el control.
  - Si un comando pudiera quedar esperando entrada del usuario, revisa documentación y añade flags no interactivos.
  - En Cursor, también es posible ejecutar procesos en segundo plano; aun así, finaliza con `echo "__DONE__"` para señalizar fin.
  - **IMPORTANTE**: El patrón `cd "/ruta" && COMANDOS` funciona mejor que solo `COMANDOS`.

- **Solución de problemas (zsh)**
  - Si ves: `El proceso del terminal "/bin/zsh '-l'" finalizó con el código de salida 5`, suele indicar que algún dotfile de zsh aborta el arranque.
  - Workaround temporal: configurar un perfil que ignore configs de usuario en Cursor (`.vscode/settings.json`):

```json
{
  "terminal.integrated.profiles.osx": {
    "zsh-sin-config": {
      "path": "/bin/zsh",
      "args": ["-f", "-l"]
    }
  },
  "terminal.integrated.defaultProfile.osx": "zsh-sin-config"
}
```
