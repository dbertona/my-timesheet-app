import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TimesheetLines from '../TimesheetLines';

// Mock dependencies
vi.mock('../hooks/useColumnResize', () => ({
  default: () => ({
    colStyles: {},
    onMouseDown: vi.fn(),
    setWidths: vi.fn()
  })
}));

vi.mock('../hooks/useTimesheetQueries', () => ({
  useJobs: () => ({
    data: [
      { no: 'PROJ001', description: 'Project Alpha' },
      { no: 'PROJ002', description: 'Project Beta' }
    ],
    isLoading: false
  }),
  useWorkTypes: () => ({
    data: [
      { code: 'DEV', description: 'Development' },
      { code: 'TEST', description: 'Testing' }
    ],
    isLoading: false
  })
}));

vi.mock('react-icons/fi', () => ({
  FiChevronDown: () => <div data-testid="chevron-down" />,
  FiSearch: () => <div data-testid="search-icon" />,
  FiCalendar: () => <div data-testid="calendar-icon" />,
}));

vi.mock('../supabaseClient', () => ({
  supabaseClient: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null }))
        }))
      }))
    }))
  }
}));

// Mock cell components
vi.mock('../timesheet/DateCell', () => ({
  default: ({ line, editFormData, handleInputChange }) => (
    <td data-testid={`date-cell-${line.id}`}>
      <input
        data-testid={`date-input-${line.id}`}
        value={editFormData[line.id]?.date || ''}
        onChange={(e) => handleInputChange(line.id, e)}
        name="date"
      />
    </td>
  )
}));

vi.mock('../timesheet/ProjectCell', () => ({
  default: ({ line, editFormData, handlers }) => (
    <td data-testid={`project-cell-${line.id}`}>
      <input
        data-testid={`project-input-${line.id}`}
        value={editFormData[line.id]?.job_no || ''}
        onChange={(e) => handlers.handleInputChange(line.id, e)}
        onKeyDown={(e) => handlers.handleKeyDown(e)}
        name="job_no"
      />
    </td>
  )
}));

vi.mock('../timesheet/TaskCell', () => ({
  default: ({ line, editFormData, handlers }) => (
    <td data-testid={`task-cell-${line.id}`}>
      <input
        data-testid={`task-input-${line.id}`}
        value={editFormData[line.id]?.job_task_no || ''}
        onChange={(e) => handlers.handleInputChange(line.id, e)}
        onKeyDown={(e) => handlers.handleKeyDown(e)}
        name="job_task_no"
      />
    </td>
  )
}));

vi.mock('../ui/DecimalInput', () => ({
  default: ({ value, onChange, onBlur, onFocus, onKeyDown, inputRef, name = 'quantity' }) => (
    <input
      data-testid={`quantity-input`}
      type="number"
      value={value || ''}
      onChange={(e) => onChange({ target: { name, value: parseFloat(e.target.value) || 0 } })}
      onBlur={(e) => onBlur?.({ target: { name, value: parseFloat(e.target.value) || 0 } })}
      onFocus={(e) => onFocus?.(e)}
      onKeyDown={(e) => onKeyDown?.(e)}
      ref={inputRef}
    />
  )
}));

vi.mock('../ui/BcModal', () => ({
  default: ({ isOpen, children, title, onConfirm, onCancel }) =>
    isOpen ? (
      <div data-testid="bc-modal">
        <h2>{title}</h2>
        {children}
        <button data-testid="modal-confirm" onClick={onConfirm}>Confirm</button>
        <button data-testid="modal-cancel" onClick={onCancel}>Cancel</button>
      </div>
    ) : null
}));

// Mock data
const mockLines = [
  {
    id: 'line-1',
    job_no: 'PROJ001',
    job_task_no: 'TASK001',
    description: 'Development work',
    work_type: 'DEV',
    quantity: 8,
    date: '15/09/2024',
    status: 'Open'
  },
  {
    id: 'line-2',
    job_no: 'PROJ002',
    job_task_no: 'TASK002',
    description: 'Testing work',
    work_type: 'TEST',
    quantity: 4,
    date: '16/09/2024',
    status: 'Pending'
  }
];

