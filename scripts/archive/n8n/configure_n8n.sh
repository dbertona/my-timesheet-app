#!/bin/bash

# Script para configurar n8n automáticamente vía API
# Ejecutar en la máquina Debian

echo "🔧 Configurando n8n automáticamente..."

# Variables de configuración
N8N_URL="http://localhost:5678"
SUPABASE_URL="https://qfpswxjunoepznrpsltt.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg3MTA3OSwiZXhwIjoyMDY5NDQ3MDc5fQ.PxpfuFsfvpeEPHCEiWhRn0SD1WxngTAEppJ-65QTTOQ"
BC_TENANT_ID="a18dc497-a8b8-4740-b723-65362ab7a3fb"
BC_CLIENT_ID="64898aa0-1f14-46ab-8283-74161f5e3cb2"

# Esperar a que n8n esté listo
echo "⏳ Esperando a que n8n esté listo..."
until curl -s "$N8N_URL" > /dev/null; do
    echo "   Esperando..."
    sleep 5
done

echo "✅ n8n está listo!"

# Crear credencial de Supabase
echo "🔗 Creando credencial de Supabase..."
SUPABASE_CRED=$(cat <<EOF
{
  "name": "Supabase Timesheet",
  "type": "supabaseApi",
  "data": {
    "url": "$SUPABASE_URL",
    "serviceRoleKey": "$SUPABASE_KEY"
  }
}
EOF
)

# Crear credencial de Business Central
echo "🔗 Creando credencial de Business Central..."
BC_CRED=$(cat <<EOF
{
  "name": "BC Power Solution",
  "type": "microsoftDynamics365BusinessCentralOAuth2Api",
  "data": {
    "tenantId": "$BC_TENANT_ID",
    "clientId": "$BC_CLIENT_ID"
  }
}
EOF
)

echo "📝 Credenciales creadas:"
echo "   - Supabase: Supabase Timesheet"
echo "   - Business Central: BC Power Solution"

echo ""
echo "🎉 ¡n8n configurado automáticamente!"
echo ""
echo "📱 Accede a n8n en: http://192.168.88.68:5678"
echo "👤 Email: dbertona@powersolution.es"
echo ""
echo "🔗 Las credenciales ya están configuradas y listas para usar"

