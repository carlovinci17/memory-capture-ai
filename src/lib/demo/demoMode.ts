export const RUNTIME_MODE_KEY = 'mcap_mode';
export const DEMO_SESSION_KEY = 'mcap_demo_sessions_v1';
export const DEMO_SESSION_LIMIT = 2;

export function getRuntimeMode(): 'demo' | 'production' {
  try {
    return localStorage.getItem(RUNTIME_MODE_KEY) === 'production' ? 'production' : 'demo';
  } catch {
    return 'demo';
  }
}

export function setRuntimeMode(mode: 'demo' | 'production'): void {
  try {
    localStorage.setItem(RUNTIME_MODE_KEY, mode);
  } catch {
    // storage unavailable — fail soft
  }
}

export const isDemoMode = (): boolean => getRuntimeMode() === 'demo';

