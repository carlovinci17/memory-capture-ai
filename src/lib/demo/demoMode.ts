export const RUNTIME_MODE_KEY = 'mcap_mode';
export const DEMO_SESSION_KEY = 'mcap_demo_sessions_v1';
export const DEMO_SESSION_LIMIT = 2;
const ADMIN_AUTH_KEY = 'mcap_admin_auth_v1';

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

export function isAdminAuthenticated(): boolean {
  const hash = import.meta.env.VITE_ADMIN_PASSWORD_HASH as string | undefined;
  if (!hash) return true; // no password configured — open
  try {
    return localStorage.getItem(ADMIN_AUTH_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(): void {
  try {
    localStorage.setItem(ADMIN_AUTH_KEY, '1');
  } catch { /* ignore */ }
}

export function clearAdminAuthenticated(): void {
  try {
    localStorage.removeItem(ADMIN_AUTH_KEY);
  } catch { /* ignore */ }
}

