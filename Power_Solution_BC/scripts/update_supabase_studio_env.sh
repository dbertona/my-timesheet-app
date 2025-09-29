#!/usr/bin/env bash
set -euo pipefail

# Uso: ./update_supabase_studio_env.sh /opt/supabase/ps-analytics/.env /opt/supabase/ps-analytics/docker-compose.yml
# Lee la anon key de .env y añade las vars a docker-compose de Studio

ENV_FILE=${1:-/opt/supabase/ps-analytics/.env}
DC_FILE=${2:-/opt/supabase/ps-analytics/docker-compose.yml}

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No existe: $ENV_FILE" >&2
  exit 1
fi
if [[ ! -f "$DC_FILE" ]]; then
  echo "No existe: $DC_FILE" >&2
  exit 1
fi

# Extraer anon key de .env (SUPABASE_ANON_KEY o ANON_KEY)
ANON_KEY=$(grep -E '^(SUPABASE_ANON_KEY|ANON_KEY)=' "$ENV_FILE" | head -1 | cut -d'=' -f2-)
if [[ -z "${ANON_KEY:-}" ]]; then
  echo "No se pudo obtener ANON_KEY desde $ENV_FILE" >&2
  exit 1
fi

# Asegurar bloque environment en servicio studio
if grep -q "studio:" "$DC_FILE"; then
  :
else
  echo "El archivo no contiene servicio 'studio': $DC_FILE" >&2
  exit 1
fi

# Inyectar variables
# Si existen, reemplazar; si no, añadir bajo servicios->studio->environment
python3 - <<PY
import sys, yaml
from pathlib import Path

dc_path = Path("$DC_FILE")
obj = yaml.safe_load(dc_path.read_text())

if 'services' not in obj or 'studio' not in obj['services']:
    print('No se encontró servicio studio', file=sys.stderr)
    sys.exit(1)

studio = obj['services']['studio']
studio.setdefault('environment', {})
studio['environment']['NEXT_PUBLIC_SUPABASE_URL'] = 'https://localhost:8445'
studio['environment']['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = "$ANON_KEY"

dc_path.write_text(yaml.safe_dump(obj, sort_keys=False))
print('Actualizado:', dc_path)
PY

echo "Listo. Reinicia el contenedor de Studio para aplicar cambios."
