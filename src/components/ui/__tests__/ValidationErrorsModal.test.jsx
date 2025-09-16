import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ValidationErrorsModal from '../ValidationErrorsModal';

describe('ValidationErrorsModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    validation: {
      errors: {
        '1': {
          project_code: 'Project is required',
          hours: 'Hours must be greater than 0',
        },
        '2': {
          task_code: 'Task is required',
        },
      },
      totalErrors: 3,
      totalWarnings: 0,
      summary: 'Found 3 errors that need to be fixed.',
    },
    onGoToError: vi.fn(),
    onContinueAnyway: vi.fn(),
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ValidationErrorsModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders error modal when totalErrors > 0', () => {
    render(<ValidationErrorsModal {...defaultProps} />);
    expect(screen.getByText('❌ Errores de Validación')).toBeInTheDocument();
    expect(screen.getByText('Found 3 errors that need to be fixed.')).toBeInTheDocument();
  });

  it('renders warning modal when totalErrors = 0 and totalWarnings > 0', () => {
    const props = {
      ...defaultProps,
      validation: {
        ...defaultProps.validation,
        totalErrors: 0,
        totalWarnings: 2,
        summary: 'Found 2 warnings.',
      },
    };
    render(<ValidationErrorsModal {...props} />);
    expect(screen.getByText('⚠️ Advertencias de Validación')).toBeInTheDocument();
    expect(screen.getByText('Found 2 warnings.')).toBeInTheDocument();
  });

  it('displays error details for each line', () => {
    render(<ValidationErrorsModal {...defaultProps} />);
    expect(screen.getByText('📋 Detalles por línea:')).toBeInTheDocument();
    expect(screen.getByText('Línea 1')).toBeInTheDocument();
    expect(screen.getByText('Línea 2')).toBeInTheDocument();
    expect(screen.getByText('project_code:')).toBeInTheDocument();
    expect(screen.getByText('Project is required')).toBeInTheDocument();
    expect(screen.getByText('hours:')).toBeInTheDocument();
    expect(screen.getByText('Hours must be greater than 0')).toBeInTheDocument();
    expect(screen.getByText('task_code:')).toBeInTheDocument();
    expect(screen.getByText('Task is required')).toBeInTheDocument();
  });

  it('calls onGoToError when "Ir a línea" button is clicked', () => {
    render(<ValidationErrorsModal {...defaultProps} />);
    const goToButtons = screen.getAllByText('Ir a línea');
    fireEvent.click(goToButtons[0]);
    expect(defaultProps.onGoToError).toHaveBeenCalledWith('1');
  });

  it('shows "Continuar de todas formas" button only when canContinue is true', () => {
    const props = {
      ...defaultProps,
      validation: {
        ...defaultProps.validation,
        totalErrors: 0,
        totalWarnings: 2,
      },
    };
    render(<ValidationErrorsModal {...props} />);
    expect(screen.getByText('Continuar de todas formas')).toBeInTheDocument();
  });

  it('does not show "Continuar de todas formas" button when there are errors', () => {
    render(<ValidationErrorsModal {...defaultProps} />);
    expect(screen.queryByText('Continuar de todas formas')).not.toBeInTheDocument();
  });

  it('calls onContinueAnyway when "Continuar de todas formas" is clicked', () => {
    const props = {
      ...defaultProps,
      validation: {
        ...defaultProps.validation,
        totalErrors: 0,
        totalWarnings: 2,
      },
    };
    render(<ValidationErrorsModal {...props} />);
    fireEvent.click(screen.getByText('Continuar de todas formas'));
    expect(defaultProps.onContinueAnyway).toHaveBeenCalled();
  });

  it('shows "Corregir Errores" button when there are errors', () => {
    render(<ValidationErrorsModal {...defaultProps} />);
    expect(screen.getByText('Corregir Errores')).toBeInTheDocument();
  });

  it('shows "Entendido" button when there are only warnings', () => {
    const props = {
      ...defaultProps,
      validation: {
        ...defaultProps.validation,
        totalErrors: 0,
        totalWarnings: 2,
      },
    };
    render(<ValidationErrorsModal {...props} />);
    expect(screen.getByText('Entendido')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ValidationErrorsModal {...defaultProps} />);
    fireEvent.click(screen.getByText('×'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    const { container } = render(<ValidationErrorsModal {...defaultProps} />);
    const overlay = container.querySelector('.bc-modal-overlay');
    fireEvent.click(overlay);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not call onClose when modal content is clicked', () => {
    const { container } = render(<ValidationErrorsModal {...defaultProps} />);
    const modal = container.querySelector('.bc-modal');
    fireEvent.click(modal);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('handles empty errors object', () => {
    const props = {
      ...defaultProps,
      validation: {
        ...defaultProps.validation,
        errors: {},
      },
    };
    render(<ValidationErrorsModal {...props} />);
    expect(screen.queryByText('📋 Detalles por línea:')).not.toBeInTheDocument();
  });

  it('preserves whitespace in summary text', () => {
    const props = {
      ...defaultProps,
      validation: {
        ...defaultProps.validation,
        summary: 'Line 1\nLine 2\nLine 3',
      },
    };
    const { container } = render(<ValidationErrorsModal {...props} />);
    const summaryElement = container.querySelector('.summary-text');
    expect(summaryElement).toHaveStyle({ whiteSpace: 'pre-line' });
  });

  it('renders all required CSS classes', () => {
    const { container } = render(<ValidationErrorsModal {...defaultProps} />);
    expect(container.querySelector('.bc-modal-overlay')).toBeInTheDocument();
    expect(container.querySelector('.bc-modal')).toBeInTheDocument();
    expect(container.querySelector('.bc-modal-header')).toBeInTheDocument();
    expect(container.querySelector('.bc-modal-title')).toBeInTheDocument();
    expect(container.querySelector('.bc-modal-close')).toBeInTheDocument();
    expect(container.querySelector('.bc-modal-content')).toBeInTheDocument();
    expect(container.querySelector('.validation-summary')).toBeInTheDocument();
    expect(container.querySelector('.validation-details')).toBeInTheDocument();
    expect(container.querySelector('.errors-list')).toBeInTheDocument();
    expect(container.querySelector('.bc-modal-actions')).toBeInTheDocument();
  });
});
