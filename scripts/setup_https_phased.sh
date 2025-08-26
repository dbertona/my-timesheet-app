#!/bin/bash

# Script para configurar HTTPS en dos fases
# Ejecutar en la máquina Debian

echo "🚀 Configurando HTTPS en dos fases..."

cd ~/n8n-https

# Fase 1: Configurar Nginx para HTTP primero
echo "📝 Fase 1: Configurando Nginx para HTTP..."
cp ~/my-timesheet-app/docker/nginx-http-first.conf nginx-https.conf

# Reiniciar Nginx
echo "🔄 Reiniciando Nginx con configuración HTTP..."
docker compose restart nginx

# Esperar a que Nginx esté estable
echo "⏳ Esperando a que Nginx esté estable..."
sleep 10

# Verificar estado
echo "🔍 Verificando estado..."
docker compose ps

# Fase 2: Generar certificados SSL
echo "📝 Fase 2: Generando certificados SSL..."
docker compose exec certbot certonly --webroot --webroot-path=/var/www/certbot --email dbertona@powersolution.es --agree-tos --no-eff-email -d 192.168.88.68.nip.io

# Verificar si se generaron los certificados
if [ -d "./certbot/conf/live/192.168.88.68.nip.io" ]; then
    echo "✅ Certificados SSL generados exitosamente!"

    # Fase 3: Configurar Nginx para HTTPS
    echo "📝 Fase 3: Configurando Nginx para HTTPS..."
    cp ~/my-timesheet-app/docker/nginx-https.conf nginx-https.conf

    # Reiniciar Nginx con HTTPS
    echo "🔄 Reiniciando Nginx con HTTPS..."
    docker compose restart nginx

    # Esperar a que se estabilice
    echo "⏳ Esperando a que Nginx se estabilice..."
    sleep 10

    # Verificar estado final
    echo "🔍 Estado final:"
    docker compose ps

    echo ""
    echo "🎉 ¡HTTPS configurado exitosamente!"
    echo ""
    echo "📱 Accede a n8n en: https://192.168.88.68.nip.io"
    echo "👤 Usuario: admin"
    echo "🔑 Contraseña: n8n_admin_2024"
    echo ""
    echo "🔒 HTTPS configurado con Let's Encrypt"

else
    echo "❌ Error: No se pudieron generar los certificados SSL"
    echo "💡 Verifica que el dominio 192.168.88.68.nip.io sea accesible"
    echo "📱 n8n sigue funcionando en: http://192.168.88.68:5678"
fi

