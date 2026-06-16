// HomeScreen.tsx — warm welcome for the active storyteller; route into interview.
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Bloom } from '../components/Watercolor';
import { MemoryCard, SectionHead } from '../components/MemoryCard';
import { firstNameOf, greetingWord } from '../lib/format';
import { getPersona } from '../lib/domain/personas';
import type { StorytellerProfile } from '../lib/domain/types';

export function HomeScreen({ profile }: { profile: StorytellerProfile }) {
  const navigate = useNavigate();
  const persona = getPersona(profile.personaId);
  const first = firstNameOf(profile.name);
  const memories = profile.memories || [];
  const sessions = profile.sessions || 0;

  return (
    <div className="page page--wide">
      <section className="hero rise">
        <div className="hero__blooms" aria-hidden="true">
          <div className="b" style={{ right: '-4%', top: '-30%', width: 360, height: 360 }}>
            <Bloom color="var(--bloom-a)" r={40} seed={3} />
          </div>
          <div
            className="b bloom--optional"
            style={{ right: '16%', bottom: '-44%', width: 300, height: 300 }}
          >
            <Bloom color="var(--bloom-b)" r={38} seed={6} />
          </div>
        </div>
        <div className="hero__inner">
          <div className="hero__greet">
            {greetingWord()}, {first}
          </div>
          <h1 className="hero__title">
            {sessions ? (
              <span>
                Where shall we
                <br /> continue today?
              </span>
            ) : (
              <span>
                Your story
                <br /> starts here.
              </span>
            )}
          </h1>
          <p className="hero__sub">
            {sessions
              ? `You’ve recorded ${sessions} session${sessions > 1 ? 's' : ''} and gathered ${memories.length} memor${memories.length === 1 ? 'y' : 'ies'} so far. ${persona.name} is ready whenever you are.`
              : `Sit somewhere comfortable. ${persona.name} will ask a few gentle questions, and turn your answers into a journal of your life — no typing skills required.`}
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary" onClick={() => navigate('/interview')}>
              <Icon name="mic" size={17} />{' '}
              {sessions ? 'Continue your story' : 'Start your first interview'}
            </button>
            <button
              className="btn btn--ghost"
              onClick={() => navigate(`/profiles/${profile.id}`)}
            >
              <Icon name="profile" size={16} /> View your profile
            </button>
          </div>
        </div>
      </section>

      {/* recently captured */}
      <section style={{ marginTop: 40 }}>
        <SectionHead
          eyebrow={memories.length ? 'In your own words' : 'Nothing here yet'}
          title="Recently captured"
        />
        {memories.length ? (
          <div className="grid-cards">
            {memories.slice(0, 3).map((c) => (
              <MemoryCard key={c.id} c={c} onClick={() => navigate(`/memories/${c.id}`)} />
            ))}
          </div>
        ) : (
          <div
            className="rail__empty"
            style={{ maxWidth: 560, textAlign: 'left', padding: '22px 24px' }}
          >
            Your memories will gather here as you talk. Start your first interview and watch the
            first card appear.
          </div>
        )}
      </section>
    </div>
  );
}
