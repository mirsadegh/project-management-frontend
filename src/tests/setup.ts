// src/tests/setup.ts
// Global test setup for Vitest with React Testing Library

import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with methods from react-testing-library
expect.extend(matchers);

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock localStorage for testing
global.localStorage = {
  store: {} as Record<string, string>,
  getItem(key: string): string | null {
    return this.store[key] || null;
  },
  setItem(key: string, value: string): void {
    this.store[key] = value;
  },
  removeItem(key: string): void {
    delete this.store[key];
  },
  clear(): void {
    this.store = {};
  },
};

// Mock console.error to suppress React act() warnings in tests
// This is a common pattern to reduce noise in test output
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning: An update to')) {
      // Suppress React act() warnings
      return;
    }
    console.error(...args);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Set up global configuration for MSW (Mock Service Worker)
// This will be used for API mocking in tests
if (typeof globalThis !== 'undefined') {
  globalThis.__MSW__ = {
    enabled: false,
  };
}