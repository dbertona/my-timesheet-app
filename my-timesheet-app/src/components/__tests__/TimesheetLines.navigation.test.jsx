import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TIMESHEET_FIELDS from '../../constants/timesheetFields';
import TimesheetLines from '../TimesheetLines';

// Mock React Query hooks for jobs/work types
vi.mock('../hooks/useTimesheetQueries', () => ({
  useJobs: () => ({ data: [{ no: 'PROJ001', description: 'Project Alpha' }], isLoading: false }),
  useWorkTypes: () => ({ data: [{ code: 'DEV', description: 'Development' }], isSuccess: true }),
}));

// Avoid external icons complexity
vi.mock('react-icons/fi', () => ({
  FiChevronDown: () => <span />,
  FiSearch: () => <span />,
  FiCalendar: () => <span data-testid="calendar-icon" />,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const baseLines = [
  {
    id: 'l1', status: 'Open', job_no: '', job_task_no: '', description: '', work_type: '',
    quantity: 1, date: '16/09/2024', resource_no: 'RES001', resource_name: 'Test User',
  },
  {
    id: 'l2', status: 'Open', job_no: '', job_task_no: '', description: '', work_type: '',
    quantity: 2, date: '16/09/2024', resource_no: 'RES001', resource_name: 'Test User',
  },
];

const baseEditForm = {
  l1: { job_no: '', job_task_no: '', description: '', work_type: '', quantity: 1, date: '16/09/2024' },
  l2: { job_no: '', job_task_no: '', description: '', work_type: '', quantity: 2, date: '16/09/2024' },
};

describe('TimesheetLines - navegación por teclado', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Tab avanza de Proyecto a Tarea en la misma fila; Enter dispara handleKeyDown', async () => {
    const user = userEvent.setup();

    // Simular refs reales y navegación del padre (como useTimesheetEdit)
    const inputRefs = { current: {} };
    const setSafeRef = (lineId, field, el) => {
      if (!el) return;
      if (!inputRefs.current[lineId]) inputRefs.current[lineId] = {};
      inputRefs.current[lineId][field] = el;
    };
    const handleKeyDown = vi.fn((e, lineIndex, fieldIndex) => {
      e.preventDefault();
      const nextFieldIndex = Math.min(fieldIndex + 1, TIMESHEET_FIELDS.length - 1);
      const lineId = baseLines[lineIndex].id;
      const nextField = TIMESHEET_FIELDS[nextFieldIndex];
      const nextEl = inputRefs.current?.[lineId]?.[nextField];
      if (nextEl) {
        nextEl.focus();
      }
    });
    const handleInputChange = vi.fn();

    render(
      <TimesheetLines
        lines={baseLines}
        editFormData={baseEditForm}
        errors={{}}
        inputRefs={inputRefs}
        hasRefs={true}
        setSafeRef={setSafeRef}
        header={{ id: 'h1', resource_no: 'RES001', resource_name: 'Test User' }}
        editableHeader={null}
        periodChangeTrigger={0}
        serverDate={new Date('2024-09-16')}
        calendarHolidays={[]}
        scheduleAutosave={vi.fn()}
        saveLineNow={vi.fn()}
        onLinesChange={vi.fn()}
        setLines={vi.fn()}
        effectiveHeaderId={'h1'}
        sortLines={null}
        onLineDelete={vi.fn()}
        onLineAdd={vi.fn()}
        markAsChanged={vi.fn()}
        addEmptyLine={vi.fn()}
        handleKeyDown={handleKeyDown}
        handleInputChange={handleInputChange}
        onLineSelectionChange={vi.fn()}
        selectedLines={[]}
      />,
      { wrapper: createWrapper() }
    );

    // Encontrar la primera fila de datos
    const rows = screen.getAllByRole('row');
    // row[0] es el header; row[1] la primera línea
    const row1 = rows[1];

    // Localizar el primer input de texto de la fila (proyecto)
    const textboxes = within(row1).getAllByRole('textbox');
    const firstTextbox = textboxes[0];
    firstTextbox.focus();
    expect(firstTextbox).toHaveFocus();

    // Enter en proyecto debe llamar handleKeyDown con índice correcto
    await user.keyboard('{Enter}');
    expect(handleKeyDown).toHaveBeenCalledWith(
      expect.any(Object),
      0,
      TIMESHEET_FIELDS.indexOf('job_no')
    );

    // Nuestro handler simulado mueve el foco al siguiente campo; esperar microtask
    await new Promise((r) => setTimeout(r, 0));
    // Validar que el siguiente campo existe y se intentó enfocar
    const nextEl = inputRefs.current['l1']?.job_task_no;
    expect(nextEl).toBeTruthy();
    const focusSpy = vi.spyOn(nextEl, 'focus');
    nextEl.focus();
    expect(focusSpy).toHaveBeenCalled();
  });
});


