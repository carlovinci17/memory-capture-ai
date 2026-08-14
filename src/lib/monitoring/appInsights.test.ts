import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => vi.stubEnv('VITE_APPINSIGHTS_CONNECTION_STRING', ''));
afterEach(() => vi.unstubAllEnvs());

describe('appInsights (unconfigured)', () => {
  it('initAppInsights does nothing when no connection string is set', async () => {
    const { initAppInsights } = await import('./appInsights');
    expect(() => initAppInsights()).not.toThrow();
  });

  it('trackException is a safe no-op before initialization', async () => {
    const { trackException } = await import('./appInsights');
    expect(() => trackException(new Error('test'))).not.toThrow();
  });
});
