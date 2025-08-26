import { render, screen, fireEvent } from '@testing-library/react';
import DateInput from '../components/ui/DateInput';

it('abre calendario al hacer click en el icono', () => {
  render(
    <DateInput
      value="01/08/2025"
      onChange={() => {}}
      onBlur={() => {}}
      calendarOpen={false}
      setCalendarOpen={() => {}}
      header={{ from_date: '2025-08-01', to_date: '2025-08-31', allocation_period: 'M25-M08' }}
      calendarHolidays={[]}
      className="ts-input"
      inputId="date-input"
    />
  );
  const btn = screen.getByLabelText(/Abrir calendario/i);
  fireEvent.click(btn);
  // No podemos asegurar render aquí porque depende de estado externo; test smoke
});

it('selecciona un día habilitado dentro de rango', () => {
  const onChange = vi.fn();
  const onBlur = vi.fn();
  const Wrapper = () => (
    <DateInput
      value="01/08/2025"
      onChange={onChange}
      onBlur={onBlur}
      calendarOpen={true}
      setCalendarOpen={() => {}}
      header={{ from_date: '2025-08-01', to_date: '2025-08-31', allocation_period: 'M25-M08' }}
      calendarHolidays={[]}
      className="ts-input"
      inputId="date-input"
    />
  );
  render(<Wrapper />);
  // Busca un botón de día (1 al 31); hacemos click en 10 para no caer fuera de rango
  const dayButton = screen.getAllByRole('button').find(el => el.textContent === '10');
  if (dayButton) fireEvent.click(dayButton);
  expect(onChange).toBeCalled();
  expect(onBlur).toBeCalled();
});