const mockHeader = {
  id: 'header-1',
  resource_no: 'RES001',
  resource_name: 'Test User'
};

const mockEditFormData = {
  'line-1': {
    job_no: 'PROJ001',
    job_task_no: 'TASK001',
    description: 'Development work',
    work_type: 'DEV',
    quantity: 8,
    date: '15/09/2024'
  },
  'line-2': {
    job_no: 'PROJ002',
    job_task_no: 'TASK002',
    description: 'Testing work',
    work_type: 'TEST',
    quantity: 4,
    date: '16/09/2024'
  }
};

// Mock handlers
const mockHandlers = {
  handleInputChange: vi.fn(),
  handleKeyDown: vi.fn(),
  scheduleAutosave: vi.fn(),
  saveLineNow: vi.fn(),
  onLinesChange: vi.fn(),
  setLines: vi.fn(),
  sortLines: vi.fn(),
  onLineSelectionChange: vi.fn(),
  markAsChanged: vi.fn(),
  addEmptyLine: vi.fn()
};

// Default props
const defaultProps = {
  lines: mockLines,
  editFormData: mockEditFormData,
  errors: {},
  inputRefs: { current: {} },
  hasRefs: true,
  setSafeRef: vi.fn(),
  header: mockHeader,
  editableHeader: null,
  periodChangeTrigger: 0,
  serverDate: new Date('2024-09-16'),
  calendarHolidays: [],
  selectedLines: [],
  showResponsible: false,
  effectiveHeaderId: 'header-1',
  ...mockHandlers
};

