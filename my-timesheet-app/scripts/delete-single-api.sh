#!/bin/bash

# Script para eliminar solo PS_UpdateSeriesAPI del proyecto BC
# Esta API no se está utilizando en n8n

BC_PROJECT_PATH="../Power_Solution_BC"
API_FILE="src/Pages/50737 PS_UpdateSeriesAPI.al"

if [ ! -d "$BC_PROJECT_PATH" ]; then
    echo "❌ Error: No se encontró el directorio del proyecto BC en $BC_PROJECT_PATH"
    exit 1
fi

echo "🗑️  Eliminando API no utilizada: PS_UpdateSeriesAPI"
echo "=================================================="
echo ""

# Verificar que el archivo existe
file_path="$BC_PROJECT_PATH/$API_FILE"
if [ ! -f "$file_path" ]; then
    echo "❌ Error: No se encontró el archivo $API_FILE"
    exit 1
fi

echo "📁 Archivo a eliminar: $file_path"
echo ""

# Mostrar información del archivo
echo "📋 Información del archivo:"
echo "---------------------------"
echo "API: PS_UpdateSeriesAPI"
echo "Tipo: Page API"
echo "Versión: v1.0"
echo "Propósito: Actualizar series de números"
echo "Uso en n8n: ❌ No utilizado"
echo ""

# Confirmar eliminación
read -p "⚠️  ¿Estás seguro de que quieres eliminar esta API? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Operación cancelada"
    exit 0
fi

echo ""

# Eliminar el archivo
echo "🗑️  Eliminando archivo..."
rm "$file_path"

if [ $? -eq 0 ]; then
    echo "✅ Archivo eliminado exitosamente: $API_FILE"
else
    echo "❌ Error al eliminar el archivo"
    exit 1
fi

echo ""
echo "📊 RESUMEN:"
echo "----------"
echo "Archivo eliminado: 1"
echo "API eliminada: PS_UpdateSeriesAPI"
echo "Motivo: No utilizada en n8n"
echo ""

echo "📋 PRÓXIMOS PASOS:"
echo "=================="
echo "1. Compilar el proyecto BC para verificar que no hay errores"
echo "2. Hacer commit de los cambios en el proyecto BC"
echo "3. Desplegar la nueva versión sin esta API"
echo ""

echo "✅ Eliminación completada"
