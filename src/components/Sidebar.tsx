// Sidebar.tsx — trimmed MVP navigation (Home / Interview / Profiles).
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import { A11yMenu } from './A11yMenu';
import { useAuth } from '../lib/auth/auth';
import { useStore } from '../lib/store/StoreProvider';

const ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/interview', label: 'Interview', icon: 'interview' },
  { to: '/profiles', label: 'Profiles', icon: 'profile' },
];

export function Sidebar() {
  const { mode, user, logout } = useAuth();
  const { resetAll } = useStore();
  const navigate = useNavigate();

  const onReset = async () => {
    if (
      window.confirm(
        'Reset demo data? This permanently deletes all storytellers and their captured memories.',
      )
    ) {
      await resetAll();
      navigate('/onboarding');
    }
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand__mark">
          <Icon name="quote" size={20} />
        </div>
        <div className="brand__name">Memory Capture AI</div>
      </div>

      <nav className="nav" aria-label="Primary">
        <div className="nav__label">Your Journal</div>
        {ITEMS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => 'nav__item' + (isActive ? ' is-active' : '')}
          >
            <Icon name={it.icon} className="nav__icon" />
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__spacer" />
      <A11yMenu />
      <button
        className="nav__item"
        onClick={() => void onReset()}
        style={{ margin: '0 8px 4px', color: 'var(--accent-ink)' }}
      >
        <Icon name="pause" className="nav__icon" />
        <span>Reset demo data</span>
      </button>
      {mode === 'swa' && (
        <button className="nav__item" onClick={logout} style={{ margin: '0 8px 8px' }}>
          <Icon name="pause" className="nav__icon" />
          <span>Sign out{user?.name ? ` · ${user.name}` : ''}</span>
        </button>
      )}
    </aside>
  );
}
