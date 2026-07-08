// App.tsx — routing + app shell. Guest/local mode; cloud auth lands in M9.
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { WatercolorDefs } from './components/Watercolor';
import { Icon } from './components/Icon';
import { useStore } from './lib/store/StoreProvider';
import { todayLabel } from './lib/format';
import { isDemoMode, setRuntimeMode } from './lib/demo/demoMode';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { InterviewScreen } from './screens/InterviewScreen';
import { ProfilesScreen } from './screens/ProfilesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { MemoryScreen } from './screens/MemoryScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { PrivacyScreen } from './screens/PrivacyScreen';
import type { StorytellerProfile } from './lib/domain/types';

function meta(pathname: string, profile: StorytellerProfile): { eyebrow: string; title: string } {
  if (pathname.startsWith('/interview'))
    return { eyebrow: 'Live voice session', title: 'The Interview' };
  if (pathname.startsWith('/profiles/')) return { eyebrow: 'Storyteller', title: profile.name };
  if (pathname.startsWith('/profiles')) return { eyebrow: "Everyone's stories", title: 'Profiles' };
  if (pathname.startsWith('/summary'))
    return { eyebrow: 'Session complete', title: 'What we captured' };
  return { eyebrow: todayLabel(), title: 'Your Journal' };
}

/** Shell with sidebar + top bar; redirects to onboarding when no profile exists. */
function AppLayout() {
  const { activeProfile, resetAll } = useStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('mcap_sidebar_collapsed') === '1',
  );

  const toggleSidebar = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem('mcap_sidebar_collapsed', next ? '1' : '0');
      return next;
    });
  };

  if (!activeProfile) return <Navigate to="/onboarding" replace />;

  const { eyebrow, title } = meta(location.pathname, activeProfile);

  const inDemoMode = isDemoMode();
  const goFullAccess = () => {
    window.location.href = '/onboarding?access=1';
  };
  const clearDemoData = async () => {
    localStorage.removeItem('mcap_demo_sessions_v1');
    await resetAll();
    window.location.reload();
  };

  return (
    <div
      className={'app' + (collapsed ? ' app--sidebar-collapsed' : '')}
      data-mood="terracotta"
      data-type="editorial"
      data-texture="medium"
    >
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <WatercolorDefs />
      <Sidebar onToggle={toggleSidebar} collapsed={collapsed} />
      {collapsed && (
        <button
          className="sidebar-tab"
          onClick={toggleSidebar}
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          <Icon name="chev" size={14} style={{ transform: 'rotate(-90deg)' }} />
        </button>
      )}
      <main className="main" id="main">
        {inDemoMode && (
          <div className="demo-banner">
            <span className="demo-banner__label">Demo mode active</span>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="demo-banner__clear" onClick={() => void clearDemoData()}>
                Reset / Clear my data
              </button>
              <button className="demo-banner__clear" onClick={goFullAccess}>
                Get full access
              </button>
            </div>
          </div>
        )}
        <TopBar eyebrow={eyebrow} title={title} profile={activeProfile} />
        <Outlet context={activeProfile} />
      </main>
    </div>
  );
}

/** A profile must exist to view these screens; read the active one from context. */
function useActiveProfile(): StorytellerProfile {
  const { activeProfile } = useStore();
  // AppLayout guarantees a profile before rendering children.
  return activeProfile as StorytellerProfile;
}

