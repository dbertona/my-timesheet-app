import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DecimalInput from '../DecimalInput';

// Mock i18n constants
vi.mock('../../constants/i18n', () => ({
  PLACEHOLDERS: {
    QUANTITY: 'Cantidad'
  }
}));

describe('DecimalInput', () => {
  const mockOnChange = vi.fn();
  const mockOnBlur = vi.fn();
  const mockOnFocus = vi.fn();
  const mockOnKeyDown = vi.fn();

  const defaultProps = {
    name: 'quantity',
    value: '',
    onChange: mockOnChange,
    onBlur: mockOnBlur,
    onFocus: mockOnFocus,
    onKeyDown: mockOnKeyDown
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TODO: GitHub Copilot, please generate comprehensive tests for DecimalInput component
  // Focus on:
  // 1. Basic rendering with correct attributes
  // 2. Number validation and formatting
  // 3. Decimal precision handling 
  // 4. Comma/period decimal separator normalization
  // 5. Min value enforcement
  // 6. Invalid input rejection
  // 7. Blur event formatting
  // 8. Focus and keyboard events
  // 9. Disabled state
  // 10. Custom props and styling

  it('should render with correct default attributes', () => {
    render(<DecimalInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputMode', 'decimal');
    expect(input).toHaveAttribute('name', 'quantity');
    expect(input).toHaveAttribute('placeholder', 'Cantidad');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('step', '0.01');
    expect(input).toHaveAttribute('pattern', '[0-9]*[.,]?[0-9]{0,2}');
    expect(input).toHaveAttribute('autoComplete', 'off');
  });

  it('should display the provided value', () => {
    render(<DecimalInput {...defaultProps} value="10.50" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('10.50');
  });

  it('should handle valid decimal input', () => {
    render(<DecimalInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '12.34' } });
    
    expect(mockOnChange).toHaveBeenCalledWith({
      target: { name: 'quantity', value: '12.34' }
    });
  });

  it('should normalize comma to period', () => {
    render(<DecimalInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '12,34' } });
    
    expect(mockOnChange).toHaveBeenCalledWith({
      target: { name: 'quantity', value: '12.34' }
    });
  });

  it('should accept integers without decimal point', () => {
    render(<DecimalInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '42' } });
    
    expect(mockOnChange).toHaveBeenCalledWith({
      target: { name: 'quantity', value: '42' }
    });
  });

  it('should reject invalid characters', () => {
    render(<DecimalInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    
    // Should reject letters
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(mockOnChange).not.toHaveBeenCalled();
    
    // Should reject special characters
    fireEvent.change(input, { target: { value: '12$34' } });
    expect(mockOnChange).not.toHaveBeenCalled();
    
    // Should reject multiple decimal points
    fireEvent.change(input, { target: { value: '12.34.56' } });
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should enforce decimal precision', () => {
    render(<DecimalInput {...defaultProps} decimals={2} />);
    
    const input = screen.getByRole('textbox');
    
    // Should accept up to 2 decimals
    fireEvent.change(input, { target: { value: '12.34' } });
    expect(mockOnChange).toHaveBeenCalledWith({
      target: { name: 'quantity', value: '12.34' }
    });
    
    vi.clearAllMocks();
    
    // Should reject more than 2 decimals
    fireEvent.change(input, { target: { value: '12.345' } });
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should handle custom decimal precision', () => {
    render(<DecimalInput {...defaultProps} decimals={3} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('pattern', '[0-9]*[.,]?[0-9]{0,3}');
    
    fireEvent.change(input, { target: { value: '12.345' } });
    expect(mockOnChange).toHaveBeenCalledWith({
      target: { name: 'quantity', value: '12.345' }
    });
  });

  it('should format value on blur', () => {
    render(<DecimalInput {...defaultProps} min={0} decimals={2} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.blur(input, { target: { value: '12.3' } });
    
    expect(mockOnBlur).toHaveBeenCalledWith({
      target: { name: 'quantity', value: '12.30' }
    });
  });

  it('should enforce minimum value on blur', () => {
    render(<DecimalInput {...defaultProps} min={5} decimals={2} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.blur(input, { target: { value: '3' } });
    
    // Should enforce minimum value of 5
    expect(mockOnBlur).toHaveBeenCalledWith({
      target: { name: 'quantity', value: '5.00' }
    });
  });

  it('should handle empty value on blur', () => {
    render(<DecimalInput {...defaultProps} min={0} decimals={2} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.blur(input, { target: { value: '' } });
    
    expect(mockOnBlur).toHaveBeenCalledWith({
      target: { name: 'quantity', value: '0.00' }
    });
  });

  it('should handle negative values with minimum', () => {
    render(<DecimalInput {...defaultProps} min={0} decimals={2} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.blur(input, { target: { value: '-5' } });
    
    // Should enforce minimum of 0
    expect(mockOnBlur).toHaveBeenCalledWith({
      target: { name: 'quantity', value: '0.00' }
    });
  });

  it('should handle focus events', () => {
    render(<DecimalInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    
    expect(mockOnFocus).toHaveBeenCalled();
  });

  it('should handle keyboard events', () => {
    render(<DecimalInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOnKeyDown).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<DecimalInput {...defaultProps} disabled={true} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should accept custom className', () => {
    render(<DecimalInput {...defaultProps} className="custom-class" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('should accept custom placeholder', () => {
    render(<DecimalInput {...defaultProps} placeholder="Enter amount" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter amount');
  });

  it('should handle null/undefined value', () => {
    render(<DecimalInput {...defaultProps} value={null} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');
  });

  it('should accept additional props', () => {
    render(<DecimalInput {...defaultProps} data-testid="decimal-input" />);
    
    const input = screen.getByTestId('decimal-input');
    expect(input).toBeInTheDocument();
  });

  it('should handle ref forwarding', () => {
    const ref = { current: null };
    render(<DecimalInput {...defaultProps} inputRef={ref} />);
    
    expect(ref.current).not.toBeNull();
    expect(ref.current.tagName).toBe('INPUT');
  });

  it('should accept partial decimal input', () => {
    render(<DecimalInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    
    // Should accept just decimal point
    fireEvent.change(input, { target: { value: '12.' } });
    expect(mockOnChange).toHaveBeenCalledWith({
      target: { name: 'quantity', value: '12.' }
    });
    
    vi.clearAllMocks();
    
    // Should accept single decimal digit
    fireEvent.change(input, { target: { value: '12.5' } });
    expect(mockOnChange).toHaveBeenCalledWith({
      target: { name: 'quantity', value: '12.5' }
    });
  });
});
