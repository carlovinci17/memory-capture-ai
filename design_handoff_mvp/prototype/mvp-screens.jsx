// mvp-screens.jsx — Onboarding (Create Profile) · Home · Profile · Summary

/* ============================================================
   ONBOARDING — single-page create / edit profile
   ============================================================ */
function OnboardingScreen({ mode = 'create', isFirst = true, initial, onComplete, onCancel, onDelete }) {
  const editing = mode === 'edit';
  const adding = !editing && !isFirst;   // creating an additional storyteller
  const [name, setName] = useState(initial ? initial.name : '');
  const [yearBorn, setYearBorn] = useState(initial ? (initial.yearBorn || '') : '');
  const [place, setPlace] = useState(initial ? (initial.birthplace || '') : '');
  const [bio, setBio] = useState(initial ? (initial.bio || '') : '');
  const [photo, setPhoto] = useState(initial ? (initial.photo || null) : null);
  const [personaId, setPersonaId] = useState(initial ? initial.personaId : window.DATA.personas[0].id);
  const fileRef = useRef(null);

  const onPickFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(f);
  };

  const canSubmit = name.trim().length > 0;
  const submit = () => {
    if (!canSubmit) return;
    onComplete({
      ...(initial || {}),
      name: name.trim(),
      yearBorn: String(yearBorn).trim(),
      birthplace: place.trim(),
      bio: bio.trim(),
      photo,
      personaId,
      sessions: (initial && initial.sessions) || 0,
      memories: (initial && initial.memories) || [],
      createdAt: (initial && initial.createdAt) || Date.now(),
    });
  };

  const steps = [
    { icon: 'profile', t: 'Tell us who you are', d: 'A name, a place, a few words — that’s all we need to begin.' },
    { icon: 'mic', t: 'Sit down for a chat', d: 'Your chosen companion asks gentle questions. You simply talk.' },
    { icon: 'spark', t: 'Watch your story take shape', d: 'Every memory you share is gathered and kept, in your own words.' },
  ];

  return (
    <div className="ob">
      {/* intro */}
      <div className="ob__intro">
        <div className="ob__bloom"><Bloom color="var(--bloom-a)" r={40} seed={3} /></div>
        <div className="ob__brand">
          <div className="brand__mark"><Icon name="quote" size={22} /></div>
          <div className="ob__brand-name">Memory Capture AI</div>
        </div>
        <div className="ob__greet">{editing ? 'A few refinements' : adding ? 'A new storyteller' : 'Welcome'}</div>
        <h1 className="ob__title">{editing ? <span>Update your <em>profile</em></span> : adding ? <span>Add a new <em>storyteller</em></span> : <span>Let’s begin your <em>story</em></span>}</h1>
        <p className="ob__lead">
          {editing
            ? 'Change anything below — your details flow through to your home, your interviews, and everything you’ve captured.'
            : adding
            ? 'Set up another person’s journal. Each storyteller keeps their own memories, interviews and interviewer — switch between them any time from the top-right.'
            : 'Memory Capture is a living journal of your life. A warm AI companion interviews you, and turns what you share into something your family will treasure.'}
        </p>
        <div className="ob__steps">
          {steps.map((s, i) => (
            <div className="ob__step" key={i}>
              <div className="ob__step-ico"><Icon name={s.icon} size={18} /></div>
              <div>
                <div className="ob__step-t">{s.t}</div>
                <div className="ob__step-d">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* form */}
      <div className="ob__panel rise">
        <div className="ob__panel-head">
          <div className="eyebrow ob__panel-eyebrow">{editing ? 'Edit profile' : adding ? 'New storyteller' : 'Create your profile'}</div>
          <div className="ob__panel-title">{editing ? 'Your details' : 'A little about you'}</div>
        </div>

        {/* photo */}
        <div className="ob-field">
          <div className="ob-photo">
            <div className="ob-photo__drop" onClick={() => fileRef.current && fileRef.current.click()}>
              {photo
                ? <img src={photo} alt="Your photo" />
                : <React.Fragment>
                    <WatercolorArt seed={6} palette={['var(--bloom-b)', 'var(--bloom-a)', 'var(--bloom-c)']} />
                    <div className="ob-photo__init">{name.trim() ? initialsOf(name) : <Icon name="plus" size={24} />}</div>
                  </React.Fragment>}
              <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} style={{ display: 'none' }} />
            </div>
            <div>
              <div className="ob-photo__txt-t">A photo of you <span style={{ color: 'var(--ink-4)', fontWeight: 500 }}>· optional</span></div>
              <div className="ob-photo__txt-d">It appears across your journal. A recent or beloved old one — both are perfect.</div>
              <span className="ob-photo__link" onClick={() => fileRef.current && fileRef.current.click()}>
                {photo ? 'Change photo' : 'Upload a photo'}
              </span>
              {photo ? <span className="ob-photo__link" style={{ marginLeft: 14, color: 'var(--ink-3)' }} onClick={() => setPhoto(null)}>Remove</span> : null}
            </div>
          </div>
        </div>

        {/* name */}
        <div className="ob-field">
          <label className="ob-label">Your name</label>
          <input className="ob-input" value={name} onChange={(e) => setName(e.target.value)}
                 placeholder="e.g. Eleanor Marchetti" autoFocus={!editing} />
        </div>

        {/* year + place */}
        <div className="ob-field ob-field--row">
          <div>
            <label className="ob-label">Year you were born <span className="opt">optional</span></label>
            <input className="ob-input" type="text" inputMode="numeric" value={yearBorn}
                   onChange={(e) => setYearBorn(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                   placeholder="1948" />
          </div>
          <div>
            <label className="ob-label">Where you’re from <span className="opt">optional</span></label>
            <input className="ob-input" value={place} onChange={(e) => setPlace(e.target.value)}
                   placeholder="Camogli, Italy" />
          </div>
        </div>

        {/* bio */}
        <div className="ob-field">
          <label className="ob-label">A few words about you <span className="opt">optional</span></label>
          <textarea className="ob-textarea" value={bio} onChange={(e) => setBio(e.target.value)}
                    placeholder="Daughter of a fisherman, taught Italian for thirty-one years, mother of two…" />
          <div className="ob-hint">This becomes the opening line of your story. You can change it any time.</div>
        </div>

        {/* persona */}
        <div className="ob-field">
          <label className="ob-label">Choose your interviewer</label>
          <div className="persona-grid">
            {window.DATA.personas.map((p) => (
              <button type="button" key={p.id}
                      className={'persona-card' + (p.id === personaId ? ' is-active' : '')}
                      onClick={() => setPersonaId(p.id)}>
                <div className="persona-card__check"><Icon name="arrow" size={12} /></div>
                <div className="persona-card__top">
                  <div className="persona-card__av" style={{ background: `radial-gradient(120% 120% at 30% 20%, var(--bloom-b), ${p.accent})` }}>{p.glyph}</div>
                  <div className="persona-card__name">{p.name}</div>
                </div>
                <div className="persona-card__blurb">{p.blurb}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="ob__actions">
          <button className="btn btn--primary" disabled={!canSubmit} onClick={submit}>
            <Icon name={editing ? 'arrow' : 'spark'} size={16} /> {editing ? 'Save changes' : adding ? 'Create journal' : 'Create my journal'}
          </button>
          {onCancel ? <span className="ob__cancel" onClick={onCancel}>Cancel</span> : null}
          {!editing && !canSubmit ? <span className="ob-hint" style={{ margin: 0 }}>Add your name to continue</span> : null}
          {editing && onDelete ? (
            <span className="btn-delete" style={{ marginLeft: 'auto' }}
                  onClick={() => { if (window.confirm('Delete this profile and everything you’ve captured? This can’t be undone.')) onDelete(); }}>
              Delete profile
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HOME — simple, warm welcome driven by the real profile
   ============================================================ */
function HomeScreen({ profile, persona, go }) {
  const first = firstNameOf(profile.name);
  const memories = profile.memories || [];
  const sessions = profile.sessions || 0;

  return (
    <div className="page page--wide">
      <section className="hero rise">
        <div className="hero__blooms" aria-hidden="true">
          <div className="b" style={{ right: '-4%', top: '-30%', width: 360, height: 360 }}><Bloom color="var(--bloom-a)" r={40} seed={3} /></div>
          <div className="b bloom--optional" style={{ right: '16%', bottom: '-44%', width: 300, height: 300 }}><Bloom color="var(--bloom-b)" r={38} seed={6} /></div>
        </div>
        <div className="hero__inner">
          <div className="hero__greet">{greetingWord()}, {first}</div>
          <h1 className="hero__title">
            {sessions ? <span>Where shall we<br /> continue today?</span> : <span>Your story<br /> starts here.</span>}
          </h1>
          <p className="hero__sub">
            {sessions
              ? `You’ve recorded ${sessions} session${sessions > 1 ? 's' : ''} and gathered ${memories.length} memor${memories.length === 1 ? 'y' : 'ies'} so far. ${persona.name} is ready whenever you are.`
              : `Sit somewhere comfortable. ${persona.name} will ask a few gentle questions, and turn your answers into a journal of your life — no typing skills required.`}
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary" onClick={() => go('interview')}>
              <Icon name="mic" size={17} /> {sessions ? 'Continue your story' : 'Start your first interview'}
            </button>
            <button className="btn btn--ghost" onClick={() => go('profile')}>
              <Icon name="profile" size={16} /> View your profile
            </button>
          </div>
        </div>
      </section>

      {/* today's invitation */}
      <section className="prompt-card rise" style={{ marginTop: 22, animationDelay: '.05s' }}>
        <div className="persona-card__av" style={{ width: 46, height: 46, fontSize: 21,
          background: `radial-gradient(120% 120% at 30% 20%, var(--bloom-b), ${persona.accent})` }}>{persona.glyph}</div>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ color: 'var(--ink-3)' }}>Today’s invitation · {persona.name}</div>
          <div className="prompt-card__q" style={{ marginTop: 6 }}>“{persona.sample}”</div>
          <div className="prompt-card__meta">
            <Icon name="spark" size={14} style={{ color: 'var(--accent)' }} />
            <span>A gentle place to begin — there’s no wrong answer.</span>
          </div>
        </div>
        <button className="btn btn--primary" style={{ alignSelf: 'center' }} onClick={() => go('interview')}>
          Answer <Icon name="arrow" size={15} />
        </button>
      </section>

      {/* recently captured (real, from past sessions) */}
      <section style={{ marginTop: 40 }}>
        <SectionHead eyebrow={memories.length ? 'In your own words' : 'Nothing here yet'} title="Recently captured" />
        {memories.length ? (
          <div className="grid-cards">
            {memories.slice(0, 3).map((c) => <MemoryCard key={c.id} c={c} onClick={() => go('interview')} />)}
          </div>
        ) : (
          <div className="rail__empty" style={{ maxWidth: 560, textAlign: 'left', padding: '22px 24px' }}>
            Your memories will gather here as you talk. Start your first interview and watch the first card appear.
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================================================
   PROFILES — list of all storytellers + add new
   ============================================================ */
function ProfilesScreen({ profiles, activeId, onOpen, onAdd }) {
  return (
    <div className="page page--wide">
      <SectionHead eyebrow="Everyone’s stories" title="Profiles" />
      <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.6, margin: '-8px 0 26px', maxWidth: 600 }}>
        Each storyteller keeps their own living journal — memories, interviews and interviewer. Open one to continue their story, or set up someone new.
      </p>

      <div className="profiles-grid">
        {profiles.map((p) => {
          const facts = [p.yearBorn ? 'Born ' + p.yearBorn : null, p.birthplace].filter(Boolean).join(' · ');
          return (
            <div className="profile-tile rise" key={p.id} onClick={() => onOpen(p.id)}>
              <div className="profile-tile__top">
                <Avatar profile={p} size={56} radius="18px" />
                {p.id === activeId ? <span className="profile-tile__badge"><Icon name="check" size={12} /> Current</span> : null}
              </div>
              <div className="profile-tile__name">{p.name}</div>
              <div className="profile-tile__meta">{facts || 'No details yet'}</div>
              <div className="profile-tile__stats">
                <span><strong>{(p.memories || []).length}</strong> memories</span>
                <span><strong>{p.sessions || 0}</strong> session{(p.sessions || 0) === 1 ? '' : 's'}</span>
              </div>
              <div className="profile-tile__open">Open journal <Icon name="arrow" size={14} /></div>
            </div>
          );
        })}

        <button className="profile-tile profile-tile--add rise" onClick={onAdd}>
          <div className="profile-tile__addico"><Icon name="plus" size={26} /></div>
          <div className="profile-tile__name">Add a storyteller</div>
          <div className="profile-tile__meta">Start a new living journal for someone else.</div>
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   PROFILE — simple view of what was created
   ============================================================ */
function ProfileScreen({ profile, persona, go, onDelete, onBack }) {
  const memories = profile.memories || [];
  const confirmDelete = () => {
    if (window.confirm('Delete this profile and everything you’ve captured? This can’t be undone.')) onDelete();
  };
  const facts = [
    profile.yearBorn ? { k: 'Born', v: profile.yearBorn } : null,
    profile.birthplace ? { k: 'From', v: profile.birthplace } : null,
    { k: 'Memories', v: `${memories.length} captured` },
    { k: 'Sessions', v: `${profile.sessions || 0} recorded` },
  ].filter(Boolean);

  return (
    <div className="page page--wide">
      <div className="chip" onClick={onBack} style={{ marginBottom: 18 }}>
        <Icon name="arrow" size={14} style={{ transform: 'rotate(180deg)' }} /> All profiles
      </div>
      <section className="profile-hero rise">
        <div style={{ position: 'absolute', right: -20, top: -50, width: 240, height: 240, opacity: .6 }} aria-hidden="true"><Bloom color="var(--bloom-b)" r={38} seed={6} /></div>
        <div className="profile-portrait">
          {profile.photo
            ? <img className="profile-photo-img" src={profile.photo} alt={profile.name} />
            : <React.Fragment>
                <WatercolorArt seed={8} palette={['var(--bloom-b)', 'var(--bloom-a)', 'var(--bloom-c)']} />
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontSize: 52, color: '#fff', textShadow: '0 2px 8px rgba(52,41,31,.3)' }}>{initialsOf(profile.name)}</div>
              </React.Fragment>}
        </div>
        <div style={{ position: 'relative' }}>
          <div className="eyebrow">A life in progress</div>
          <h1 className="profile-name" style={{ marginTop: 6 }}>{profile.name}</h1>
          <p className="profile-sub">{profile.bio || 'Your story is just beginning. Start an interview and your words will fill this space.'}</p>
          <div className="profile-facts">
            {facts.map((f) => (
              <div key={f.k} className="profile-fact">
                <div className="profile-fact__k">{f.k}</div>
                <div className="profile-fact__v">{f.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn--primary" onClick={() => go('interview')}><Icon name="mic" size={16} /> Start a session</button>
            <button className="btn btn--ghost" onClick={() => go('edit')}><Icon name="profile" size={15} /> Edit profile</button>
            <span className="btn-delete" onClick={confirmDelete} style={{ marginLeft: 'auto' }}>Delete profile</span>
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 24, alignItems: 'start' }}>
        {/* interviewer */}
        <div className="panel rise" style={{ animationDelay: '.05s' }}>
          <SectionHead eyebrow="Who interviews you" title="Your interviewer" />
          <div className="persona-row" style={{ borderBottom: 'none', paddingTop: 4 }}>
            <div className="persona-row__av" style={{ background: `radial-gradient(120% 120% at 30% 20%, var(--bloom-b), ${persona.accent})` }}>{persona.glyph}</div>
            <div style={{ flex: 1 }}>
              <div className="persona-row__name">{persona.name}</div>
              <div className="persona-row__blurb">{persona.blurb}</div>
            </div>
          </div>
          <div className="rail__empty" style={{ textAlign: 'left', marginTop: 8 }}>
            “{persona.sample}”
          </div>
          <button className="btn btn--ghost" style={{ marginTop: 16 }} onClick={() => go('edit')}>
            <Icon name="arrow" size={15} /> Change interviewer
          </button>
        </div>

        {/* captured memories */}
        <div className="panel rise" style={{ animationDelay: '.1s' }}>
          <SectionHead eyebrow="In your own words" title={`Memories (${memories.length})`} />
          {memories.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {memories.slice(0, 4).map((c) => (
                <div key={c.id} className="persona-row" style={{ paddingTop: 6, paddingBottom: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flex: 'none', position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
                    <WatercolorArt seed={(c.title || '').length + 3} palette={c.palette || ['var(--bloom-a)', 'var(--bloom-c)', 'var(--bloom-d)']} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="persona-row__name" style={{ fontSize: 16 }}>{c.title}</div>
                    <div className="persona-row__blurb" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.excerpt}</div>
                  </div>
                  <span className="mcard__tag">{c.era}</span>
                </div>
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

/* ============================================================
   SUMMARY — what was captured this session
   ============================================================ */
function SummaryScreen({ session, profile, persona, go }) {
  const s = session || { memories: [], noticed: [], turns: 0, minutes: 0 };
  const first = firstNameOf(profile.name);
  const total = (profile.memories || []).length;
  const stats = [
    { num: s.memories.length, label: s.memories.length === 1 ? 'Memory captured' : 'Memories captured' },
    { num: s.turns, label: 'Questions answered' },
    { num: s.minutes + 'm', label: 'Time together' },
    { num: total, label: 'In your journal' },
  ];

  return (
    <div className="page page--wide">
      <section className="sum-hero rise">
        <div style={{ position: 'absolute', right: -10, top: -50, width: 240, height: 240, opacity: .55 }} aria-hidden="true"><Bloom color="var(--bloom-a)" r={38} seed={5} /></div>
        <div className="sum-hero__check"><Icon name="spark" size={24} /></div>
        <h1 className="sum-hero__title">Beautifully done, <em>{first}.</em></h1>
        <p className="sum-hero__sub">
          {s.memories.length
            ? `You shared ${s.memories.length} memor${s.memories.length === 1 ? 'y' : 'ies'} with ${persona.name} today. Each one is saved, in your own words, ready for your family.`
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
          <button className="btn btn--primary" onClick={() => go('interview')}><Icon name="mic" size={16} /> Keep going</button>
          <button className="btn btn--ghost" onClick={() => go('home')}><Icon name="home" size={15} /> Back home</button>
        </div>
      </section>

      {s.memories.length ? (
        <section style={{ marginTop: 36 }}>
          <SectionHead eyebrow="Freshly woven" title="Captured this session" />
          <div className="grid-cards">
            {s.memories.map((c) => <MemoryCard key={c.id} c={c} onClick={() => go('profile')} />)}
          </div>
        </section>
      ) : null}

      {s.noticed && s.noticed.length ? (
        <section style={{ marginTop: 34 }}>
          <SectionHead eyebrow="Gathered along the way" title="Names, places & moments noticed" />
          <div className="noticed-chips">
            {s.noticed.map((n, i) => (
              <span className="noticed-chip" key={i}>
                <Icon name={n.kind === 'year' ? 'calendar' : n.kind === 'place' ? 'pin' : 'people'} size={13} /> {n.text}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

Object.assign(window, { OnboardingScreen, HomeScreen, ProfilesScreen, ProfileScreen, SummaryScreen });