export default function App() {
  const { ready, profiles, loadError, reload } = useStore();

  // Compute denial state early so hooks below can reference it unconditionally.
  const isDenied = !!loadError && /not.?approved|access.?denied/i.test(loadError);

  // After Google OAuth returns with ?mcap_setup=1, verify auth then switch to production mode.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('mcap_setup')) return;
    console.log('[Auth] ?mcap_setup=1 detected — fetching /.auth/me');
    window.history.replaceState({}, '', window.location.pathname);
    fetch('/.auth/me')
      .then((r) => r.json())
      .then((d: { clientPrincipal?: { userId?: string; userDetails?: string } | null }) => {
        console.log('[Auth] /.auth/me response:', JSON.stringify(d));
        if (d?.clientPrincipal?.userId) {
          console.log('[Auth] userId found:', d.clientPrincipal.userId, '(' + (d.clientPrincipal.userDetails ?? 'no email') + ') — switching to production mode');
          setRuntimeMode('production');
          window.location.reload();
        } else {
          console.warn('[Auth] no userId in /.auth/me — staying in demo mode');
        }
      })
      .catch((e) => console.error('[Auth] /.auth/me fetch failed:', e));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [cancelling, setCancelling] = useState(false);

  // Countdown before automatically returning to demo mode when access is denied.
  const [countdown, setCountdown] = useState(3);
  useEffect(() => {
    if (!isDenied) return;
    const id = setInterval(() => setCountdown((n) => n - 1), 1000);
    return () => clearInterval(id);
  }, [isDenied]);
  useEffect(() => {
    if (!isDenied || countdown > 0) return;
    setRuntimeMode('demo');
    window.location.reload();
  }, [isDenied, countdown]);

  if (!ready) {
    return (
      <div
        className="ob-stage"
        data-mood="terracotta"
        aria-busy="true"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <WatercolorDefs />
        <p
          style={{
            fontSize: 22,
            color: 'var(--ink-3)',
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontStyle: 'italic',
          }}
        >
          Gathering your journal…
        </p>
      </div>
    );
  }

  if (loadError) {
    const isPending = /pending.?approval/i.test(loadError);
    const isAuth = !isPending && !isDenied && /401|403|unauthorized|forbidden/i.test(loadError);
    const isServer = /5\d\d/.test(loadError);
    const heading = isPending
      ? 'Awaiting approval'
      : isDenied
        ? 'Access not approved'
        : isAuth
          ? 'Sign-in required'
          : isServer
            ? 'Service temporarily unavailable'
            : "We couldn't reach your journal";
    const detail = isPending
      ? "You're in the queue. Once approved you'll get an email — then hit Refresh below to get full access."
      : isDenied
        ? `Your access request was not approved. Returning to demo mode in ${countdown}…`
        : isAuth
          ? 'Sign in with your Google account to continue.'
          : isServer
            ? 'Our servers are having a moment. Your stories are safe — please try again shortly.'
            : 'This is usually a brief connection hiccup. Check your internet connection and try again.';
    return (
      <div
        className="ob-stage"
        data-mood="terracotta"
        role="alert"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <WatercolorDefs />
        <div className="ob__panel" style={{ maxWidth: 460, textAlign: 'center' }}>
          <h1 className="display" style={{ fontSize: 24 }}>
            {heading}
          </h1>
          <p className="ob-hint">{detail}</p>
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              marginTop: 12,
              flexWrap: 'wrap',
            }}
          >
            {isAuth ? (
              <>
                <a
                  className="btn btn--primary"
                  href={`/.auth/login/google?prompt=select_account&post_login_redirect_uri=${encodeURIComponent(window.location.pathname)}`}
                  onClick={() => console.log('[Auth] Sign in from error screen →', `/.auth/login/google?prompt=select_account&post_login_redirect_uri=${encodeURIComponent(window.location.pathname)}`)}
                >
                  Sign in with Google
                </a>
                <button
                  className="btn btn--ghost"
                  onClick={() => { setRuntimeMode('demo'); window.location.reload(); }}
                >
                  Cancel
                </button>
              </>
            ) : isPending ? (
              <>
                <button className="btn btn--primary" onClick={reload}>
                  <Icon name="arrow" size={16} /> Refresh
                </button>
                <button
                  className="btn btn--ghost"
                  disabled={cancelling}
                  onClick={async () => {
                    setCancelling(true);
                    await fetch('/api/users/cancel', { method: 'POST' }).catch(() => {});
                    setRuntimeMode('demo');
                    window.location.href = '/.auth/logout?post_logout_redirect_uri=' + encodeURIComponent('/onboarding?access=1');
                  }}
                >
                  {cancelling ? 'Cancelling…' : 'Cancel request'}
                </button>
              </>
            ) : !isDenied ? (
              <button className="btn btn--primary" onClick={reload}>
                <Icon name="arrow" size={16} /> Try again
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={profiles.length ? '/home' : '/onboarding'} replace />}
      />
      <Route path="/onboarding" element={<OnboardingScreen />} />
      <Route path="/edit" element={<OnboardingScreen editing />} />

      <Route element={<AppLayout />}>
        <Route path="/home" element={<HomeRoute />} />
        <Route path="/interview" element={<InterviewRoute />} />
        <Route path="/summary" element={<SummaryRoute />} />
        <Route path="/profiles" element={<ProfilesScreen />} />
        <Route path="/profiles/:id" element={<ProfileRoute />} />
        <Route path="/memories/:memId" element={<MemoryRoute />} />
        <Route path="/privacy" element={<PrivacyScreen />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function HomeRoute() {
  return <HomeScreen profile={useActiveProfile()} />;
}
function InterviewRoute() {
  return <InterviewScreen profile={useActiveProfile()} />;
}
function SummaryRoute() {
  return <SummaryScreen profile={useActiveProfile()} />;
}
function ProfileRoute() {
  // `:id` drives which profile is active; switching happens before navigation,
  // so we render the active profile (kept in sync by the store).
  useParams();
  return <ProfileScreen profile={useActiveProfile()} />;
}
function MemoryRoute() {
  return <MemoryScreen profile={useActiveProfile()} />;
}
