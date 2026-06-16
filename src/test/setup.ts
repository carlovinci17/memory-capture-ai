import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Reset DOM + localStorage between tests so the repository starts clean.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
