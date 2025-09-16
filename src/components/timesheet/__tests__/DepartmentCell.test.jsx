import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DepartmentCell from '../DepartmentCell';

describe('DepartmentCell', () => {
  const defaultProps = {
    line: { id: '1', department_code: 'IT' },
    colStyle: { width: '100px' },
    align: 'left',
    editFormData: null,
  };

  it('renders department code when available', () => {
    render(<DepartmentCell {...defaultProps} />);
    expect(screen.getByText('IT')).toBeInTheDocument();
  });

  it('renders placeholder when no department code', () => {
    const props = {
      ...defaultProps,
      line: { id: '1', department_code: null },
    };
    render(<DepartmentCell {...props} />);
    expect(screen.getByText('Sin departamento')).toBeInTheDocument();
  });

  it('renders placeholder when department code is empty string', () => {
    const props = {
      ...defaultProps,
      line: { id: '1', department_code: '' },
    };
    render(<DepartmentCell {...props} />);
    expect(screen.getByText('Sin departamento')).toBeInTheDocument();
  });

  it('uses editFormData when available', () => {
    const props = {
      ...defaultProps,
      editFormData: { '1': { department_code: 'HR' } },
    };
    render(<DepartmentCell {...props} />);
    expect(screen.getByText('HR')).toBeInTheDocument();
  });

  it('falls back to line data when editFormData is not available for line', () => {
    const props = {
      ...defaultProps,
      editFormData: { '2': { department_code: 'HR' } }, // Different line ID
    };
    render(<DepartmentCell {...props} />);
    expect(screen.getByText('IT')).toBeInTheDocument();
  });

  it('applies colStyle and align props', () => {
    const props = {
      ...defaultProps,
      colStyle: { width: '150px', backgroundColor: 'red' },
      align: 'center',
    };
    const { container } = render(<DepartmentCell {...props} />);
    const td = container.querySelector('td');
    // Check individual styles - backgroundColor is overridden by component's hardcoded style
    expect(td.style.width).toBe('150px');
    expect(td.style.textAlign).toBe('center');
    // Component has hardcoded backgroundColor: "#ffffff"
    expect(td.style.backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('has correct data attributes', () => {
    const { container } = render(<DepartmentCell {...defaultProps} />);
    const td = container.querySelector('td');
    expect(td).toHaveAttribute('data-col', 'department_code');
  });

  it('has correct CSS classes', () => {
    const { container } = render(<DepartmentCell {...defaultProps} />);
    const td = container.querySelector('td');
    const div = container.querySelector('.ts-cell-content');
    expect(td).toHaveClass('ts-td');
    expect(div).toHaveClass('ts-cell-content');
  });

  it('applies correct styling to placeholder text', () => {
    const props = {
      ...defaultProps,
      line: { id: '1', department_code: null },
    };
    const { container } = render(<DepartmentCell {...props} />);
    const placeholder = container.querySelector('span');
    expect(placeholder).toHaveStyle({
      fontStyle: 'italic',
      color: '#adb5bd',
    });
  });

  it('has correct cell content styling', () => {
    const { container } = render(<DepartmentCell {...defaultProps} />);
    const div = container.querySelector('.ts-cell-content');
    expect(div).toHaveStyle({
      padding: '0px 1px',
      fontSize: '10px',
      fontWeight: '500',
    });
  });
});
