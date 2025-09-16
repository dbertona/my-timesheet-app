import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TimesheetLines from '../TimesheetLines';

// Mock icons mínimamente
vi.mock('react-icons/fi', () => ({
  FiChevronDown: () => <div data-testid="chevron-down" />,
  FiSearch: () => <div data-testid="search-icon" />,
  FiCalendar: () => <div data-testid="calendar-icon" />,
}));

// Dinámicamente controlaremos los hooks de React Query
const jobsState = { isLoading: true, data: [] };
const workTypesState = { isLoading: true, isSuccess: false, data: [] };

vi.mock('../hooks/useTimesheetQueries', () => ({
  useJobs: () => ({ isLoading: jobsState.isLoading, data: jobsState.data }),
  useWorkTypes: () => ({ isLoading: workTypesState.isLoading, isSuccess: workTypesState.isSuccess, data: workTypesState.data }),
}));

// Supabase update con error controlado
vi.mock('../supabaseClient', () => ({
  supabaseClient: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Update failed' } })) }))
      }))
    }))
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const baseProps = {
  lines: [
    { id: 'l1', job_no: 'P1', job_task_no: 'T1', description: 'Desc', work_type: 'DEV', quantity: 1, date: '01/09/2024', status: 'Open' },
  ],
  editFormData: { l1: { job_no: 'P1', job_task_no: 'T1', description: 'Desc', work_type: 'DEV', quantity: 1, date: '01/09/2024' } },
  errors: {},
  inputRefs: { current: {} },
  hasRefs: true,
  setSafeRef: vi.fn(),
  header: { allocation_period: 'M24-M09', resource_no: 'RES001' },
  editableHeader: null,
  periodChangeTrigger: 0,
  serverDate: new Date('2024-09-01'),
  calendarHolidays: [],
  selectedLines: [],
  effectiveHeaderId: 'header-1',
  scheduleAutosave: vi.fn(),
  saveLineNow: vi.fn(),
  onLinesChange: vi.fn(),
  setLines: vi.fn((fn) => fn(baseProps.lines)),
  sortLines: undefined,
  onLineSelectionChange: vi.fn(),
  handleKeyDown: vi.fn(),
};

describe('TimesheetLines integration - React Query loading/error and Supabase errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // reset states
    jobsState.isLoading = true; jobsState.data = [];
    workTypesState.isLoading = true; workTypesState.isSuccess = false; workTypesState.data = [];
  });

  it('renders while jobs/workTypes are loading (no crashes)', () => {
    render(<TimesheetLines {...baseProps} />, { wrapper: createWrapper() });
    // Solo valida que la tabla exista y no explote aun sin datos cargados
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders with data after loading completes', async () => {
    render(<TimesheetLines {...baseProps} />, { wrapper: createWrapper() });

    // Simular fin de carga
    jobsState.isLoading = false; jobsState.data = [{ no: 'P1', description: 'Project 1' }];
    workTypesState.isLoading = false; workTypesState.isSuccess = true; workTypesState.data = ['DEV', 'TEST'];

    // Esperar a que aparezca encabezado de proyecto (Nº proyecto)
    await waitFor(() => {
      expect(screen.getByText('Nº proyecto')).toBeInTheDocument();
    });

    // Campo de work_type editable visible
    expect(screen.getByDisplayValue('DEV')).toBeInTheDocument();
  });

  it('handles Supabase error on reopen rejected line gracefully', async () => {
    const rejected = [{ ...baseProps.lines[0], status: 'Rejected', rejection_cause: 'Invalid project' }];
    render(
      <TimesheetLines {...baseProps} lines={rejected} showResponsible={true} />,
      { wrapper: createWrapper() }
    );

    // Abre modal de reabrir
    const icon = await screen.findByTitle('Motivo: Invalid project');
    fireEvent.click(icon);

    // Aparece modal
    expect(screen.getByText('Reabrir línea rechazada')).toBeInTheDocument();

    // Confirmar reabrir (provoca error del mock de Supabase)
    const confirmButton = screen.getByText('Reabrir');
    fireEvent.click(confirmButton);

    // No esperamos crash; modal se cierra finalmente
    await waitFor(() => {
      expect(screen.queryByText('Reabrir línea rechazada')).not.toBeInTheDocument();
    });
  });
});
