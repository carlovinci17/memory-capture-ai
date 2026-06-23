// ProfilesScreen.tsx — grid of all storytellers + "add a storyteller".
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/Avatar';
import { SectionHead } from '../components/MemoryCard';
import { useStore } from '../lib/store/StoreProvider';

export function ProfilesScreen() {
  const { profiles, activeId, switchProfile } = useStore();
  const navigate = useNavigate();

  const open = async (id: string) => {
    await switchProfile(id);
    navigate(`/profiles/${id}`);
  };

  return (
    <div className="page page--wide">
      <SectionHead eyebrow="Everyone's stories" title="Profiles" />
      <p
        style={{
          color: 'var(--ink-2)',
          fontSize: 15,
          lineHeight: 1.6,
          margin: '-8px 0 26px',
          maxWidth: 600,
        }}
      >
        Each storyteller keeps their own living journal — memories, interviews and interviewer. Open
        one to continue their story, or set up someone new.
      </p>

      <div className="profiles-grid">
        {profiles.map((p) => {
          const facts = [p.yearBorn ? 'Born ' + p.yearBorn : null, p.birthplace]
            .filter(Boolean)
            .join(' · ');
          return (
            <button className="profile-tile rise" key={p.id} onClick={() => open(p.id)}>
              <div className="profile-tile__top">
                <Avatar profile={p} size={56} radius="18px" />
                {p.id === activeId ? (
                  <span className="profile-tile__badge">
                    <Icon name="check" size={12} /> Current
                  </span>
                ) : null}
              </div>
              <div className="profile-tile__name">{p.name}</div>
              <div className="profile-tile__meta">{facts || 'No details yet'}</div>
              <div className="profile-tile__stats">
                <span>
                  <strong>{(p.memories || []).length}</strong> memories
                </span>
                <span>
                  <strong>{p.sessions || 0}</strong> session{(p.sessions || 0) === 1 ? '' : 's'}
                </span>
              </div>
              <div className="profile-tile__open">
                Open journal <Icon name="arrow" size={14} />
              </div>
            </button>
          );
        })}

        <button
          className="profile-tile profile-tile--add rise"
          onClick={() => navigate('/onboarding')}
        >
          <div className="profile-tile__addico">
            <Icon name="plus" size={26} />
          </div>
          <div className="profile-tile__name">Add a storyteller</div>
          <div className="profile-tile__meta">Start a new living journal for someone else.</div>
        </button>
      </div>
    </div>
  );
}
