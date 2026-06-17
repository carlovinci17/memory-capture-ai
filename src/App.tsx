// App.tsx — routing + app shell. Guest/local mode; cloud auth lands in M9.
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { WatercolorDefs } from './components/Watercolor';
import { Icon } from './components/Icon';
import { useStore } from './lib/store/StoreProvider';
import { todayLabel } from './lib/format';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { InterviewScreen } from './screens/InterviewScreen';
import { ProfilesScreen } from './screens/ProfilesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { MemoryScreen } from './screens/MemoryScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { AdminScreen } from './screens/AdminScreen';
import { PrivacyScreen } from './screens/PrivacyScreen';
import type { StorytellerProfile } from './lib/domain/types';

function meta(pathname: string, profile: StorytellerProfile): { eyebrow: string; title: string } {
  if (pathname.startsWith('/interview')) return { eyebrow: 'Live voice session', title: 'The Interview' };
  if (pathname.startsWith('/profiles/')) return { eyebrow: 'Storyteller', title: profile.name };
  if (pathname.startsWith('/profiles')) return { eyebrow: 'Everyone’s stories', title: 'Profiles' };
  if (pathname.startsWith('/summary')) return { eyebrow: 'Session complete', title: 'What we captured' };
  return { eyebrow: todayLabel(), title: 'Your Journal' };
}

/** Shell with sidebar + top bar; redirects to onboarding when no profile exists. */
function AppLayout() {
  const { activeProfile } = useStore();
  const location = useLocation();

  if (!activeProfile) return <Navigate to="/onboarding" replace />;

  const { eyebrow, title } = meta(location.pathname, activeProfile);

  return (
    <div className="app" data-mood="terracotta" data-type="editorial" data-texture="medium">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <WatercolorDefs />
      <Sidebar />
      <main className="main" id="main">
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

  if (!ready) {
    return (
      <div className="ob-stage" data-mood="terracotta" aria-busy="true">
        <WatercolorDefs />
        <p className="ob-hint" style={{ margin: 32 }}>
          Gathering your journal…
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="ob-stage" data-mood="terracotta" role="alert">
        <WatercolorDefs />
        <div className="ob__panel" style={{ maxWidth: 460, margin: 'auto', textAlign: 'center' }}>
          <h1 className="display" style={{ fontSize: 24 }}>
            We couldn’t reach your journal
          </h1>
          <p className="ob-hint">
            Your stories are safe. This is usually a brief connection hiccup — please try again.
          </p>
          <button className="btn btn--primary" style={{ marginTop: 12 }} onClick={reload}>
            <Icon name="arrow" size={16} /> Try again
          </button>
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
      <Route path="/admin" element={<AdminScreen />} />

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
