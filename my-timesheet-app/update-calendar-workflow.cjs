const fs = require('fs');

// Leer el workflow actualizado
const workflow = JSON.parse(fs.readFileSync('src/scripts/n8n/workflows/001_sincronizacion_completa_smart_local.json', 'utf8'));

// Actualizar el nodo de transformación
const transformNode = workflow.nodes.find(n => n.name === 'Transformar CalendarPeriodDays');
if (transformNode) {
  transformNode.parameters.jsCode = `const input = $input.all();
if (input.length === 0) return [];

const companyName = $('Resolve Company').first().json.companyName;

const data = input[0].json;
const rows = Array.isArray(data.value) ? data.value : [];
const items = [];

for (const r of rows) {
  const allocation_period = String(r.allocation_period ?? r.allocationPeriod ?? '').trim();
  const calendar_code = String(r.calendar_code ?? r.calendarCode ?? '').trim();
  const dayRaw = r.day ?? r.Day ?? r.date ?? '';
  const dayStr = String(dayRaw).trim();

  if (!allocation_period) continue;
  if (!dayStr) continue;

  const holiday = Boolean(r.holiday ?? r.Holiday ?? false);
  const hours_working = Number(r.hours_working ?? r.hoursWorking ?? 0);

  const dayNum = Number(dayStr);
  const day = Number.isNaN(dayNum) ? dayStr : dayNum;

  items.push({
    json: {
      company_name: companyName,
      allocation_period,
      calendar_code,
      day,
      holiday,
      hours_working,
    },
  });
}

return items;`;
}

// Actualizar el nodo HTTP de upsert
const upsertNode = workflow.nodes.find(n => n.name === 'HTTP - Upsert calendar_period_days (Supabase REST)');
if (upsertNode) {
  upsertNode.parameters.url = 'http://192.168.88.68:8000/rest/v1/calendar_period_days?on_conflict=allocation_period,calendar_code,day,company_name';
}

console.log('Workflow actualizado para calendar_period_days');
console.log('Nodos modificados:');
console.log('- Transformar CalendarPeriodDays: campos corregidos');
console.log('- HTTP - Upsert calendar_period_days: on_conflict corregido');



