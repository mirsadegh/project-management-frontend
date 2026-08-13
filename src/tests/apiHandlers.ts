// src/tests/apiHandlers.ts
// API mock handlers for testing using MSW (Mock Service Worker) v2

import { setupWorker } from 'msw/browser';
import { http, HttpResponse } from 'msw';
import { mockUser, mockAuthTokens } from './mockData';

const API_BASE_URL = 'http://localhost:8000/api';

// Create mock API handlers
export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/accounts/auth/login/`, async ({ request }) => {
    const { email } = (await request.json()) as { email: string };

    if (email === 'test@example.com') {
      return HttpResponse.json(mockAuthTokens, { status: 200 });
    }

    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
  }),

  http.post(`${API_BASE_URL}/accounts/auth/register/`, async () => {
    return HttpResponse.json({ message: 'User registered successfully' }, { status: 201 });
  }),

  http.post(`${API_BASE_URL}/accounts/auth/refresh/`, async ({ request }) => {
    const { refresh } = (await request.json()) as { refresh: string };

    if (refresh === 'mock-refresh-token') {
      return HttpResponse.json({ access: 'new-mock-access-token' }, { status: 200 });
    }

    return HttpResponse.json({ detail: 'Invalid refresh token' }, { status: 401 });
  }),

  http.get(`${API_BASE_URL}/accounts/profile/`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (authHeader && authHeader.startsWith('Bearer')) {
      return HttpResponse.json(mockUser, { status: 200 });
    }

    return HttpResponse.json(
      { detail: 'Authentication credentials were not provided.' },
      { status: 401 }
    );
  }),

  // Add more API endpoints as needed for testing
  // Projects, tasks, teams, comments, files, etc.
];

// Set up the mock service worker
export const worker = setupWorker(...handlers);
