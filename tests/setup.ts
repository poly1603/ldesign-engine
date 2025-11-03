/**
 * Vitest Global Test Setup
 * 
 * This file runs before all tests to set up the testing environment.
 */

// Mock browser APIs if not available
if (typeof global.window === 'undefined') {
  (global as any).window = {};
}

if (typeof global.document === 'undefined') {
  (global as any).document = {
    documentElement: {
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      style: {},
      setAttribute: () => {}
    }
  };
}

if (typeof global.localStorage === 'undefined') {
  const storage: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
    length: 0,
    key: () => null
  };
}

if (typeof global.matchMedia === 'undefined') {
  (global as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true
  });
}

// Reset all mocks after each test
import { afterEach } from 'vitest';

afterEach(() => {
  // Clean up any global state if needed
});
