import { render, screen } from '@testing-library/react';
import AppError from '../components/ui/AppError';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useRouteError: () => new Error('Boom'),
    useNavigate: () => () => {},
  };
});

it('muestra UI de error con acciones', () => {
  render(<AppError />);
  expect(screen.getByText(/Se produjo un error/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
});
