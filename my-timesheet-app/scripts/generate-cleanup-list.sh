#!/bin/bash

# Script para generar lista de archivos de APIs no utilizadas para eliminar

echo "🗑️  Generando lista de APIs no utilizadas para eliminar"
echo "======================================================"
echo ""

# Cambiar al directorio del proyecto BC
BC_PROJECT_PATH="../Power_Solution_BC"

if [ ! -d "$BC_PROJECT_PATH" ]; then
    echo "❌ Error: No se encontró el directorio del proyecto BC en $BC_PROJECT_PATH"
    echo "   Asegúrate de que el proyecto Power_Solution_BC esté en el directorio padre"
    exit 1
fi

echo "📁 Directorio del proyecto BC: $BC_PROJECT_PATH"
echo ""

# APIs no utilizadas - Queries v2.0
echo "🔸 Queries v2.0 no utilizadas:"
echo "------------------------------"

QUERIES_TO_DELETE=(
    "src/Queries/50221 PS_HistoricoPlanificacionMes.al"
    "src/Queries/50220 PS_Years.al"
    "src/Queries/50219 PS_PlanificacionMes.al"
    "src/Queries/50218 PS_ObjectivesByDepartaments.al"
    "src/Queries/50217 PS_MesesCerrados.al"
    "src/Queries/50215 PS_ExpedienteMes.al"
    "src/Queries/50214 PS_MovimientosProyectosMes.al"
    "src/Queries/50212 PS_DiasDeImputacion.al"
    "src/Queries/50211 PS_PresentacionIva.al"
    "src/Queries/50210 PS_Links.al"
    "src/Queries/50209 PS_Tipologias.al"
    "src/Queries/50208 PS_Tecnologias.al"
    "src/Queries/50205 PS_MovimientosProyectos.al"
    "src/Queries/50204 PS_EquipoProyectos.al"
    "src/Queries/50203 PS_Departamentos.al"
    "src/Queries/50202 PS_ConfiguracionUsuarios.al"
    "src/Queries/50201 PS_ConceptosAnaliticos.al"
    "src/Queries/50200 PS_CentrosDeResponsabilidad.al"
    "src/Queries/50236 PS_TimeSheetLinesAPI.al"
)

for query in "${QUERIES_TO_DELETE[@]}"; do
    file_path="$BC_PROJECT_PATH/$query"
    if [ -f "$file_path" ]; then
        echo "  ✅ $query"
    else
        echo "  ❌ $query (no encontrado)"
    fi
done

echo ""

# APIs no utilizadas - Pages v1.0
echo "🔸 Pages v1.0 no utilizadas:"
echo "----------------------------"

PAGES_TO_DELETE=(
    "src/Pages/50737 PS_UpdateSeriesAPI.al"
)

for page in "${PAGES_TO_DELETE[@]}"; do
    file_path="$BC_PROJECT_PATH/$page"
    if [ -f "$file_path" ]; then
        echo "  ✅ $page"
    else
        echo "  ❌ $page (no encontrado)"
    fi
done

echo ""

# Generar script de eliminación
echo "📝 Generando script de eliminación..."
echo ""

cat > scripts/delete-unused-apis.sh << 'EOF'
#!/bin/bash

# Script para eliminar APIs no utilizadas del proyecto BC
# ⚠️  ADVERTENCIA: Este script eliminará archivos permanentemente

BC_PROJECT_PATH="../Power_Solution_BC"

if [ ! -d "$BC_PROJECT_PATH" ]; then
    echo "❌ Error: No se encontró el directorio del proyecto BC"
    exit 1
fi

echo "🗑️  Eliminando APIs no utilizadas del proyecto BC"
echo "================================================"
echo ""

# Confirmar antes de eliminar
read -p "⚠️  ¿Estás seguro de que quieres eliminar estas APIs? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Operación cancelada"
    exit 0
fi

echo ""

# Eliminar Queries v2.0 no utilizadas
echo "🔸 Eliminando Queries v2.0 no utilizadas..."

QUERIES_TO_DELETE=(
    "src/Queries/50221 PS_HistoricoPlanificacionMes.al"
    "src/Queries/50220 PS_Years.al"
    "src/Queries/50219 PS_PlanificacionMes.al"
    "src/Queries/50218 PS_ObjectivesByDepartaments.al"
    "src/Queries/50217 PS_MesesCerrados.al"
    "src/Queries/50215 PS_ExpedienteMes.al"
    "src/Queries/50214 PS_MovimientosProyectosMes.al"
    "src/Queries/50212 PS_DiasDeImputacion.al"
    "src/Queries/50211 PS_PresentacionIva.al"
    "src/Queries/50210 PS_Links.al"
    "src/Queries/50209 PS_Tipologias.al"
    "src/Queries/50208 PS_Tecnologias.al"
    "src/Queries/50205 PS_MovimientosProyectos.al"
    "src/Queries/50204 PS_EquipoProyectos.al"
    "src/Queries/50203 PS_Departamentos.al"
    "src/Queries/50202 PS_ConfiguracionUsuarios.al"
    "src/Queries/50201 PS_ConceptosAnaliticos.al"
    "src/Queries/50200 PS_CentrosDeResponsabilidad.al"
    "src/Queries/50236 PS_TimeSheetLinesAPI.al"
)

deleted_count=0
for query in "${QUERIES_TO_DELETE[@]}"; do
    file_path="$BC_PROJECT_PATH/$query"
    if [ -f "$file_path" ]; then
        rm "$file_path"
        echo "  ✅ Eliminado: $query"
        ((deleted_count++))
    else
        echo "  ❌ No encontrado: $query"
    fi
done

echo ""

# Eliminar Pages v1.0 no utilizadas
echo "🔸 Eliminando Pages v1.0 no utilizadas..."

PAGES_TO_DELETE=(
    "src/Pages/50737 PS_UpdateSeriesAPI.al"
)

for page in "${PAGES_TO_DELETE[@]}"; do
    file_path="$BC_PROJECT_PATH/$page"
    if [ -f "$file_path" ]; then
        rm "$file_path"
        echo "  ✅ Eliminado: $page"
        ((deleted_count++))
    else
        echo "  ❌ No encontrado: $page"
    fi
done

echo ""
echo "📊 RESUMEN:"
echo "----------"
echo "Archivos eliminados: $deleted_count"
echo "APIs no utilizadas eliminadas del proyecto BC"
echo ""
echo "✅ Limpieza completada"
EOF

chmod +x scripts/delete-unused-apis.sh

echo "✅ Script de eliminación generado: scripts/delete-unused-apis.sh"
echo ""

echo "📋 INSTRUCCIONES:"
echo "================="
echo "1. Revisa la lista de archivos arriba"
echo "2. Ejecuta: ./scripts/delete-unused-apis.sh"
echo "3. Confirma la eliminación cuando se te solicite"
echo "4. Haz commit de los cambios en el proyecto BC"
echo ""

echo "⚠️  ADVERTENCIAS:"
echo "================"
echo "- Este script eliminará archivos permanentemente"
echo "- Asegúrate de hacer backup antes de ejecutar"
echo "- Verifica que no necesites estas APIs para funcionalidad futura"
echo ""

echo "✅ Lista generada exitosamente"
