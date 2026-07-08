// TopBar.tsx — screen title + profile switcher dropdown (switch / view / add).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { Avatar } from './Avatar';
import { useStore } from '../lib/store/StoreProvider';
import { getRuntimeMode } from '../lib/demo/demoMode';
import type { StorytellerProfile } from '../lib/domain/types';

interface TopBarProps {
  eyebrow: string;
  title: string;
  profile: StorytellerProfile;
}

export function TopBar({ eyebrow, title, profile }: TopBarProps) {
  const { profiles, switchProfile } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (getRuntimeMode() !== 'production') return;
    fetch('/.auth/me')
      .then((r) => r.json())
      .then((d: { clientPrincipal?: { userDetails?: string } | null }) => {
        setGoogleUser(d?.clientPrincipal?.userDetails ?? null);
      })
      .catch(() => {});
  }, []);

  const onSwitch = async (id: string) => {
    setOpen(false);
    if (id === profile.id) {
      navigate(`/profiles/${id}`);
    } else {
      await switchProfile(id);
      navigate('/home');
    }
  };

  const userInitial = googleUser ? googleUser.split('@')[0][0]?.toUpperCase() ?? '?' : '';
  const userLabel = googleUser ? googleUser.split('@')[0] : '';

  return (
    <>
    <div className="topbar">
      <div>
        <div className="topbar__eyebrow">{eyebrow}</div>
        <div className="topbar__title">{title}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
        {googleUser && (
          <>
            <div
              title={googleUser}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px 4px 4px',
                borderRadius: 20,
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                maxWidth: 180,
                overflow: 'hidden',
              }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                {userInitial}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userLabel}
              </span>
            </div>
            <button
              className="btn btn--ghost"
              style={{ fontSize: 12, padding: '5px 12px', whiteSpace: 'nowrap' }}
              onClick={() => {
                window.location.href = '/.auth/logout?post_logout_redirect_uri=' + encodeURIComponent('/');
              }}
            >
              Sign out
            </button>
          </>
        )}

        <button
          className="topbar__profile"
          style={{ marginLeft: 0 }}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Switch storyteller. Current: ${profile.name}`}
        >
          <div className="topbar__profile-txt">
            <div className="topbar__profile-name">{profile.name}</div>
            <div className="topbar__profile-meta">
              {(profile.memories || []).length} memories captured
            </div>
          </div>
          <Avatar profile={profile} size={40} />
          <Icon
            name="chev"
            size={15}
            className="topbar__profile-chev"
            style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          />
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            className="pm-backdrop"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="pm-menu" role="menu">
            <div className="pm-label">Storytellers</div>
            {profiles.map((p) => (
              <button
                key={p.id}
                role="menuitem"
                className={'pm-item' + (p.id === profile.id ? ' is-active' : '')}
                onClick={() => onSwitch(p.id)}
              >
                <Avatar profile={p} size={36} />
                <div className="pm-item__txt">
                  <div className="pm-item__name">{p.name}</div>
                  <div className="pm-item__meta">
                    {(p.memories || []).length} memories{p.id === profile.id ? ' · current' : ''}
                  </div>
                </div>
                {p.id === profile.id ? (
                  <span className="pm-check">
                    <Icon name="check" size={14} />
                  </span>
                ) : null}
              </button>
            ))}
            <div className="pm-divider" />
            <button
              role="menuitem"
              className="pm-add"
              onClick={() => {
                setOpen(false);
                navigate('/onboarding');
              }}
            >
              <span className="pm-add__ico">
                <Icon name="plus" size={16} />
              </span>{' '}
              Add a new storyteller
            </button>
          </div>
        </>
      )}
    </div>
    </>
  );
}
