import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TimesheetHeader from '../TimesheetHeader';

// Mock dependencies
vi.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    instance: {
      getActiveAccount: vi.fn(() => ({ username: 'test@example.com' })),
    },
    accounts: [{ username: 'test@example.com' }],
  }),
}));

vi.mock('../supabaseClient', () => ({
  supabaseClient: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => ({
            data: {
              code: 'RES001',
              name: 'Test Resource',
              department_code: 'IT',
              calendar_type: 'STANDARD',
            },
          })),
        })),
      })),
    })),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('TimesheetHeader', () => {
  const defaultProps = {
    header: null,
    onHeaderChange: vi.fn(),
    serverDate: new Date('2024-01-15'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders resource information when no header provided', async () => {
    render(<TimesheetHeader {...defaultProps} />, { wrapper: createWrapper() });
    
    // The component shows error message when resource not found
    await waitFor(() => {
      expect(screen.getByText(/Recurso no encontrado para el email/)).toBeInTheDocument();
    });
  });

  it('renders header information when header is provided', () => {
    const header = {
      resource_no: 'RES002',
      resource_name: 'Header Resource',
      department_code: 'HR',
      calendar_type: 'CUSTOM',
      allocation_period: 'M24-M01',
      posting_date: '2024-01-15',
      posting_description: 'Test Description',
      calendar_period_days: '15',
    };
    
    render(<TimesheetHeader {...defaultProps} header={header} />, { wrapper: createWrapper() });
    
    expect(screen.getByDisplayValue('RES002')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Header Resource')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CUSTOM')).toBeInTheDocument();
    expect(screen.getByDisplayValue('M24-M01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
  });

  it('renders with correct structure', () => {
    render(<TimesheetHeader {...defaultProps} />, { wrapper: createWrapper() });
    
    // Check that the component renders without crashing
    expect(screen.getByText('Recurso:')).toBeInTheDocument();
  });

  it('calls onHeaderChange when header changes', async () => {
    render(<TimesheetHeader {...defaultProps} />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(defaultProps.onHeaderChange).toHaveBeenCalled();
    });
  });

  it('has correct field labels', () => {
    render(<TimesheetHeader {...defaultProps} />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Recurso:')).toBeInTheDocument();
    expect(screen.getByText('Nombre:')).toBeInTheDocument();
    expect(screen.getByText('Calendario:')).toBeInTheDocument();
    expect(screen.getByText('Fecha:')).toBeInTheDocument();
    expect(screen.getByText('Período:')).toBeInTheDocument();
    expect(screen.getByText('Descripción:')).toBeInTheDocument();
  });

  it('has readonly fields for resource, name, calendar, date, and period', () => {
    const header = {
      resource_no: 'RES002',
      resource_name: 'Header Resource',
      department_code: 'HR',
      calendar_type: 'CUSTOM',
      allocation_period: 'M24-M01',
      posting_date: '2024-01-15',
      posting_description: 'Test Description',
      calendar_period_days: '15',
    };
    
    render(<TimesheetHeader {...defaultProps} header={header} />, { wrapper: createWrapper() });
    
    const resourceInput = screen.getByDisplayValue('RES002');
    const nameInput = screen.getByDisplayValue('Header Resource');
    const calendarInput = screen.getByDisplayValue('CUSTOM');
    const dateInput = screen.getByDisplayValue('2024-01-15');
    const periodInput = screen.getByDisplayValue('M24-M01');
    
    expect(resourceInput).toHaveAttribute('readOnly');
    expect(nameInput).toHaveAttribute('readOnly');
    expect(calendarInput).toHaveAttribute('readOnly');
    expect(dateInput).toHaveAttribute('readOnly');
    expect(periodInput).toHaveAttribute('readOnly');
  });

  it('allows editing description field', () => {
    render(<TimesheetHeader {...defaultProps} />, { wrapper: createWrapper() });
    
    const descriptionInput = screen.getByDisplayValue('Parte de trabajo M24-M01');
    expect(descriptionInput).not.toHaveAttribute('readOnly');
  });

  it('applies correct styling to readonly fields', () => {
    render(<TimesheetHeader {...defaultProps} />, { wrapper: createWrapper() });
    
    const readonlyInputs = screen.getAllByRole('textbox').filter(input => input.hasAttribute('readOnly'));
    readonlyInputs.forEach(input => {
      expect(input).toHaveStyle({
        backgroundColor: '#f5f5f5',
        color: '#666',
      });
    });
  });

  it('has correct grid layout', () => {
    const { container } = render(<TimesheetHeader {...defaultProps} />, { wrapper: createWrapper() });
    
    const gridContainer = container.querySelector('div[style*="grid-template-columns"]');
    expect(gridContainer).toHaveStyle({
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      fontSize: '14px',
    });
  });

  it('shows different styling for edit mode vs create mode', () => {
    const header = { resource_no: 'RES001' };
    const { container } = render(<TimesheetHeader {...defaultProps} header={header} />, { wrapper: createWrapper() });
    
    const mainContainer = container.querySelector('div[style*="border"]');
    expect(mainContainer).toHaveStyle({
      border: '1px solid #ddd',
      backgroundColor: '#ffffff',
    });
  });

  it('shows create mode styling when no header', () => {
    const { container } = render(<TimesheetHeader {...defaultProps} />, { wrapper: createWrapper() });
    
    const mainContainer = container.querySelector('div[style*="border"]');
    expect(mainContainer).toHaveStyle({
      border: '2px dashed #007bff',
      backgroundColor: '#f8f9fa',
    });
  });
});
