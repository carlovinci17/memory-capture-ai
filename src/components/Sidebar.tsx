// Sidebar.tsx — trimmed MVP navigation (Home / Interview / Profiles).
import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import { A11yMenu } from './A11yMenu';
import { isAdminAuthenticated, getRuntimeMode } from '../lib/demo/demoMode';

const ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/interview', label: 'Interview', icon: 'interview' },
  { to: '/profiles', label: 'Profiles', icon: 'profile' },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
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
      {onToggle && (
        <button
          className="nav__item sidebar__collapse-btn"
          onClick={onToggle}
          aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
          title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
          style={{ margin: '0 8px 4px' }}
        >
          <Icon name="chev" size={16} className="nav__icon" style={{ transform: 'rotate(90deg)' }} />
          <span>Hide sidebar</span>
        </button>
      )}
      <A11yMenu />
      <NavLink
        to="/privacy"
        className={({ isActive }) => 'nav__item' + (isActive ? ' is-active' : '')}
        style={{ margin: '0 8px 4px' }}
      >
        <Icon name="info" className="nav__icon" />
        <span>Privacy & AI</span>
      </NavLink>
      <NavLink
        to="/admin"
        className={({ isActive }) => 'nav__item' + (isActive ? ' is-active' : '')}
        style={{ margin: '0 8px 4px' }}
      >
        <Icon name="lock" className="nav__icon" />
        <span>Admin</span>
        {isAdminAuthenticated() && (
          <Icon name="arrow" size={11} style={{ marginLeft: 'auto', color: 'var(--accent)', transform: 'rotate(-45deg)' }} />
        )}
      </NavLink>
      {getRuntimeMode() === 'production' && (
        <button
          className="nav__item"
          onClick={() => { window.location.href = '/.auth/logout?post_logout_redirect_uri=/'; }}
          style={{ margin: '0 8px 8px' }}
        >
          <Icon name="pause" className="nav__icon" />
          <span>Sign out</span>
        </button>
      )}
      <footer className="sidebar__footer">
        <p>© 2026 Memory Capture AI</p>
        <p>
          By{' '}
          <a href="https://carlovinci.com.au" target="_blank" rel="noopener noreferrer">
            Carlo Vinci
          </a>
        </p>
      </footer>
    </aside>
  );
}
