#!/bin/bash

# Script para desplegar n8n con HTTPS usando Let's Encrypt
# Ejecutar en la máquina Debian

echo "🚀 Desplegando n8n con HTTPS..."

# Crear directorio para n8n HTTPS
mkdir -p ~/n8n-https
cd ~/n8n-https

# Crear directorios necesarios
mkdir -p ssl certbot/conf certbot/www

# Crear docker-compose.yml con HTTPS
echo "📝 Creando docker-compose.yml con HTTPS..."
cat > docker-compose.yml << 'EOF'
version: "3.8"

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
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
    depends_on:
      - nginx

  nginx:
    image: nginx:alpine
    container_name: n8n_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-https.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    networks:
      - n8n_network
    depends_on:
      - certbot

  certbot:
    image: certbot/certbot
    container_name: n8n_certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    command: certonly --webroot --webroot-path=/var/www/certbot --email dbertona@powersolution.es --agree-tos --no-eff-email -d 192.168.88.68.nip.io

volumes:
  n8n_data:
    driver: local

networks:
  n8n_network:
    driver: bridge
EOF

# Crear configuración de Nginx
echo "📝 Creando configuración de Nginx..."
cat > nginx-https.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream n8n {
        server n8n:5678;
    }

    # HTTP - redirect to HTTPS
    server {
        listen 80;
        server_name 192.168.88.68.nip.io;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS
    server {
        listen 443 ssl http2;
        server_name 192.168.88.68.nip.io;

        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/192.168.88.68.nip.io/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/192.168.88.68.nip.io/privkey.pem;

        # SSL security settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Proxy to n8n
        location / {
            proxy_pass http://n8n;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Timeout settings
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
}
EOF

# Iniciar servicios
echo "🐳 Iniciando servicios..."
docker compose up -d

# Esperar a que se inicie
echo "⏳ Esperando a que los servicios se inicien..."
sleep 30

# Verificar estado
echo "🔍 Verificando estado..."
docker compose ps

echo ""
echo "🎉 ¡n8n con HTTPS desplegado exitosamente!"
echo ""
echo "📱 Accede a n8n en: https://192.168.88.68.nip.io"
echo "👤 Usuario: admin"
echo "🔑 Contraseña: n8n_admin_2024"
echo ""
echo "🔒 HTTPS configurado con Let's Encrypt"
echo "📊 Para ver logs: docker compose logs -f n8n"
echo "🛑 Para detener: docker compose down"
echo "▶️  Para iniciar: docker compose up -d"
echo ""
echo "💡 Nota: La primera vez puede tardar unos minutos en generar los certificados SSL"

