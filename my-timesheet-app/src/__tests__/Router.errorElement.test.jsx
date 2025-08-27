import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import AppError from '../components/ui/AppError';

function Boom() { throw new Error('Boom'); }

it('router muestra AppError cuando una ruta lanza error', () => {
  const routes = [
    { path: '/', element: <Boom />, errorElement: <AppError /> },
  ];
  const router = createMemoryRouter(routes, { initialEntries: ['/'] });
  render(<RouterProvider router={router} />);
  expect(screen.getByText(/Se produjo un error/i)).toBeInTheDocument();
});
