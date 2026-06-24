import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WatercolorDefs } from '../components/Watercolor';
import { Icon } from '../components/Icon';
import { isDemoMode, setRuntimeMode, DEMO_SESSION_KEY } from '../lib/demo/demoMode';
import { useStore } from '../lib/store/StoreProvider';

export function AdminScreen() {
  const navigate = useNavigate();
  const { resetAll } = useStore();
  const [resetting, setResetting] = useState(false);

  const currentMode = isDemoMode() ? 'demo' : 'production';

  const resetDemo = async () => {
    setResetting(true);
    localStorage.removeItem(DEMO_SESSION_KEY);
    await resetAll();
    window.location.reload();
  };

  const switchTo = (mode: 'demo' | 'production') => {
    setRuntimeMode(mode);
    window.location.reload();
  };

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
            {currentMode === 'demo' && (
              <button
                className="btn btn--ghost"
                onClick={() => void resetDemo()}
                disabled={resetting}
                style={{ width: '100%' }}
              >
                <Icon name="spark" size={15} /> {resetting ? 'Resetting…' : 'Reset demo data'}
              </button>
            )}
          </div>

          <p className="ob-hint" style={{ marginTop: 18 }}>
            Switching mode reloads the page. Demo mode stores data locally —
            safe for public visitors. Production mode persists to Azure Cosmos DB.
          </p>

          <div style={{ marginTop: 20, borderTop: '1px solid var(--line, #e5e5e5)', paddingTop: 16 }}>
            <button className="btn btn--ghost" onClick={() => navigate('/home')} style={{ width: '100%' }}>
              <Icon name="arrow" size={15} style={{ transform: 'rotate(180deg)' }} /> Back to app
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
