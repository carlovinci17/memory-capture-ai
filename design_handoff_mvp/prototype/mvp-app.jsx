// mvp-app.jsx — Phase-1 MVP shell: multi-profile state, persistence, routing, chrome.
// Screens kept: Create Profile · Home · Interview · Profile · Summary.
// Phase-2 (Timeline, Memory Canvas, Search, relationship map) intentionally removed.

const { useState, useEffect, useRef, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mood": "terracotta",
  "type": "editorial",
  "texture": "medium"
}/*EDITMODE-END*/;

const STORE_KEY = 'mcap_mvp_store_v1';
const LEGACY_KEY = 'mcap_mvp_profile_v1';

// Store shape: { profiles: [ {id, name, ...} ], activeId }
function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (s && Array.isArray(s.profiles)) return s;
  } catch (e) {}
  // migrate a single legacy profile if present
  try {
    const old = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
    if (old && old.name) {
      const id = old.id || ('p' + Date.now());
      return { profiles: [{ ...old, id }], activeId: id };
    }
  } catch (e) {}
  return { profiles: [], activeId: null };
}
function persistStore(s) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {} }
function newId() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

/* ---------- small shared helpers ---------- */
function firstNameOf(name) { return (name || '').trim().split(/\s+/)[0] || 'friend'; }
function initialsOf(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '🙂';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

/* round avatar: photo if present, else gradient wash + initials */
function Avatar({ profile, size = 38, radius = '50%' }) {
  const style = { width: size, height: size, borderRadius: radius, flex: 'none', position: 'relative', overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)', border: '2px solid var(--surface)' };
  if (profile && profile.photo) {
    return <div style={style}><img src={profile.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>;
  }
  return (
    <div style={{ ...style, display: 'grid', placeItems: 'center', color: '#fff',
      fontWeight: 700, fontSize: size * 0.36,
      background: 'radial-gradient(120% 120% at 30% 20%, var(--bloom-b), var(--accent-3))' }}>
      {initialsOf(profile && profile.name)}
    </div>
  );
}

/* ---------- Sidebar (cut down) ---------- */
function MvpSidebar({ active, onNav }) {
  const items = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'interview', label: 'Interview', icon: 'interview' },
    { id: 'profiles', label: 'Profiles', icon: 'profile' },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand__mark"><Icon name="quote" size={20} /></div>
        <div className="brand__name">Memory Capture AI</div>
      </div>

      <nav className="nav">
        <div className="nav__label">Your Journal</div>
        {items.map((it) => (
          <div key={it.id} className={'nav__item' + (active === it.id ? ' is-active' : '')}
               onClick={() => onNav(it.id)}>
            <Icon name={it.icon} className="nav__icon" />
            <span>{it.label}</span>
            {it.id === 'interview' && active === 'interview'
              ? <span className="nav__count" style={{ color: 'var(--accent)' }}>●</span> : null}
          </div>
        ))}
      </nav>

      <div className="sidebar__spacer" />
    </aside>
  );
}

