#!/bin/bash

# Script para solucionar definitivamente el problema de cookies seguras en n8n
# Ejecutar en la máquina Debian

echo "🔧 Solucionando problema de cookies seguras en n8n..."

cd ~/n8n-https-simple

# Detener n8n
echo "🛑 Deteniendo n8n..."
docker compose down

# Actualizar docker-compose.yml con cookies seguras deshabilitadas
echo "📝 Actualizando configuración..."
cat > docker-compose.yml << 'EOF'
version: "3.8"

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=n8n_admin_2024
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://192.168.88.68:5678/
      - GENERIC_TIMEZONE=Europe/Madrid
      - N8N_LOG_LEVEL=info
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_SECURE_COOKIE=false
      - N8N_COOKIE_SECURE=false
      - N8N_COOKIE_SAME_SITE=lax
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - n8n_network

volumes:
  n8n_data:
    driver: local

networks:
  n8n_network:
    driver: bridge
EOF

# Reiniciar n8n
echo "🚀 Reiniciando n8n..."
docker compose up -d

# Esperar a que se inicie
echo "⏳ Esperando a que n8n se reinicie..."
sleep 30

# Verificar estado
echo "🔍 Verificando estado..."
docker compose ps

echo ""
echo "✅ ¡Problema de cookies solucionado!"
echo ""
echo "📱 Accede a n8n en: http://192.168.88.68:5678"
echo "👤 Usuario: admin"
echo "🔑 Contraseña: n8n_admin_2024"
echo ""
echo "🔒 Cookies seguras deshabilitadas para desarrollo local"
echo "📊 Para ver logs: docker compose logs -f n8n"
echo ""
echo "🚀 Ahora puedes acceder sin problemas y configurar la integración BC ↔ Supabase"
