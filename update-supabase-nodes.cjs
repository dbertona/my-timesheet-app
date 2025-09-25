const fs = require('fs');

// Leer el workflow actual
const workflowPath = 'src/scripts/n8n/workflows/001_sincronizacion_completa_smart.json';
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Claves JWT locales
const LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE2NDE3NjkyMDAsImV4cCI6MTc5OTUzNTYwMH0.F_rDxRTPE8OU83L_CNgEGXfmirMXmMMugT29Cvc8ygQ';
const LOCAL_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UtZGVtbyIsImlhdCI6MTY0MTc2OTIwMCwiZXhwIjoxNzk5NTM1NjAwfQ.5z-pJI1qwZg1LE5yavGLqum65WOnnaaI5eZ3V00pLww';

// Función para actualizar nodos Supabase
function updateSupabaseNodes(workflow) {
  const updatedNodes = workflow.nodes.map(node => {
    if (node.type === 'n8n-nodes-base.supabase') {
      console.log(`Actualizando nodo Supabase: ${node.name}`);

      // Actualizar URL para apuntar a local
      if (node.parameters.host) {
        node.parameters.host = 'http://192.168.88.68:8000';
      }

      // Actualizar claves JWT
      if (node.parameters.serviceRole) {
        node.parameters.serviceRole = LOCAL_SERVICE_KEY;
      }

      if (node.parameters.anonKey) {
        node.parameters.anonKey = LOCAL_ANON_KEY;
      }

      // Mapear campos específicos según la tabla
      if (node.name.includes('calendar')) {
        console.log('  - Mapeando campos para calendar_period_days');
        // Los campos se mapearán en las transformaciones de datos
      }

      if (node.name.includes('task')) {
        console.log('  - Mapeando campos para job_task');
        // Los campos se mapearán en las transformaciones de datos
      }

      if (node.name.includes('resource_cost')) {
        console.log('  - Mapeando campos para resource_cost');
        // Los campos se mapearán en las transformaciones de datos
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
  'src/scripts/n8n/workflows/001_sincronizacion_completa_smart_local.json',
  JSON.stringify(updatedWorkflow, null, 2)
);

console.log('Workflow actualizado guardado en: 001_sincronizacion_completa_smart_local.json');