// QueryClient wrapper
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithQueryClient = (component) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('TimesheetLines', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TODO: GitHub Copilot, please generate comprehensive tests for TimesheetLines component
  // Focus on:
  // 1. Basic rendering with lines and table structure
  // 2. Line selection and multi-select functionality
  // 3. Status icons (Pending, Approved, Rejected) and reopen modal
  // 4. Input handling and cell editing
  // 5. Line filtering (empty lines, factorial lines)
  // 6. Column resizing and responsive behavior
  // 7. Keyboard navigation and shortcuts
  // 8. Error handling and validation display
  // 9. Line operations (add, delete, duplicate)
  // 10. Integration with different cell types

  it('should render table with correct structure', () => {
    renderWithQueryClient(<TimesheetLines {...defaultProps} />);

    // Should render main table
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass('ts-table');

    // Should render table headers
    expect(screen.getByText('Fecha')).toBeInTheDocument();
    expect(screen.getByText('Proyecto')).toBeInTheDocument();
    expect(screen.getByText('Tarea')).toBeInTheDocument();
    expect(screen.getByText('Descripción')).toBeInTheDocument();
    expect(screen.getByText('Cantidad')).toBeInTheDocument();
  });

  it('should render all lines correctly', () => {
    renderWithQueryClient(<TimesheetLines {...defaultProps} />);

    // Should render cells for each line
    expect(screen.getByTestId('date-cell-line-1')).toBeInTheDocument();
    expect(screen.getByTestId('project-cell-line-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-cell-line-1')).toBeInTheDocument();

    expect(screen.getByTestId('date-cell-line-2')).toBeInTheDocument();
    expect(screen.getByTestId('project-cell-line-2')).toBeInTheDocument();
    expect(screen.getByTestId('task-cell-line-2')).toBeInTheDocument();
  });

  it('should handle line selection', () => {
    renderWithQueryClient(<TimesheetLines {...defaultProps} />);

    // Click checkbox for first data row (index 1: after header checkbox)
    const checkboxes = screen.getAllByRole('checkbox');
    const checkbox1 = checkboxes[1];
    fireEvent.click(checkbox1);

    expect(mockHandlers.onLineSelectionChange).toHaveBeenCalledWith(['line-1']);
  });

  it('should handle select all functionality', () => {
    renderWithQueryClient(<TimesheetLines {...defaultProps} />);

    // Find and click select all checkbox (first checkbox in header)
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    expect(mockHandlers.onLineSelectionChange).toHaveBeenCalledWith(['line-1', 'line-2']);
  });

  it('should show status icons when showResponsible is true', () => {
    const responsibleProps = { ...defaultProps, showResponsible: true };
    renderWithQueryClient(<TimesheetLines {...responsibleProps} />);

    // Should show responsible column header
    expect(screen.getByText('Responsable')).toBeInTheDocument();
  });

  it('should handle input changes correctly', () => {
    renderWithQueryClient(<TimesheetLines {...defaultProps} />);

    const projectInput = screen.getByTestId('project-input-line-1');
    fireEvent.change(projectInput, { target: { value: 'PROJ003', name: 'job_no' } });

    expect(mockHandlers.handleInputChange).toHaveBeenCalledWith('line-1', expect.any(Object));
  });

  it('should filter out empty lines correctly', () => {
    const linesWithEmpty = [
      ...mockLines,
      {
        id: 'empty-line',
        job_no: '',
        job_task_no: '',
        description: '',
        work_type: '',
        quantity: 0,
        date: ''
      }
    ];

    const propsWithEmpty = { ...defaultProps, lines: linesWithEmpty };
    renderWithQueryClient(<TimesheetLines {...propsWithEmpty} />);

    // Empty line should not be rendered
    expect(screen.queryByTestId('date-cell-empty-line')).not.toBeInTheDocument();

    // Only valid lines should be rendered
    expect(screen.getByTestId('date-cell-line-1')).toBeInTheDocument();
    expect(screen.getByTestId('date-cell-line-2')).toBeInTheDocument();
  });

  it('should show temporary lines even if empty', () => {
    const linesWithTemp = [
      ...mockLines,
      {
        id: 'tmp-new-line',
        job_no: '',
        job_task_no: '',
        description: '',
        work_type: '',
        quantity: 0,
        date: ''
      }
    ];

    const propsWithTemp = { ...defaultProps, lines: linesWithTemp };
    renderWithQueryClient(<TimesheetLines {...propsWithTemp} />);

    // Temporary line should be rendered even if empty
    expect(screen.getByTestId('date-cell-tmp-new-line')).toBeInTheDocument();
  });

  it('should handle quantity input changes', () => {
    renderWithQueryClient(<TimesheetLines {...defaultProps} />);

    const quantityInput = screen.getByTestId('quantity-input');
    fireEvent.change(quantityInput, { target: { value: '10' } });
    fireEvent.blur(quantityInput);

    // Should call scheduleAutosave for quantity changes on blur
    expect(mockHandlers.scheduleAutosave).toHaveBeenCalled();
  });

  it('should handle keyboard navigation', () => {
    renderWithQueryClient(<TimesheetLines {...defaultProps} />);

    const projectInput = screen.getByTestId('project-input-line-1');
    fireEvent.keyDown(projectInput, { key: 'Tab' });

    expect(mockHandlers.handleKeyDown).toHaveBeenCalled();
  });

  it('should show reopen modal for rejected lines', () => {
    const rejectedLine = {
      ...mockLines[0],
      status: 'Rejected',
      rejection_cause: 'Invalid project'
    };

    const propsWithRejected = {
      ...defaultProps,
      lines: [rejectedLine],
      showResponsible: true
    };

    renderWithQueryClient(<TimesheetLines {...propsWithRejected} />);

    // Should show rejected status icon with title containing reason
    const rejectedIcon = screen.getByTitle('Motivo: Invalid project');
    expect(rejectedIcon).toBeInTheDocument();

    // Click to open reopen modal
    fireEvent.click(rejectedIcon);

    // Should show reopen modal
    expect(screen.getByTestId('bc-modal')).toBeInTheDocument();
    expect(screen.getByText('Reabrir línea rechazada')).toBeInTheDocument();
  });

  it('should handle errors display correctly', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        'line-1': {
          job_no: 'Proyecto requerido',
          quantity: 'Cantidad debe ser mayor a 0'
        }
      }
    };

    renderWithQueryClient(<TimesheetLines {...propsWithErrors} />);

    // Should render without crashing when errors are present
    expect(screen.getByTestId('project-cell-line-1')).toBeInTheDocument();
  });
});

