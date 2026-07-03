import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WatercolorDefs } from '../components/Watercolor';
import { Icon } from '../components/Icon';
import {
  isDemoMode,
  setRuntimeMode,
  isAdminAuthenticated,
  setAdminAuthenticated,
  clearAdminAuthenticated,
} from '../lib/demo/demoMode';

const HASH = (import.meta.env.VITE_ADMIN_PASSWORD_HASH as string | undefined) ?? '';

async function verifyPassword(pw: string): Promise<boolean> {
  if (!HASH) return true;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex === HASH;
}

export function AdminScreen() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(isAdminAuthenticated);
  const [pw, setPw] = useState('');
  const [pwErrorMsg, setPwErrorMsg] = useState('');
  const [checking, setChecking] = useState(false);

  const currentMode = isDemoMode() ? 'demo' : 'production';
  const [googleUser, setGoogleUser] = useState<string | null>(null);

  useEffect(() => {
    fetch('/.auth/me')
      .then((r) => r.json())
      .then((d: { clientPrincipal?: { userDetails?: string } | null }) => {
        setGoogleUser(d?.clientPrincipal?.userDetails ?? null);
      })
      .catch(() => {});
  }, []);

  const submitPassword = async () => {
    if (checking) return;
    if (!pw.trim()) {
      setPwErrorMsg('No password entered.');
      return;
    }
    setChecking(true);
    const ok = await verifyPassword(pw);
    setChecking(false);
    if (ok) {
      setAdminAuthenticated();
      setAuthed(true);
    } else {
      setPwErrorMsg('Incorrect password.');
      setPw('');
    }
  };

  const switchTo = (mode: 'demo' | 'production') => {
    setRuntimeMode(mode);
    window.location.reload();
  };

  const signOutAdmin = () => {
    clearAdminAuthenticated();
    setAuthed(false);
    navigate('/home');
  };

  if (!authed) {
    return (
      <div className="ob-stage" data-mood="terracotta">
        <WatercolorDefs />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 32 }}>
          <div className="ob__panel" style={{ maxWidth: 380, width: '100%' }}>
            <div className="ob__panel-head">
              <div className="eyebrow ob__panel-eyebrow">Admin</div>
              <div className="ob__panel-title">Enter password</div>
            </div>

            <div className="ob-field">
              <input
                className="ob-input"
                type="password"
                value={pw}
                onChange={(e) => { setPw(e.target.value); setPwErrorMsg(''); }}
                onKeyDown={(e) => e.key === 'Enter' && void submitPassword()}
                placeholder="Admin password"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
              {pwErrorMsg && (
                <div className="ob-hint" style={{ color: 'var(--error, #c0392b)', marginTop: 6 }}>
                  {pwErrorMsg}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn--primary"
                onClick={() => void submitPassword()}
                disabled={checking}
                style={{ width: '100%' }}
              >
                {checking ? 'Checking…' : 'Enter'}
              </button>
              <button className="btn btn--ghost" onClick={() => navigate('/home')} style={{ width: '100%' }}>
                <Icon name="arrow" size={15} style={{ transform: 'rotate(180deg)' }} /> Back to app
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ob-stage" data-mood="terracotta">
      <WatercolorDefs />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 32 }}>
        <div className="ob__panel" style={{ maxWidth: 420, width: '100%' }}>
          <div className="ob__panel-head">
            <div className="eyebrow ob__panel-eyebrow">Admin</div>
            <div className="ob__panel-title">Memory Capture AI</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Current mode</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`mode-badge mode-badge--${currentMode}`}>
                {currentMode === 'demo' ? 'Demo' : 'Production'}
              </span>
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                {currentMode === 'demo'
                  ? 'Data stored on this device only'
                  : 'Data stored in Azure Cosmos DB'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentMode === 'demo' ? (
              <button className="btn btn--primary" onClick={() => switchTo('production')} style={{ width: '100%' }}>
                <Icon name="arrow" size={15} /> Switch to Production
              </button>
            ) : (
              <button className="btn btn--ghost" onClick={() => switchTo('demo')} style={{ width: '100%' }}>
                Switch to Demo mode
              </button>
            )}
          </div>

          <p className="ob-hint" style={{ marginTop: 18 }}>
            Switching mode reloads the page. Demo mode stores data locally —
            safe for public visitors. Production mode persists to Azure Cosmos DB.
          </p>

          <div style={{ marginTop: 20, borderTop: '1px solid var(--line, #e5e5e5)', paddingTop: 16, marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Google session</div>
            {googleUser ? (
              <>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 10 }}>
                  Signed in as <strong>{googleUser}</strong>
                </p>
                <button
                  className="btn btn--ghost"
                  onClick={() => { window.location.href = '/.auth/logout?post_logout_redirect_uri=/'; }}
                  style={{ width: '100%' }}
                >
                  Sign out of Google
                </button>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--ink-4)' }}>No active Google session.</p>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--line, #e5e5e5)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn--ghost" onClick={() => navigate('/home')} style={{ width: '100%' }}>
              <Icon name="arrow" size={15} style={{ transform: 'rotate(180deg)' }} /> Back to app
            </button>
            <button
              className="btn btn--ghost"
              onClick={signOutAdmin}
              style={{ width: '100%', color: 'var(--ink-4)', fontSize: 13 }}
            >
              Sign out of admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
