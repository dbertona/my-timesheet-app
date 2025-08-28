#!/bin/zsh

# Compila el proyecto AL desde Cursor en macOS y sincroniza XLIFF
# Pasos automatizados: AL: Package → Generate XLIFF → Synchronize Translation Units

set -e

PROJECT_DIR="/Users/marcelodanielbertona/POWER-SOLUTION-PROJECTS/Power_Solution_BC"
APP_JSON="$PROJECT_DIR/app.json"

echo "[1/4] Abriendo Cursor y activando workspace AL…"
osascript -l AppleScript <<'APPLESCRIPT'
on run
    set projectFile to POSIX file "/Users/marcelodanielbertona/POWER-SOLUTION-PROJECTS/Power_Solution_BC/app.json"

    set editorApp to "Cursor"
    try
        tell application editorApp
            activate
            open projectFile
        end tell
    on error
        set editorApp to "Visual Studio Code"
        tell application editorApp
            activate
            open projectFile
        end tell
    end try
    delay 0.8

    tell application "System Events"
        tell process editorApp
            -- Abrir paleta de comandos
            key down command
            key down shift
            keystroke "p"
            key up shift
            key up command
            delay 0.35
            -- Ejecutar AL: Package
            keystroke "AL: Package"
            delay 0.35
            key code 36 -- Return
        end tell
    end tell

    -- Espera aproximada a la compilación (ajustable)
    delay 6

    -- Generar XLIFF
    tell application "System Events"
        tell process editorApp
            key down command
            key down shift
            keystroke "p"
            key up shift
            key up command
            delay 0.3
            keystroke "AL: Generate XLIFF Translation Files"
            delay 0.4
            key code 36 -- Return
            delay 0.8
            -- Confirmar sobrescritura si aparece
            key code 36 -- Return
        end tell
    end tell

    delay 1.2

    -- Sincronizar unidades
    tell application "System Events"
        tell process editorApp
            key down command
            key down shift
            keystroke "p"
            key up shift
            key up command
            delay 0.3
            keystroke "Synchronize Translation Units"
            delay 0.4
            key code 36 -- Return
        end tell
    end tell

end run
APPLESCRIPT

echo "[2/4] Compilación solicitada (AL: Package)."
echo "[3/4] XLIFF generado."
echo "[4/4] Unidades de traducción sincronizadas."

exit 0





