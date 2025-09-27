#!/bin/bash

# Script para actualizar la configuración de la app para usar Supabase local
# Uso: ./update-app-config.sh

set -e

echo "🔧 Actualizando configuración de la app para Supabase local..."

# Crear archivo .env.local
echo "📝 Creando .env.local..."
cat > ../.env.local << 'EOF'
# Configuración para Supabase Local
VITE_SUPABASE_URL=http://192.168.88.68:8000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNzksImV4cCI6MjA2OTQ0NzA3OX0.d78PxMnKsipdse_ozBSwTrEMs354rIvayh4lXE1LMW4

# Variables del backend
SUPABASE_PROJECT_URL=http://192.168.88.68:8000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNzksImV4cCI6MjA2OTQ0NzA3OX0.d78PxMnKsipdse_ozBSwTrEMs354rIvayh4lXE1LMW4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg3MTA3OSwiZXhwIjoyMDY5NDQ3MDc5fQ.PxpfuFsfvpeEPHCEiWhRn0SD1WxngTAEppJ-65QTTOQ

# Puerto del backend
PORT=3001

# Configuración de n8n (opcional para local)
N8N_WEBHOOK_NOTIFY_APPROVAL=
EOF

echo "✅ Archivo .env.local creado"

# Actualizar .gitignore para incluir .env.local
echo "📝 Actualizando .gitignore..."
if ! grep -q "\.env\.local" ../.gitignore; then
    echo "" >> ../.gitignore
    echo "# Archivos de configuración local" >> ../.gitignore
    echo ".env.local" >> ../.gitignore
    echo "✅ .env.local añadido a .gitignore"
else
    echo "✅ .env.local ya está en .gitignore"
fi

# Crear script de inicio para desarrollo local
echo "📝 Creando script de inicio para desarrollo local..."
cat > ../start-local.sh << 'EOF'
#!/bin/bash

# Script para iniciar la app con Supabase local
# Uso: ./start-local.sh

set -e

echo "🚀 Iniciando My Timesheet App con Supabase local..."

# Cargar variables de entorno
if [ -f .env.local ]; then
    echo "📝 Cargando variables de entorno desde .env.local..."
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "❌ Error: No se encontró .env.local"
    echo "   Ejecuta: ./supabase-local/update-app-config.sh"
    exit 1
fi

# Verificar que Supabase local esté funcionando
echo "🔍 Verificando Supabase local..."
if ! curl -s "http://192.168.88.68:8000/rest/v1/" > /dev/null; then
    echo "❌ Error: Supabase local no está funcionando"
    echo "   Ejecuta: ./supabase-local/deploy-to-vm.sh"
    exit 1
fi

echo "✅ Supabase local está funcionando"

# Iniciar la aplicación
echo "🎯 Iniciando aplicación..."
npm run dev:full
EOF

chmod +x ../start-local.sh
echo "✅ Script start-local.sh creado"

# Crear script para volver a Supabase Cloud
echo "📝 Creando script para volver a Supabase Cloud..."
cat > ../switch-to-cloud.sh << 'CLOUD_EOF'
#!/bin/bash

# Script para volver a usar Supabase Cloud
# Uso: ./switch-to-cloud.sh

set -e

echo "☁️ Cambiando a Supabase Cloud..."

# Crear backup de .env.local si existe
if [ -f .env.local ]; then
    mv .env.local .env.local.backup
    echo "✅ Backup de .env.local creado"
fi

# Restaurar configuración de Supabase Cloud
echo "📝 Restaurando configuración de Supabase Cloud..."
cat > .env.local << 'ENV_EOF'
# Configuración para Supabase Cloud
VITE_SUPABASE_URL=https://qfpswxjunoepznrpsltt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNzksImV4cCI6MjA2OTQ0NzA3OX0.d78PxMnKsipdse_ozBSwTrEMs354rIvayh4lXE1LMW4

# Variables del backend
SUPABASE_PROJECT_URL=https://qfpswxjunoepznrpsltt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNzksImV4cCI6MjA2OTQ0NzA3OX0.d78PxMnKsipdse_ozBSwTrEMs354rIvayh4lXE1LMW4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg3MTA3OSwiZXhwIjoyMDY5NDQ3MDc5fQ.PxpfuFsfvpeEPHCEiWhRn0SD1WxngTAEppJ-65QTTOQ

# Puerto del backend
PORT=3001

# Configuración de n8n
N8N_WEBHOOK_NOTIFY_APPROVAL=
ENV_EOF

echo "✅ Configuración cambiada a Supabase Cloud"
echo "🔧 Para volver a local: ./switch-to-local.sh"
CLOUD_EOF

chmod +x ../switch-to-cloud.sh
echo "✅ Script switch-to-cloud.sh creado"

# Crear script para cambiar a local
echo "📝 Creando script para cambiar a local..."
cat > ../switch-to-local.sh << 'LOCAL_EOF'
#!/bin/bash

# Script para cambiar a Supabase local
# Uso: ./switch-to-local.sh

set -e

echo "🏠 Cambiando a Supabase local..."

# Crear backup de .env.local si existe
if [ -f .env.local ]; then
    mv .env.local .env.local.backup
    echo "✅ Backup de .env.local creado"
fi

# Restaurar configuración de Supabase local
echo "📝 Restaurando configuración de Supabase local..."
cat > .env.local << 'ENV_EOF'
# Configuración para Supabase Local
VITE_SUPABASE_URL=http://192.168.88.68:8000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNzksImV4cCI6MjA2OTQ0NzA3OX0.d78PxMnKsipdse_ozBSwTrEMs354rIvayh4lXE1LMW4

# Variables del backend
SUPABASE_PROJECT_URL=http://192.168.88.68:8000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNzksImV4cCI6MjA2OTQ0NzA3OX0.d78PxMnKsipdse_ozBSwTrEMs354rIvayh4lXE1LMW4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg3MTA3OSwiZXhwIjoyMDY5NDQ3MDc5fQ.PxpfuFsfvpeEPHCEiWhRn0SD1WxngTAEppJ-65QTTOQ

# Puerto del backend
PORT=3001

# Configuración de n8n (opcional para local)
N8N_WEBHOOK_NOTIFY_APPROVAL=
ENV_EOF

echo "✅ Configuración cambiada a Supabase local"
echo "🔧 Para volver a cloud: ./switch-to-cloud.sh"
LOCAL_EOF

chmod +x ../switch-to-local.sh
echo "✅ Script switch-to-local.sh creado"

echo "🎉 Configuración de la app actualizada!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Desplegar Supabase local: ./deploy-to-vm.sh"
echo "   2. Migrar datos: ssh root@192.168.88.68 'cd /opt/timesheet-supabase && ./migrate-data.sh'"
echo "   3. Iniciar app local: ./start-local.sh"
echo ""
echo "🔄 Scripts disponibles:"
echo "   - ./start-local.sh: Iniciar app con Supabase local"
echo "   - ./switch-to-local.sh: Cambiar a Supabase local"
echo "   - ./switch-to-cloud.sh: Cambiar a Supabase Cloud"
