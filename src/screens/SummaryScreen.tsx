// SummaryScreen.tsx — what was captured this session.
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Bloom } from '../components/Watercolor';
import { MemoryCard, SectionHead } from '../components/MemoryCard';
import { firstNameOf } from '../lib/format';
import { getPersona } from '../lib/domain/personas';
import { getInterviewEngine } from '../lib/ai';
import type { SessionResult, StorytellerProfile } from '../lib/domain/types';

export function SummaryScreen({ profile }: { profile: StorytellerProfile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const persona = getPersona(profile.personaId);
  const session = (location.state as { session?: SessionResult } | null)?.session ?? {
    memories: [],
    noticed: [],
    turns: 0,
    minutes: 0,
    transcript: [],
  };

  // Optional, clearly-labeled AI reflection (Scope §7.4). Offline/guest or any
  // failure simply leaves it hidden — stats below are always computed in code.
  const [reflection, setReflection] = useState<string | null>(null);
  useEffect(() => {
    if (!session.memories.length) return;
    let alive = true;
    void getInterviewEngine()
      .summary({
        profile,
        persona,
        session: {
          memories: session.memories.map((m) => ({ title: m.title, excerpt: m.excerpt })),
          turns: session.turns,
          minutes: session.minutes,
        },
      })
      .then((p) => {
        if (alive) setReflection(p);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const first = firstNameOf(profile.name);
  const total = (profile.memories || []).length;
  const stats = [
    {
      num: session.memories.length,
      label: session.memories.length === 1 ? 'Memory captured' : 'Memories captured',
    },
    { num: session.turns, label: 'Questions answered' },
    { num: session.minutes + 'm', label: 'Time together' },
    { num: total, label: 'In your journal' },
  ];

  return (
    <div className="page page--wide">
      <section className="sum-hero rise">
        <div
          style={{ position: 'absolute', right: -10, top: -50, width: 240, height: 240, opacity: 0.55 }}
          aria-hidden="true"
        >
          <Bloom color="var(--bloom-a)" r={38} seed={5} />
        </div>
        <div style={{ display: 'flex', gap: 44, alignItems: 'center', position: 'relative' }}>
          <div style={{ flex: '0 0 50%', minWidth: 0 }}>
            <div className="sum-hero__check">
              <Icon name="spark" size={24} />
            </div>
            <h1 className="sum-hero__title">
              Beautifully done, <em>{first}.</em>
            </h1>
            <p className="sum-hero__sub">
              {session.memories.length
                ? `You shared ${session.memories.length} memor${session.memories.length === 1 ? 'y' : 'ies'} with ${persona.name} today. Each one is saved, in your own words, ready for your family.`
                : `Thank you for sitting down with ${persona.name}. Come back any time — every story matters, big or small.`}
            </p>
            <div className="sum-hero__stats">
              {stats.map((st, i) => (
                <div key={i}>
                  <div className="sum-stat__num">{st.num}</div>
                  <div className="sum-stat__label">{st.label}</div>
                </div>
              ))}
            </div>
            <div className="sum-actions">
              <button className="btn btn--primary" onClick={() => navigate('/interview')}>
                <Icon name="mic" size={16} /> Keep going
              </button>
              <button className="btn btn--ghost" onClick={() => navigate('/home')}>
                <Icon name="home" size={15} /> Back home
              </button>
            </div>
          </div>
          <div style={{ flex: '0 0 calc(50% - 44px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="sum-photo-frame">
            <div className="sum-photo-frame__border">
              <div className="sum-photo-frame__mat">
                {profile.photo ? (
                  <img
                    className="sum-photo-frame__photo"
                    src={profile.photo}
                    alt={profile.name}
                    draggable={false}
                  />
                ) : (
                  <div className="sum-photo-frame__initials">
                    {profile.name
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {(reflection || (session.noticed && session.noticed.length > 0)) && (
        <section style={{ marginTop: 28, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {reflection && (
            <div className="panel rise" style={{ flex: 7, minWidth: 0 }}>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                A reflection from {persona.name} · AI-generated
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 19,
                  lineHeight: 1.6,
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                {reflection}
              </p>
            </div>
          )}
          {session.noticed && session.noticed.length > 0 && (
            <div className="panel rise" style={{ flex: 3, minWidth: 0 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Gathered along the way</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 14 }}>
                Names, places & moments
              </div>
              <div className="noticed-chips">
                {session.noticed.map((n, i) => (
                  <span className="noticed-chip" key={i}>
                    <Icon
                      name={n.kind === 'year' ? 'calendar' : n.kind === 'place' ? 'pin' : 'people'}
                      size={13}
                    />{' '}
                    {n.text}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {session.memories.length ? (
        <section style={{ marginTop: 36 }}>
          <SectionHead eyebrow="Freshly woven" title="Captured this session" />
          <div className="grid-cards">
            {session.memories.map((c) => (
              <MemoryCard key={c.id} c={c} onClick={() => navigate(`/memories/${c.id}`)} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
