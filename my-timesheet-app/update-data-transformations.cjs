const fs = require('fs');

// Leer el workflow actualizado
const workflowPath = 'src/scripts/n8n/workflows/001_sincronizacion_completa_smart_local.json';
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Función para actualizar transformaciones de datos
function updateDataTransformations(workflow) {
  const updatedNodes = workflow.nodes.map(node => {
    // Buscar nodos de código que transformen datos
    if (node.type === 'n8n-nodes-base.code' && node.parameters.jsCode) {
      let updatedCode = node.parameters.jsCode;

      // Actualizar transformación para calendar_period_days
      if (node.name.includes('calendar') || updatedCode.includes('calendar_type')) {
        console.log(`Actualizando transformación: ${node.name}`);

        // Mapear calendar_type -> calendar_code, date -> day, is_working_day -> holiday (invertido)
        updatedCode = updatedCode
          .replace(/calendar_type/g, 'calendar_code')
          .replace(/date/g, 'day')
          .replace(/is_working_day/g, 'holiday')
          .replace(/true/g, 'false') // Invertir holiday
          .replace(/false/g, 'true'); // Invertir holiday

        // Añadir campo hours_working si no existe
        if (!updatedCode.includes('hours_working')) {
          updatedCode = updatedCode.replace(
            /company_name: companyName/g,
            'company_name: companyName, hours_working: 8'
          );
        }

        // Añadir campo allocation_period si no existe
        if (!updatedCode.includes('allocation_period')) {
          updatedCode = updatedCode.replace(
            /calendar_code: calendarType/g,
            'calendar_code: calendarType, allocation_period: "2025-01"'
          );
        }
      }

      // Actualizar transformación para job_task
      if (node.name.includes('task') || updatedCode.includes('task_no')) {
        console.log(`Actualizando transformación: ${node.name}`);

        // Mapear task_no -> no
        updatedCode = updatedCode.replace(/task_no/g, 'no');
      }

      // Actualizar transformación para resource_cost
      if (node.name.includes('resource_cost') || updatedCode.includes('cost_center')) {
        console.log(`Actualizando transformación: ${node.name}`);

        // Mapear cost_center -> work_type, cost_per_hour -> unit_cost
        updatedCode = updatedCode
          .replace(/cost_center/g, 'work_type')
          .replace(/cost_per_hour/g, 'unit_cost');
      }

      if (updatedCode !== node.parameters.jsCode) {
        node.parameters.jsCode = updatedCode;
        console.log(`  - Transformación actualizada`);
      }
    }

    return node;
  });

  return { ...workflow, nodes: updatedNodes };
}

// Actualizar el workflow
const updatedWorkflow = updateDataTransformations(workflow);

// Guardar el workflow actualizado
fs.writeFileSync(
  'src/scripts/n8n/workflows/001_sincronizacion_completa_smart_final.json',
  JSON.stringify(updatedWorkflow, null, 2)
);

console.log('Workflow final actualizado guardado en: 001_sincronizacion_completa_smart_final.json');
