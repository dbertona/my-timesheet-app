#!/bin/zsh

# Publica la extensión AL sin depuración (AL: Publish without debugging)

set -e

PROJECT_DIR="/Users/marcelodanielbertona/POWER-SOLUTION-PROJECTS/Power_Solution_BC"

echo "[1/3] Activando Cursor y el workspace AL…"
osascript -l AppleScript <<'APPLESCRIPT'
on run
    set projectFile to POSIX file "/Users/marcelodanielbertona/POWER-SOLUTION-PROJECTS/Power_Solution_BC/app.json"
    set editorApp to "Cursor"
    try
        -- Cerrar Cursor si está abierto para garantizar que lea settings.json
        tell application editorApp to quit
    on error
        set editorApp to "Visual Studio Code"
        try
            tell application editorApp to quit
        end try
    end try
    delay 0.8

    -- Reabrir el proyecto
    tell application editorApp
        activate
        open projectFile
    end tell
    delay 2.5

    tell application "System Events"
        tell process editorApp
            -- Paleta de comandos: Descargar símbolos primero
            key down command
            key down shift
            keystroke "p"
            key up shift
            key up command
            delay 0.35
            keystroke "AL: Download Symbols"
            delay 0.4
            key code 36 -- Return
        end tell
    end tell

    -- Esperar descarga de símbolos
    delay 3.0

    tell application "System Events"
        tell process editorApp
            -- Paleta de comandos: Publicación completa (no RAD)
            key down command
            key down shift
            keystroke "p"
            key up shift
            key up command
            delay 0.35
            keystroke "AL: Publish"
            delay 0.4
            key code 36 -- Return
        end tell
    end tell
end run
APPLESCRIPT

echo "[2/3] Símbolos descargados."
echo "[3/3] Publicación solicitada (AL: Publish, RAD desactivado)."

exit 0


