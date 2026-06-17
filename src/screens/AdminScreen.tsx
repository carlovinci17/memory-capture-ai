import { useState } from 'react';
import { WatercolorDefs } from '../components/Watercolor';
import { Icon } from '../components/Icon';
import { isDemoMode, setRuntimeMode, verifyAdminPassword } from '../lib/demo/demoMode';

export function AdminScreen() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const currentMode = isDemoMode() ? 'demo' : 'production';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError(false);
    const ok = await verifyAdminPassword(password);
    setChecking(false);
    if (ok) {
      setUnlocked(true);
    } else {
      setError(true);
      setPassword('');
    }
  };

  const switchTo = (mode: 'demo' | 'production') => {
    setRuntimeMode(mode);
    window.location.reload();
  };

  return (
    <div className="ob-stage" data-mood="terracotta">
      <WatercolorDefs />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 32,
        }}
      >
        <div className="ob__panel" style={{ maxWidth: 420, width: '100%' }}>
          <div className="ob__panel-head">
            <div className="eyebrow ob__panel-eyebrow">Admin</div>
            <div className="ob__panel-title">Memory Capture AI</div>
          </div>

          {!unlocked ? (
            <form onSubmit={onSubmit}>
              <div className="ob-field">
                <label className="ob-label" htmlFor="admin-pw">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="admin-pw"
                    type={showPassword ? 'text' : 'password'}
                    className="ob-input"
                    style={{
                      paddingRight: 44,
                      ...(error ? { borderColor: 'var(--error, #c0392b)' } : {}),
                    }}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(false); }}
                    placeholder="Enter admin password"
                    autoFocus
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      color: 'var(--ink-3)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                  </button>
                </div>
                {error && (
                  <div className="ob-hint" style={{ color: 'var(--error, #c0392b)', marginTop: 6 }}>
                    Incorrect password.
                  </div>
                )}
              </div>

              <button
                className="btn btn--primary"
                type="submit"
                disabled={!password.trim() || checking}
                style={{ width: '100%' }}
              >
                {checking ? 'Checking…' : 'Unlock'}
              </button>
            </form>
          ) : (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  Current mode
                </div>
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
                  <button
                    className="btn btn--primary"
                    onClick={() => switchTo('production')}
                    style={{ width: '100%' }}
                  >
                    <Icon name="arrow" size={15} /> Switch to Production
                  </button>
                ) : (
                  <button
                    className="btn btn--ghost"
                    onClick={() => switchTo('demo')}
                    style={{ width: '100%' }}
                  >
                    Switch to Demo mode
                  </button>
                )}
                <button
                  className="btn btn--ghost"
                  onClick={() => setUnlocked(false)}
                  style={{ width: '100%' }}
                >
                  Lock admin
                </button>
              </div>

              <p className="ob-hint" style={{ marginTop: 18 }}>
                Switching mode reloads the page. Demo mode stores data locally —
                safe for public visitors. Production mode persists to Azure Cosmos DB.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
