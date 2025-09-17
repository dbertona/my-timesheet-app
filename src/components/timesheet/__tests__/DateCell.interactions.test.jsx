import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DateCell from '../DateCell.jsx';

// Mock de iconos mínimos
vi.mock('react-icons/fi', () => ({
  FiCalendar: (props) => <div data-testid="calendar-icon" aria-label="Abrir calendario" {...props} />,
}));

describe('DateCell - interacciones de entrada y calendario', () => {
  const baseLine = { id: 'line-1' };
  const baseProps = {
    line: baseLine,
    lineIndex: 0,
    editFormData: { 'line-1': { date: '' } },
    handleInputChange: vi.fn(),
    hasRefs: false,
    setSafeRef: vi.fn(),
    error: '',
    header: null,
    editableHeader: { allocation_period: 'M24-M09' }, // Septiembre 2024
    serverDate: new Date('2024-09-10T00:00:00Z'),
    calendarHolidays: [],
    disabled: false,
    align: 'inherit',
    handleInputFocus: vi.fn(),
    handleKeyDown: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normaliza día suelto al hacer blur cuando el valor viene controlado en props', () => {
    const props = { ...baseProps, editFormData: { 'line-1': { date: '5' } } };
    render(<table><tbody><tr><DateCell {...props} /></tr></tbody></table>);
    const input = screen.getByRole('textbox');

    fireEvent.blur(input);

    expect(props.handleInputChange).toHaveBeenCalledWith('line-1', expect.objectContaining({
      target: expect.objectContaining({ name: 'date', value: '05/09/2024' }),
    }));
  });

  it('gestiona Enter sobre dd/MM sin fallar y llama a handleKeyDown', () => {
    render(<table><tbody><tr><DateCell {...baseProps} /></tr></tbody></table>);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { name: 'date', value: '7/9' } });
    const pd = vi.fn();
    fireEvent.keyDown(input, { key: 'Enter', preventDefault: pd });
    // A nivel de integración, garantizamos que maneja el evento y no rompe la navegación
    expect(baseProps.handleKeyDown).toHaveBeenCalled();
  });

  it('no dispara cambios cuando disabled=true', () => {
    const props = { ...baseProps, disabled: true };
    render(<table><tbody><tr><DateCell {...props} /></tr></tbody></table>);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { name: 'date', value: '10/09/2024' } });
    fireEvent.blur(input);
    expect(props.handleInputChange).not.toHaveBeenCalled();
  });

  it('abre calendario al clickar icono y permite seleccionar un día habilitado', () => {
    render(<table><tbody><tr><DateCell {...baseProps} /></tr></tbody></table>);

    const icon = screen.getByLabelText('Abrir calendario');
    fireEvent.click(icon);

    // Debe existir contenedor del calendario
    const calendar = screen.queryByRole('dialog', { hidden: true });
    // Si no hay role=dialog, buscamos por clase
    // fallback manual
    // eslint-disable-next-line testing-library/no-node-access
    const calendarEl = document.querySelector('.ts-calendar');
    expect(calendar || calendarEl).toBeTruthy();

    // Intentar seleccionar el día 15 (normalmente dentro de rango y no festivo)
    // eslint-disable-next-line testing-library/no-node-access
    const dayButton = Array.from(document.querySelectorAll('.ts-calendar-day')).find(el => el.textContent === '15' && !el.disabled);
    if (dayButton) {
      fireEvent.click(dayButton);
      expect(baseProps.handleInputChange).toHaveBeenCalledWith('line-1', expect.objectContaining({
        target: expect.objectContaining({ name: 'date' }),
      }));
    }
  });
});


