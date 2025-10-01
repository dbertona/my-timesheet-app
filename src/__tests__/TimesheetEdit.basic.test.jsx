import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TimesheetEdit from '../components/TimesheetEdit';

const chain = () => ({ select: () => chain(), eq: () => chain(), order: () => chain(), limit: () => chain(), single: () => ({}), maybeSingle: () => ({}) });
vi.mock('../supabaseClient', () => ({ supabaseClient: { from: () => chain() } }));
vi.mock('@azure/msal-react', () => ({ useMsal: () => ({ instance: { getActiveAccount: () => ({ username: 'u@x.com' }) } , accounts: [] }) }));

it('renderiza botón Guardar', async () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const routes = [{ path: '/', element: <TimesheetEdit /> }];
  const router = createMemoryRouter(routes, { initialEntries: ['/'] });
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
  const boton = await screen.findByRole('button', { name: /Guardar/i });
  expect(boton).toBeInTheDocument();
});
