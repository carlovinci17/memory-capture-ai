// Avatar.tsx — round avatar: photo if present, else gradient wash + initials.
import type { CSSProperties } from 'react';
import { initialsOf } from '../lib/format';
import type { StorytellerProfile } from '../lib/domain/types';

interface AvatarProps {
  profile: Pick<StorytellerProfile, 'name' | 'photo'> | null;
  size?: number;
  radius?: string;
}

export function Avatar({ profile, size = 38, radius = '50%' }: AvatarProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    flex: 'none',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
    border: '2px solid var(--surface)',
  };

  if (profile && profile.photo) {
    return (
      <div style={style}>
        <img
          src={profile.photo}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...style,
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.36,
        background: 'radial-gradient(120% 120% at 30% 20%, var(--bloom-b), var(--accent-3))',
      }}
    >
      {initialsOf(profile?.name)}
    </div>
  );
}
