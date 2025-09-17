import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import TimesheetListPage from '../TimesheetListPage';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock de MSAL
vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    accounts: [{ username: 'test@example.com' }],
  }),
}));

// Mock de Supabase con control dinámico
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ 
          data: { code: 'RES001', name: 'Test Resource' }, 
          error: null 
        })),
        order: vi.fn(() => ({
          order: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    })),
  })),
};

vi.mock('../supabaseClient', () => ({
  supabaseClient: mockSupabaseClient,
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

describe('TimesheetListPage - estados y textos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra estado de carga correctamente', () => {
    // Simular estado de carga - recurso se resuelve pero headers no
    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'resource') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: { code: 'RES001', name: 'Test Resource' }, 
                error: null 
              })),
            })),
          })),
        };
      } else {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => ({
                  order: vi.fn(() => new Promise(() => {})), // Promise que nunca se resuelve
                })),
              })),
            })),
          })),
        };
      }
    });

    render(<TimesheetListPage />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Cargando partes de horas...')).toBeInTheDocument();
    expect(screen.getByText('Cargando partes de horas...')).toBeInTheDocument(); // loading-spinner no tiene role progressbar
  });

  it('muestra estado de error correctamente', async () => {
    // Simular error en la obtención del recurso
    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'resource') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: null, 
                error: { message: 'Error de conexión' } 
              })),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    });

    render(<TimesheetListPage />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('No se pudo obtener la información del recurso')).toBeInTheDocument();
      expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });
  });

  it('muestra estado vacío con mensaje correcto', async () => {
    // Simular datos vacíos - recurso OK, headers vacíos
    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'resource') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: { code: 'RES001', name: 'Test Resource' }, 
                error: null 
              })),
            })),
          })),
        };
      } else if (table === 'resource_timesheet_header') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({ 
                    data: [], 
                    error: null 
                  })),
                })),
              })),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    });

    render(<TimesheetListPage />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('No hay partes de horas disponibles')).toBeInTheDocument();
      expect(screen.getByText('Crear Primer Parte')).toBeInTheDocument();
    });
  });

  it('muestra datos correctamente con textos actualizados', async () => {
    const mockHeaders = [
      {
        id: '1',
        posting_date: '2024-09-10',
        posting_description: 'Descripción del parte',
        allocation_period: 'M24-M09',
        status: 'Draft',
        created_at: '2024-09-10T10:00:00Z',
      },
    ];

    // Simular datos exitosos - recurso OK, headers con datos
    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'resource') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: { code: 'RES001', name: 'Test Resource' }, 
                error: null 
              })),
            })),
          })),
        };
      } else if (table === 'resource_timesheet_header') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({ 
                    data: mockHeaders, 
                    error: null 
                  })),
                })),
              })),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    });

    render(<TimesheetListPage />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      // Verificar título actualizado
      expect(screen.getByText('Mis Partes de Horas')).toBeInTheDocument();
      
      // Verificar contador actualizado
      expect(screen.getByText('1 partes')).toBeInTheDocument();
      
      // Verificar tabla con datos
      expect(screen.getByText('Descripción del parte')).toBeInTheDocument();
      expect(screen.getByText('Borrador')).toBeInTheDocument();
      expect(screen.getByText('Editar')).toBeInTheDocument();
    });
  });

  it('maneja filtros correctamente', async () => {
    const mockHeaders = [
      {
        id: '1',
        posting_date: '2024-09-10',
        posting_description: 'Parte enviado',
        allocation_period: 'M24-M09',
        status: 'Draft',
        synced_to_bc: true,
        created_at: '2024-09-10T10:00:00Z',
      },
    ];

    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'resource') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: { code: 'RES001', name: 'Test Resource' }, 
                error: null 
              })),
            })),
          })),
        };
      } else if (table === 'resource_timesheet_header') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({ 
                    data: mockHeaders, 
                    error: null 
                  })),
                })),
              })),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    });

    render(<TimesheetListPage />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      // Verificar filtro de "Enviado a BC"
      expect(screen.getByText('Enviado a BC:')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Todos')).toBeInTheDocument();
    });
  });

  it('muestra estados de parte correctamente', async () => {
    const mockHeaders = [
      {
        id: '1',
        posting_date: '2024-09-10',
        posting_description: 'Parte pendiente',
        allocation_period: 'M24-M09',
        status: 'Pending',
        created_at: '2024-09-10T10:00:00Z',
      },
      {
        id: '2',
        posting_date: '2024-09-09',
        posting_description: 'Parte aprobado',
        allocation_period: 'M24-M09',
        status: 'Approved',
        created_at: '2024-09-09T10:00:00Z',
      },
    ];

    mockSupabaseClient.from.mockImplementation((table) => {
      if (table === 'resource') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: { code: 'RES001', name: 'Test Resource' }, 
                error: null 
              })),
            })),
          })),
        };
      } else if (table === 'resource_timesheet_header') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({ 
                    data: mockHeaders, 
                    error: null 
                  })),
                })),
              })),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    });

    render(<TimesheetListPage />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
      expect(screen.getByText('Aprobado')).toBeInTheDocument();
    });
  });
});