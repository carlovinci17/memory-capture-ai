// ProfileScreen.tsx — detail view of one storyteller's journal.
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Bloom, WatercolorArt } from '../components/Watercolor';
import { MemoryArt } from '../components/MemoryArt';
import { SectionHead } from '../components/MemoryCard';
import { initialsOf } from '../lib/format';
import { getPersona } from '../lib/domain/personas';
import { useStore } from '../lib/store/StoreProvider';
import type { StorytellerProfile } from '../lib/domain/types';

export function ProfileScreen({ profile }: { profile: StorytellerProfile }) {
  const navigate = useNavigate();
  const { deleteProfile } = useStore();
  const persona = getPersona(profile.personaId);
  const memories = profile.memories || [];

  const confirmDelete = async () => {
    if (
      window.confirm('Delete this profile and everything you’ve captured? This can’t be undone.')
    ) {
      const next = await deleteProfile(profile.id);
      navigate(next ? `/profiles/${next}` : '/onboarding');
    }
  };

  const facts = [
    profile.gender ? { k: 'Gender', v: profile.gender === 'M' ? 'Male' : 'Female' } : null,
    profile.yearBorn ? { k: 'Born', v: profile.yearBorn } : null,
    profile.birthplace ? { k: 'From', v: profile.birthplace } : null,
    { k: 'Memories', v: `${memories.length} captured` },
    { k: 'Sessions', v: `${profile.sessions || 0} recorded` },
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <div className="page page--wide">
      <button className="chip" onClick={() => navigate('/profiles')} style={{ marginBottom: 18 }}>
        <Icon name="arrow" size={14} style={{ transform: 'rotate(180deg)' }} /> All profiles
      </button>

      <section className="profile-hero rise">
        <div
          style={{ position: 'absolute', right: -20, top: -50, width: 240, height: 240, opacity: 0.6 }}
          aria-hidden="true"
        >
          <Bloom color="var(--bloom-b)" r={38} seed={6} />
        </div>
        <div className="profile-portrait">
          {profile.photo ? (
            <img className="profile-photo-img" src={profile.photo} alt={profile.name} />
          ) : (
            <>
              <WatercolorArt
                seed={8}
                palette={['var(--bloom-b)', 'var(--bloom-a)', 'var(--bloom-c)']}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: 52,
                  color: '#fff',
                  textShadow: '0 2px 8px rgba(52,41,31,.3)',
                }}
              >
                {initialsOf(profile.name)}
              </div>
            </>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <div className="eyebrow">A life in progress</div>
          <h1 className="profile-name" style={{ marginTop: 6 }}>
            {profile.name}
          </h1>
          <p className="profile-sub">
            {profile.bio ||
              'Your story is just beginning. Start an interview and your words will fill this space.'}
          </p>
          <div className="profile-facts">
            {facts.map((f) => (
              <div key={f.k} className="profile-fact">
                <div className="profile-fact__k">{f.k}</div>
                <div className="profile-fact__v">{f.v}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 22,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <button className="btn btn--primary" onClick={() => navigate('/interview')}>
              <Icon name="mic" size={16} /> Start a session
            </button>
            <button className="btn btn--ghost" onClick={() => navigate('/edit')}>
              <Icon name="profile" size={15} /> Edit profile
            </button>
            <button className="btn-delete" onClick={confirmDelete} style={{ marginLeft: 'auto' }}>
              Delete profile
            </button>
          </div>
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 22,
          marginTop: 24,
          alignItems: 'start',
        }}
      >
        {/* interviewer */}
        <div className="panel rise" style={{ animationDelay: '.05s' }}>
          <SectionHead eyebrow="Who interviews you" title="Your interviewer" />
          <div className="persona-row" style={{ borderBottom: 'none', paddingTop: 4 }}>
            <div
              className="persona-row__av"
              style={{
                background: `radial-gradient(120% 120% at 30% 20%, var(--bloom-b), ${persona.accent})`,
              }}
            >
              {persona.glyph}
            </div>
            <div style={{ flex: 1 }}>
              <div className="persona-row__name">{persona.name}</div>
              <div className="persona-row__blurb">{persona.blurb}</div>
            </div>
          </div>
          <div className="rail__empty" style={{ textAlign: 'left', marginTop: 8 }}>
            “{persona.sample}”
          </div>
          <button className="btn btn--ghost" style={{ marginTop: 16 }} onClick={() => navigate('/edit')}>
            <Icon name="arrow" size={15} /> Change interviewer
          </button>
        </div>

        {/* captured memories */}
        <div className="panel rise" style={{ animationDelay: '.1s' }}>
          <SectionHead eyebrow="In your own words" title={`Memories (${memories.length})`} />
          {memories.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {memories.map((c) => (
                <button
                  key={c.id}
                  className="persona-row"
                  style={{ paddingTop: 6, paddingBottom: 14, width: '100%', textAlign: 'left' }}
                  onClick={() => navigate(`/memories/${c.id}`)}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      overflow: 'hidden',
                      flex: 'none',
                      position: 'relative',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <MemoryArt memory={c} seed={(c.title || '').length + 3} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="persona-row__name" style={{ fontSize: 16 }}>
                      {c.title}
                    </div>
                    <div
                      className="persona-row__blurb"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {c.excerpt}
                    </div>
                  </div>
                  {c.era ? <span className="mcard__tag">{c.era}</span> : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="rail__empty" style={{ textAlign: 'left' }}>
              No memories captured yet. Your first interview will start filling this in.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
