// auth.tsx — authentication state for Azure Static Web Apps built-in auth.
// In guest mode (default) there is no auth and everything is open. In "swa"
// mode we read /.auth/me; an unauthenticated user is gated to the sign-in
// screen before any cloud data loads. Login/logout use SWA's /.auth/* routes
// (GitHub provider).
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AuthMode = 'guest' | 'swa';
type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthUser {
  name: string;
  provider?: string;
}

interface AuthValue {
  mode: AuthMode;
  status: AuthStatus;
  user: AuthUser | null;
  login: () => void;
  logout: () => void;
}

// Default = guest/authenticated, so components used outside a provider (e.g. in
// unit tests) behave as the offline app.
const GUEST: AuthValue = {
  mode: 'guest',
  status: 'authenticated',
  user: { name: 'Guest' },
  login: () => {},
  logout: () => {},
};

const AuthContext = createContext<AuthValue>(GUEST);

export function AuthProvider({ children }: { children: ReactNode }) {
  const mode: AuthMode = (import.meta.env.VITE_AUTH_PROVIDER ?? 'guest') === 'swa' ? 'swa' : 'guest';
  const [status, setStatus] = useState<AuthStatus>(mode === 'swa' ? 'loading' : 'authenticated');
  const [user, setUser] = useState<AuthUser | null>(mode === 'swa' ? null : { name: 'Guest' });

  useEffect(() => {
    if (mode !== 'swa') return;
    let alive = true;
    fetch('/.auth/me')
      .then((r) => r.json())
      .then((d: { clientPrincipal?: { userDetails?: string; identityProvider?: string } }) => {
        if (!alive) return;
        const p = d?.clientPrincipal;
        if (p) {
          setUser({ name: p.userDetails || 'You', provider: p.identityProvider });
          setStatus('authenticated');
        } else {
          setStatus('anonymous');
        }
      })
      .catch(() => alive && setStatus('anonymous'));
    return () => {
      alive = false;
    };
  }, [mode]);

  const login = useCallback(() => {
    const back = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/.auth/login/github?post_login_redirect_uri=${back}`;
  }, []);
  const logout = useCallback(() => {
    window.location.href = '/.auth/logout?post_logout_redirect_uri=/';
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ mode, status, user, login, logout }),
    [mode, status, user, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  return useContext(AuthContext);
}
