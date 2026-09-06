// src/tests/test-utils.tsx
// Test utilities for React component testing

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../services/contexts/AuthContext';

interface RenderWithProvidersOptions extends RenderOptions {
  route?: string;
}

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  { route = '/', ...options }: RenderWithProvidersOptions = {}
) => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AllTheProviders><Outlet /></AllTheProviders>,
        children: [
          { index: true, element: <div>Home</div> },
          { path: 'projects/:projectId/tasks', element: ui },
          { path: 'projects/:id', element: ui },
          { path: 'projects', element: ui },
          { path: 'teams/:id', element: ui },
          { path: 'teams', element: ui },
          { path: 'dashboard', element: ui },
          { path: 'notifications', element: ui },
          { path: 'login', element: ui },
          { path: 'register', element: ui },
          { path: '*', element: ui },
        ],
      },
    ],
    {
      initialEntries: [route],
    }
  );
  return render(<RouterProvider router={router} />, options);
};

// Re-export everything from react-testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };
