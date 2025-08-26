#!/bin/bash

# Script simple para configurar HTTPS en n8n
# Ejecutar en la máquina Debian

echo "🚀 Configurando n8n con HTTPS simple..."

# Crear directorio para n8n HTTPS
mkdir -p ~/n8n-https-simple
cd ~/n8n-https-simple

# Crear docker-compose.yml simple
echo "📝 Creando docker-compose.yml simple..."
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
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://192.168.88.68.nip.io/
      - GENERIC_TIMEZONE=Europe/Madrid
      - N8N_LOG_LEVEL=info
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_SECURE_COOKIE=true
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

# Iniciar n8n
echo "🐳 Iniciando n8n..."
docker compose up -d

# Esperar a que se inicie
echo "⏳ Esperando a que n8n se inicie..."
sleep 30

# Verificar estado
echo "🔍 Verificando estado..."
docker compose ps

echo ""
echo "🎉 ¡n8n configurado exitosamente!"
echo ""
echo "📱 Accede a n8n en: http://192.168.88.68:5678"
echo "👤 Usuario: admin"
echo "🔑 Contraseña: n8n_admin_2024"
echo ""
echo "💡 Nota: HTTPS está configurado pero funcionará en HTTP por ahora"
echo "🔒 Para HTTPS completo, necesitaremos configurar un proxy reverso con SSL"
echo ""
echo "📊 Para ver logs: docker compose logs -f n8n"
echo "🛑 Para detener: docker compose down"
echo "▶️  Para iniciar: docker compose up -d"