/* ---------- TopBar with profile switcher ---------- */
function MvpTopBar({ eyebrow, title, profile, profiles, onSwitch, onAdd, onView }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="topbar">
      <div>
        <div className="topbar__eyebrow">{eyebrow}</div>
        <div className="topbar__title">{title}</div>
      </div>

      <div className="topbar__profile" onClick={() => setOpen((o) => !o)}>
        <div className="topbar__profile-txt">
          <div className="topbar__profile-name">{profile.name}</div>
          <div className="topbar__profile-meta">{(profile.memories || []).length} memories captured</div>
        </div>
        <Avatar profile={profile} size={40} />
        <Icon name="chev" size={15} className="topbar__profile-chev" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </div>

      {open && (
        <React.Fragment>
          <div className="pm-backdrop" onClick={() => setOpen(false)} />
          <div className="pm-menu">
            <div className="pm-label">Storytellers</div>
            {profiles.map((p) => (
              <div key={p.id} className={'pm-item' + (p.id === profile.id ? ' is-active' : '')}
                   onClick={() => { setOpen(false); p.id === profile.id ? onView() : onSwitch(p.id); }}>
                <Avatar profile={p} size={36} />
                <div className="pm-item__txt">
                  <div className="pm-item__name">{p.name}</div>
                  <div className="pm-item__meta">{(p.memories || []).length} memories{p.id === profile.id ? ' · current' : ''}</div>
                </div>
                {p.id === profile.id ? <span className="pm-check"><Icon name="check" size={14} /></span> : null}
              </div>
            ))}
            <div className="pm-divider" />
            <div className="pm-add" onClick={() => { setOpen(false); onAdd(); }}>
              <span className="pm-add__ico"><Icon name="plus" size={16} /></span> Add a new storyteller
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

const SCREEN_META = {
  home:      (p) => ({ eyebrow: todayLabel(), title: 'Your Journal' }),
  interview: (p) => ({ eyebrow: 'Live voice session', title: 'The Interview' }),
  profiles:  (p) => ({ eyebrow: 'Everyone’s stories', title: 'Profiles' }),
  profile:   (p) => ({ eyebrow: 'Storyteller', title: p.name }),
  summary:   (p) => ({ eyebrow: 'Session complete', title: 'What we captured' }),
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [store, setStore] = useState(loadStore);
  const [screen, setScreen] = useState(loadStore().profiles.length ? 'home' : 'onboarding');
  const [lastSession, setLastSession] = useState(null);

  const profiles = store.profiles;
  const profile = profiles.find((p) => p.id === store.activeId) || profiles[0] || null;
  const persona = (window.DATA.personas.find((p) => p.id === (profile && profile.personaId)) || window.DATA.personas[0]);

  const go = (s) => { setScreen(s); const m = document.querySelector('.main'); if (m) m.scrollTo({ top: 0 }); window.scrollTo({ top: 0 }); };

  const writeStore = (s) => { persistStore(s); setStore(s); };

  const commitNew = (p) => {
    const id = newId();
    writeStore({ profiles: [...profiles, { ...p, id }], activeId: id });
  };
  const commitEdit = (p) => {
    writeStore({ ...store, profiles: profiles.map((x) => (x.id === profile.id ? { ...p, id: profile.id } : x)) });
  };
  const switchProfile = (id) => { writeStore({ ...store, activeId: id }); go('home'); };
  const openProfile = (id) => { writeStore({ ...store, activeId: id }); go('profile'); };
  const changePersona = (id) => writeStore({ ...store, profiles: profiles.map((x) => (x.id === profile.id ? { ...x, personaId: id } : x)) });

  const deleteProfile = () => {
    const remaining = profiles.filter((x) => x.id !== profile.id);
    writeStore({ profiles: remaining, activeId: remaining.length ? remaining[0].id : null });
    setLastSession(null);
    setScreen(remaining.length ? 'profile' : 'onboarding');
    window.scrollTo({ top: 0 });
  };

  const finishSession = (session) => {
    const updated = {
      ...profile,
      sessions: ((profile.sessions) || 0) + 1,
      memories: [...(session.memories || []), ...(profile.memories || [])],
    };
    writeStore({ ...store, profiles: profiles.map((x) => (x.id === profile.id ? updated : x)) });
    setLastSession(session);
    go('summary');
  };

  const tweaksUI = (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Color mood" />
      <TweakRadio label="Palette" value={t.mood}
                  options={['terracotta', 'sage', 'lavender', 'honey']}
                  onChange={(v) => setTweak('mood', v)} />
      <TweakSection label="Typography" />
      <TweakRadio label="Headlines" value={t.type}
                  options={['editorial', 'humanist']}
                  onChange={(v) => setTweak('type', v)} />
      <TweakSection label="Watercolor texture" />
      <TweakRadio label="Intensity" value={t.texture}
                  options={['low', 'medium', 'high']}
                  onChange={(v) => setTweak('texture', v)} />
    </TweaksPanel>
  );

  // ---- Onboarding (create new) / Edit: full-screen, no app chrome ----
  if (screen === 'onboarding' || screen === 'edit' || !profile) {
    const editing = screen === 'edit' && profile;
    const hasProfiles = profiles.length > 0;
    return (
      <div className="ob-stage" data-mood={t.mood} data-type={t.type} data-texture={t.texture}>
        <WatercolorDefs />
        <OnboardingScreen
          mode={editing ? 'edit' : 'create'}
          isFirst={!hasProfiles}
          initial={editing ? profile : null}
          onCancel={editing ? () => go('profile') : (hasProfiles ? () => go('home') : null)}
          onDelete={editing ? deleteProfile : null}
          onComplete={(p) => { editing ? commitEdit(p) : commitNew(p); go(editing ? 'profile' : 'home'); }} />
        {tweaksUI}
      </div>
    );
  }

  const meta = SCREEN_META[screen](profile);

  return (
    <div className="app" data-mood={t.mood} data-type={t.type} data-texture={t.texture}>
      <WatercolorDefs />
      <MvpSidebar active={screen === 'profile' ? 'profiles' : screen} onNav={go} />

      <div className="main">
        <MvpTopBar eyebrow={meta.eyebrow} title={meta.title} profile={profile}
                   profiles={profiles} onSwitch={switchProfile} onAdd={() => go('onboarding')} onView={() => go('profile')} />
        {screen === 'home'      && <HomeScreen profile={profile} persona={persona} go={go} />}
        {screen === 'interview' && <InterviewScreen profile={profile} persona={persona} onEnd={finishSession} onChangePersona={changePersona} />}
        {screen === 'profiles'  && <ProfilesScreen profiles={profiles} activeId={profile.id} onOpen={openProfile} onAdd={() => go('onboarding')} />}
        {screen === 'profile'   && <ProfileScreen profile={profile} persona={persona} go={go} onDelete={deleteProfile} onBack={() => go('profiles')} />}
        {screen === 'summary'   && <SummaryScreen session={lastSession} profile={profile} persona={persona} go={go} />}
      </div>

      {tweaksUI}
    </div>
  );
}

Object.assign(window, { firstNameOf, initialsOf, greetingWord, todayLabel, Avatar });

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
