const fs = require('fs');

// Leer el workflow actual
const workflowPath = 'src/scripts/n8n/workflows/001_sincronizacion_completa_smart.json';
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Función para actualizar nodos HTTP que apuntan a Supabase
function updateSupabaseNodes(workflow) {
  const updatedNodes = workflow.nodes.map(node => {
    // Buscar nodos HTTP que apunten a Supabase
    if (node.type === 'n8n-nodes-base.httpRequest' &&
        node.parameters.url &&
        node.parameters.url.includes('supabase')) {

      // Actualizar URL para apuntar a local
      if (node.parameters.url.includes('supabase.co')) {
        node.parameters.url = node.parameters.url.replace(
          /https:\/\/[^\.]+\.supabase\.co\/rest\/v1\//g,
          'http://192.168.88.68:8000/rest/v1/'
        );
      }

      // Actualizar headers con SERVICE_ROLE_KEY local
      if (node.parameters.headers) {
        node.parameters.headers.forEach(header => {
          if (header.keyName === 'apikey' || header.keyName === 'Authorization') {
            header.keyValue = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UtZGVtbyIsImlhdCI6MTY0MTc2OTIwMCwiZXhwIjoxNzk5NTM1NjAwfQ.5z-pJI1qwZg1LE5yavGLqum65WOnnaaI5eZ3V00pLww';
          }
        });
      }

      // Mapear campos específicos según la tabla
      if (node.parameters.url.includes('calendar_period_days')) {
        // Mapear calendar_type -> calendar_code, date -> day, is_working_day -> holiday (invertido)
        console.log('Actualizando nodo calendar_period_days');
      }

      if (node.parameters.url.includes('job_task')) {
        // Mapear task_no -> no
        console.log('Actualizando nodo job_task');
      }

      if (node.parameters.url.includes('resource_cost')) {
        // Mapear cost_center -> work_type, cost_per_hour -> unit_cost
        console.log('Actualizando nodo job_task');
      }
    }

    return node;
  });

  return { ...workflow, nodes: updatedNodes };
}

// Actualizar el workflow
const updatedWorkflow = updateSupabaseNodes(workflow);

// Guardar el workflow actualizado
fs.writeFileSync(
  'src/scripts/n8n/workflows/001_sincronizacion_completa_smart_updated.json',
  JSON.stringify(updatedWorkflow, null, 2)
);

console.log('Workflow actualizado guardado en: 001_sincronizacion_completa_smart_updated.json');
