import '@testing-library/jest-dom';

// Silencia warnings/errores conocidos que no afectan la validez de las pruebas
const originalWarn = console.warn;
const originalError = console.error;

const ignorePatterns = [
  /React Router Future Flag Warning/i,
  /was not wrapped in act\(\)/i,
  /The above error occurred in the <Boom>/i,
  /Error: Boom/i,
];

console.warn = (...args) => {
  const msg = args.join(' ');
  if (ignorePatterns.some((p) => p.test(msg))) return;
  originalWarn(...args);
};

console.error = (...args) => {
  const msg = args.join(' ');
  if (ignorePatterns.some((p) => p.test(msg))) return;
  originalError(...args);
};

// Evita que jsdom registre errores controlados de pruebas de rutas
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const message = String(event?.error?.message || event?.message || '');
    if (/Error: Boom/i.test(message)) {
      event.preventDefault();
    }
  });
}
