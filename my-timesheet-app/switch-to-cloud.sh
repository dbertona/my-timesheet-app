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
