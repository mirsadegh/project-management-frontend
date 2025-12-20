// src/tests/apiHandlers.ts
// API mock handlers for testing using MSW (Mock Service Worker)

import { setupWorker, rest } from 'msw';
import { mockUser, mockAuthTokens, mockRegisterData } from './mockData';

const API_BASE_URL = 'http://localhost:8000/api';

// Create mock API handlers
export const handlers = [
  // Auth endpoints
  rest.post(`${API_BASE_URL}/accounts/auth/login/`, (req, res, ctx) => {
    const { email } = req.body as { email: string };
    
    if (email === 'test@example.com') {
      return res(
        ctx.status(200),
        ctx.json(mockAuthTokens)
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({ detail: 'Invalid credentials' })
    );
  }),

  rest.post(`${API_BASE_URL}/accounts/auth/register/`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ message: 'User registered successfully' })
    );
  }),

  rest.post(`${API_BASE_URL}/accounts/auth/refresh/`, (req, res, ctx) => {
    const { refresh } = req.body as { refresh: string };
    
    if (refresh === 'mock-refresh-token') {
      return res(
        ctx.status(200),
        ctx.json({ access: 'new-mock-access-token' })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({ detail: 'Invalid refresh token' })
    );
  }),

  rest.get(`${API_BASE_URL}/accounts/profile/`, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer')) {
      return res(
        ctx.status(200),
        ctx.json(mockUser)
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({ detail: 'Authentication credentials were not provided.' })
    );
  }),

  // Add more API endpoints as needed for testing
  // Projects, tasks, teams, comments, files, etc.
];

// Set up the mock service worker
export const worker = setupWorker(...handlers);