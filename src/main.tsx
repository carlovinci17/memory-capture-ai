import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './lib/auth/auth';
import { AuthGate } from './components/AuthGate';
import { ErrorBoundary } from './components/ErrorBoundary';

// Design system — ported verbatim from the approved prototype.
// a11y-reset must load first so ported class rules win on specifics.
import './styles/a11y-reset.css';
import './styles/app.css';
import './styles/screens.css';
import './styles/screens2.css';
import './styles/mvp.css';
// Accessibility layer — loads last so its opt-in modes win.
import './styles/a11y.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
