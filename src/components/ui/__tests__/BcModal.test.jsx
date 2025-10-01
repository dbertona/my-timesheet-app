import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BcModal from '../BcModal';

describe('BcModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    title: 'Test Modal',
    children: <p>Modal content</p>,
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TODO: GitHub Copilot, please generate comprehensive tests for BcModal component
  // Focus on:
  // 1. Basic rendering and visibility
  // 2. Modal open/close behavior
  // 3. Confirm and cancel button functionality
  // 4. Different button types (primary, danger)
  // 5. Different sizes (small, medium, large)
  // 6. One button mode
  // 7. Show/hide actions
  // 8. Event propagation and click handling
  // 9. Accessibility features

  it('should not render when isOpen is false', () => {
    render(<BcModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<BcModal {...defaultProps} />);

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should render with correct default props', () => {
    render(<BcModal {...defaultProps} />);

    expect(screen.getByText('Sí')).toBeInTheDocument(); // Default confirmText
    expect(screen.getByText('No')).toBeInTheDocument(); // Default cancelText

    const confirmButton = screen.getByText('Sí');
    expect(confirmButton).toHaveClass('ts-btn--danger'); // Default confirmButtonType
  });

  it('should render with custom texts', () => {
    render(
      <BcModal
        {...defaultProps}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    );

    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('should handle confirm button click', () => {
    render(<BcModal {...defaultProps} />);

    const confirmButton = screen.getByText('Sí');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledOnce();
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('should handle cancel button click', () => {
    render(<BcModal {...defaultProps} />);

    const cancelButton = screen.getByText('No');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledOnce();
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('should handle overlay click to close', () => {
    render(<BcModal {...defaultProps} />);

    const overlay = document.querySelector('.ts-modal-overlay');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('should not close when clicking on modal content', () => {
    render(<BcModal {...defaultProps} />);

    const modal = document.querySelector('.ts-modal');
    fireEvent.click(modal);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should render without title when not provided', () => {
    render(<BcModal {...defaultProps} title={null} />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render with primary button type', () => {
    render(<BcModal {...defaultProps} confirmButtonType="primary" />);

    const confirmButton = screen.getByText('Sí');
    expect(confirmButton).toHaveClass('ts-btn--primary');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<BcModal {...defaultProps} size="small" />);
    expect(document.querySelector('.ts-modal')).toHaveClass('ts-modal--small');

    rerender(<BcModal {...defaultProps} size="large" />);
    expect(document.querySelector('.ts-modal')).toHaveClass('ts-modal--large');

    rerender(<BcModal {...defaultProps} size="medium" />);
    expect(document.querySelector('.ts-modal')).toHaveClass('ts-modal--medium');
  });

  it('should hide actions when showActions is false', () => {
    render(<BcModal {...defaultProps} showActions={false} />);

    expect(screen.queryByText('Sí')).not.toBeInTheDocument();
    expect(screen.queryByText('No')).not.toBeInTheDocument();
  });

  it('should render only one button when oneButton is true', () => {
    render(<BcModal {...defaultProps} oneButton={true} />);

    expect(screen.getByText('Sí')).toBeInTheDocument();
    expect(screen.queryByText('No')).not.toBeInTheDocument();
  });

  it('should handle confirm without onConfirm callback', () => {
    render(<BcModal {...defaultProps} onConfirm={null} />);

    const confirmButton = screen.getByText('Sí');
    fireEvent.click(confirmButton);

    // Should still close the modal
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('should handle cancel without onCancel callback', () => {
    render(<BcModal {...defaultProps} onCancel={null} />);

    const cancelButton = screen.getByText('No');
    fireEvent.click(cancelButton);

    // Should still close the modal
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('should render complex children correctly', () => {
    const complexChildren = (
      <div>
        <p>First paragraph</p>
        <input placeholder="Test input" />
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    );

    render(<BcModal {...defaultProps}>{complexChildren}</BcModal>);

    expect(screen.getByText('First paragraph')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('should apply correct CSS classes', () => {
    render(<BcModal {...defaultProps} />);

    expect(document.querySelector('.ts-modal-overlay')).toBeInTheDocument();
    expect(document.querySelector('.ts-modal')).toBeInTheDocument();
    expect(document.querySelector('.ts-modal-content')).toBeInTheDocument();
    expect(document.querySelector('.ts-modal-actions')).toBeInTheDocument();
  });
});

