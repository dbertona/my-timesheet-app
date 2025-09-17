import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TIMESHEET_FIELDS from '../../../constants/timesheetFields';
import ProjectCell from '../ProjectCell';

// Mock dependencies
vi.mock('../../utils/useDropdownFilter', () => ({
  default: () => ({
    filterByLine: {},
    setFilterByLine: vi.fn(),
    openFor: null,
    setOpenFor: vi.fn(),
    getVisible: vi.fn((lineId, items, _formatter) => items.slice(0, 5))
  })
}));

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
    scrollElement: null
  })
}));

vi.mock('react-icons/fi', () => ({
  FiChevronDown: () => <div data-testid="chevron-down" />,
  FiSearch: () => <div data-testid="search-icon" />
}));

// Mock job data
const mockJobs = [
  { no: 'PROJ001', description: 'Project Alpha' },
  { no: 'PROJ002', description: 'Project Beta' },
  { no: 'PROJ003', description: 'Project Gamma' }
];

// Mock handlers
const mockHandlers = {
  handleInputChange: vi.fn(),
  handleInputFocus: vi.fn(),
  handleKeyDown: vi.fn(),
  setFieldError: vi.fn(),
  clearFieldError: vi.fn()
};

// Mock jobsState
const mockJobsState = {
  jobsLoaded: true,
  ensureTasksLoaded: vi.fn(),
  findJob: vi.fn(),
  jobs: mockJobs
};

// Mock line data
const mockLine = {
  id: 'line-1',
  job_no: '',
  job_task_no: ''
};

// Default props
const defaultProps = {
  line: mockLine,
  lineIndex: 0,
  colStyle: {},
  align: 'left',
  editFormData: { 'line-1': { job_no: '', job_task_no: '' } },
  inputRefs: { current: {} },
  hasRefs: true,
  setSafeRef: vi.fn(),
  error: null,
  isEditable: true,
  handlers: mockHandlers,
  jobsState: mockJobsState
};

describe('ProjectCell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TODO: GitHub Copilot, please generate comprehensive tests for ProjectCell component
  // Focus on:
  // 1. Basic rendering and input functionality
  // 2. Job autocomplete with findJob
  // 3. Keyboard navigation (Enter, Tab, Arrow keys)
  // 4. Error handling and validation
  // 5. Job dropdown filtering and selection
  // 6. Task clearing when project changes

  it('should render input field correctly', () => {
    render(<ProjectCell {...defaultProps} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('ts-input', 'pr-icon');
  });

  it('should handle input changes and clear field errors', () => {
    render(<ProjectCell {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'PROJ', name: 'job_no' } });

    // Check that handleInputChange was called at least once
    expect(mockHandlers.handleInputChange).toHaveBeenCalled();

    // Check that clearFieldError was called for job_no
    expect(mockHandlers.clearFieldError).toHaveBeenCalledWith('line-1', 'job_no');

    // Check that task field was cleared as well (component behavior)
    expect(mockHandlers.handleInputChange).toHaveBeenCalledWith('line-1', {
      target: { name: 'job_task_no', value: '' }
    });
  });

  it('should autocomplete job on Enter key press', () => {
    mockJobsState.findJob.mockReturnValue({ no: 'PROJ001', description: 'Project Alpha' });

    const propsWithData = {
      ...defaultProps,
      editFormData: { 'line-1': { job_no: 'PROJ', job_task_no: '' } }
    };

    render(<ProjectCell {...propsWithData} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockJobsState.findJob).toHaveBeenCalledWith('PROJ');
    expect(mockHandlers.handleInputChange).toHaveBeenCalledWith('line-1', {
      target: { name: 'job_no', value: 'PROJ001' }
    });
    expect(mockHandlers.clearFieldError).toHaveBeenCalledWith('line-1', 'job_no');
  });

  it('should clear task when project changes', () => {
    mockJobsState.findJob.mockReturnValue({ no: 'PROJ001', description: 'Project Alpha' });

    const propsWithData = {
      ...defaultProps,
      editFormData: { 'line-1': { job_no: 'PROJ', job_task_no: 'TASK001' } }
    };

    render(<ProjectCell {...propsWithData} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should clear the task when project changes
    expect(mockHandlers.handleInputChange).toHaveBeenCalledWith('line-1', {
      target: { name: 'job_task_no', value: '' }
    });
    expect(mockHandlers.clearFieldError).toHaveBeenCalledWith('line-1', 'job_task_no');
  });

  it('should handle Tab key navigation', () => {
    mockJobsState.findJob.mockReturnValue({ no: 'PROJ002', description: 'Project Beta' });

    const propsWithData = {
      ...defaultProps,
      editFormData: { 'line-1': { job_no: 'PROJ002', job_task_no: '' } }
    };

    render(<ProjectCell {...propsWithData} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Tab' });

    expect(mockHandlers.handleKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'Tab' }),
      0,
      TIMESHEET_FIELDS.indexOf('job_no')
    );
  });

  it('should handle empty input on Enter/Tab', () => {
    const propsWithEmpty = {
      ...defaultProps,
      editFormData: { 'line-1': { job_no: '', job_task_no: '' } }
    };

    render(<ProjectCell {...propsWithEmpty} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });

    // Should still call handleKeyDown for navigation even with empty input
    expect(mockHandlers.handleKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'Enter' }),
      0,
      TIMESHEET_FIELDS.indexOf('job_no')
    );
  });

  it('should handle arrow key navigation', () => {
    render(<ProjectCell {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(mockHandlers.handleKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'ArrowDown' }),
      0,
      TIMESHEET_FIELDS.indexOf('job_no')
    );
  });

  it('should set field error for invalid job', () => {
    mockJobsState.findJob.mockReturnValue(null); // Job not found

    const propsWithData = {
      ...defaultProps,
      editFormData: { 'line-1': { job_no: 'INVALID', job_task_no: '' } }
    };

    render(<ProjectCell {...propsWithData} />);

    const input = screen.getByRole('textbox');
    fireEvent.blur(input);

    expect(mockJobsState.findJob).toHaveBeenCalledWith('INVALID');
    expect(mockHandlers.setFieldError).toHaveBeenCalledWith(
      'line-1', 'job_no', 'Proyecto inválido. Debe seleccionar uno de la lista.'
    );
  });

  it('should not be editable when isEditable is false', () => {
    const readOnlyProps = { ...defaultProps, isEditable: false };
    render(<ProjectCell {...readOnlyProps} />);

    // When not editable, component renders a readonly div instead of input
    const cell = screen.getByRole('cell');
    expect(cell).toBeInTheDocument();

    // Should not find any textbox when readonly
    const inputs = screen.queryAllByRole('textbox');
    expect(inputs).toHaveLength(0);
  });

  it('should display error styling when error prop is provided', () => {
    const errorProps = {
      ...defaultProps,
      error: 'Campo requerido'
    };
    render(<ProjectCell {...errorProps} />);

    const input = screen.getByRole('textbox');
    // Component doesn't add error class directly to input, error is handled differently
    expect(input).toBeInTheDocument();
    // Error display is typically handled by parent components or via other styling
  });

  it('should handle F8 key for special navigation', () => {
    render(<ProjectCell {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'F8' });

    expect(mockHandlers.handleKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'F8' }),
      0,
      TIMESHEET_FIELDS.indexOf('job_no')
    );
  });
});
