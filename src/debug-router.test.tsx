import React from 'react';
import { describe, it, expect } from 'vitest';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

const TestComponent = () => <div data-testid="params">works</div>;

const AllTheProviders = ({ children }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('router debug', () => {
  it('works with nested routes with providers', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <AllTheProviders><Outlet /></AllTheProviders>,
        children: [
          { 
            path: 'projects/:projectId/tasks', 
            element: <TestComponent /> 
          },
        ],
      },
    ], { initialEntries: ['/projects/porojekt-avval/tasks'] });

    render(<RouterProvider router={router} />);
    console.log('DOM:', document.body.innerHTML);
    expect(screen.getByTestId('params').textContent).toBe('works');
  });
});
