import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomeDashboard from '../HomeDashboard';

// Mock de MSAL
vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    instance: {
      getActiveAccount: vi.fn(() => ({
        username: 'test@example.com',
        name: 'Test User'
      })),
      acquireTokenSilent: vi.fn(() => Promise.resolve({ accessToken: 'mock-token' })),
    },
    accounts: [{ username: 'test@example.com', name: 'Test User' }],
  }),
}));

// Mock de Supabase
vi.mock('../supabaseClient', () => ({
  supabaseClient: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { code: 'RES001', name: 'Test Resource', calendar_type: 'STANDARD' },
            error: null
          })),
          maybeSingle: vi.fn(() => Promise.resolve({
            data: { code: 'RES001', name: 'Test Resource', calendar_type: 'STANDARD' },
            error: null
          })),
        })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({
      data: [{ pendientes: 8.5 }],
      error: null
    })),
  },
}));

// Mock de APIs de fecha
vi.mock('../api/date', () => ({
  getServerDate: vi.fn(() => Promise.resolve(new Date('2024-09-10T00:00:00Z'))),
  generateAllocationPeriod: vi.fn(() => 'M24-M09'),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('HomeDashboard - smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza sin crashes y muestra elementos principales', async () => {
    render(<HomeDashboard />, { wrapper: createWrapper() });

    // Verificar elementos principales del dashboard
    expect(screen.getByText(/Buenos días|Buenas tardes|Buenas noches/)).toBeInTheDocument();
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
    expect(screen.getByText('Pendientes de imputar este mes')).toBeInTheDocument();
    expect(screen.getByText('Horas pendientes de aprobar')).toBeInTheDocument();
    expect(screen.getByText('Horas Rechazadas')).toBeInTheDocument();
  });

  it('muestra enlaces de navegación principales', () => {
    render(<HomeDashboard />, { wrapper: createWrapper() });

    expect(screen.getByText('Nuevo Parte de Horas')).toBeInTheDocument();
    expect(screen.getByText('Mis Partes de Horas')).toBeInTheDocument();
  });

  it('muestra información de versión y fecha', () => {
    render(<HomeDashboard />, { wrapper: createWrapper() });

    // Versión de la app
    expect(screen.getByText(/v\d+\.\d+\.\d+/)).toBeInTheDocument();

    // Durante la carga inicial, la fecha puede mostrar "Cargando..."
    expect(screen.getByText(/Cargando\.\.\.|lunes|martes|miércoles|jueves|viernes|sábado|domingo/)).toBeInTheDocument();
  });

  it('renderiza cards del dashboard con estructura correcta', () => {
    render(<HomeDashboard />, { wrapper: createWrapper() });

    // Verificar que existen las cards principales
    const cards = screen.getAllByRole('button');
    expect(cards.length).toBeGreaterThan(0);

    // Verificar que las cards tienen la estructura esperada
    expect(screen.getByText('Pendientes de imputar este mes')).toBeInTheDocument();
    expect(screen.getByText('Horas pendientes de aprobar')).toBeInTheDocument();
    expect(screen.getByText('Horas Rechazadas')).toBeInTheDocument();
  });

  it('maneja estados de carga sin crashes', () => {
    render(<HomeDashboard />, { wrapper: createWrapper() });

    // Durante la carga inicial, algunos elementos pueden mostrar "…" o estar en estado de carga
    // Verificar que no hay errores de renderizado
    expect(screen.getByText('Pendientes de imputar este mes')).toBeInTheDocument();
  });

  it('muestra menú de usuario cuando está disponible', () => {
    render(<HomeDashboard />, { wrapper: createWrapper() });

    // Verificar que existe el botón del menú de usuario (inicial con "T")
    const userButton = screen.getByRole('button', { name: 'T' });
    expect(userButton).toBeInTheDocument();
  });
});
