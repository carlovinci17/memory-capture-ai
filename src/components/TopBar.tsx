// TopBar.tsx — screen title + profile switcher dropdown (switch / view / add).
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { Avatar } from './Avatar';
import { useStore } from '../lib/store/StoreProvider';
import { isDemoMode } from '../lib/demo/demoMode';
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const onSwitch = async (id: string) => {
    setOpen(false);
    if (id === profile.id) {
      navigate(`/profiles/${id}`);
    } else {
      await switchProfile(id);
      navigate('/home');
    }
  };

  return (
    <>
    {isDemoMode() && (
      <div className="demo-banner">
        <span className="demo-banner__label">Portfolio Demo</span>
        <span className="demo-banner__note">
          Your data stays on this device only · AI processing via Azure (Microsoft)
          {' · '}<Link to="/privacy" className="demo-banner__link">How this works</Link>
        </span>
      </div>
    )}
    <div className="topbar">
      <div>
        <div className="topbar__eyebrow">{eyebrow}</div>
        <div className="topbar__title">{title}</div>
      </div>

      <button
        className="topbar__profile"
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
