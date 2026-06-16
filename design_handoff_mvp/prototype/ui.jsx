// ui.jsx — icons + shared chrome (Sidebar, TopBar, MemoryCard, helpers)

/* ---------- line icons (stroke, 1.6) ---------- */
const ICONS = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20h14V9.5M9.5 20v-6h5v6',
  interview: 'M12 3a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4ZM5 11a7 7 0 0 0 14 0M12 18v3',
  timeline: 'M12 3v18M12 6.5h7M12 12h-7M12 17.5h5M19 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM8 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM17 17.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z',
  canvas: 'M4 5.5A1.5 1.5 0 0 1 5.5 4h5A1.5 1.5 0 0 1 12 5.5v5A1.5 1.5 0 0 1 10.5 12h-5A1.5 1.5 0 0 1 4 10.5v-5ZM14 6.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0ZM14 14h6v6h-6zM4 15.5A1.5 1.5 0 0 1 5.5 14h3A1.5 1.5 0 0 1 10 15.5v3A1.5 1.5 0 0 1 8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3Z',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14ZM20 20l-4-4',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0',
  people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 19a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M21 18.5a5.5 5.5 0 0 0-4-5',
  heart: 'M12 20s-7-4.5-9.2-8.2C1.2 8.9 2.5 5.5 5.7 5.5c1.9 0 3.1 1.1 3.8 2.2.7-1.1 1.9-2.2 3.8-2.2 3.2 0 4.5 3.4 2.9 6.3C19 15.5 12 20 12 20Z',
  mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM6 11a6 6 0 0 0 12 0M12 17v3',
  pause: 'M9 5v14M15 5v14',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  spark: 'M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3Z',
  pin: 'M12 21s-6-5.7-6-10a6 6 0 1 1 12 0c0 4.3-6 10-6 10ZM12 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z',
  calendar: 'M5 6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6ZM5 9.5h14M8.5 3.5v3M15.5 3.5v3',
  plus: 'M12 5v14M5 12h14',
  play: 'M7 5l11 7-11 7V5Z',
  quote: 'M9 7H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v3M19 7h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v3',
  chev: 'M6 9l6 6 6-6',
  check: 'M5 12.5l4.5 4.5L19 7',
};

function Icon({ name, size = 20, className = '', style }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
         style={style} aria-hidden="true">
      <path d={ICONS[name] || ''} />
    </svg>
  );
}

/* ---------- Sidebar ---------- */
function Sidebar({ active, onNav, onStart }) {
  const D = window.DATA;
  const items = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'interview', label: 'Interview', icon: 'interview', count: 'live' },
    { id: 'timeline', label: 'Timeline', icon: 'timeline', count: D.stats?.stories },
    { id: 'canvas', label: 'Memory Canvas', icon: 'canvas' },
    { id: 'search', label: 'Search', icon: 'search' },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand__mark">
          <Icon name="quote" size={20} />
        </div>
        <div className="brand__name">Memory Capture<small>AI Companion</small></div>
      </div>

      <nav className="nav">
        <div className="nav__label">Your Journal</div>
        {items.map((it) => (
          <div key={it.id} className={'nav__item' + (active === it.id ? ' is-active' : '')}
               onClick={() => onNav(it.id)}>
            <Icon name={it.icon} className="nav__icon" />
            <span>{it.label}</span>
            {it.count === 'live'
              ? <span className="nav__count" style={{ color: 'var(--accent)' }}>●</span>
              : it.count ? <span className="nav__count">{it.count}</span> : null}
          </div>
        ))}
      </nav>

      <div className="sidebar__spacer" />

      <div className="side-cta" onClick={onStart}>
        <div className="side-cta__bloom"><Bloom color="#fff" r={42} seed={4} opacity={0.5} /></div>
        <div className="side-cta__title">Continue your story</div>
        <div className="side-cta__sub">3 prompts waiting from your last session</div>
        <div className="side-cta__btn"><Icon name="mic" size={14} /> Resume interview</div>
      </div>

      <hr className="divider" style={{ margin: '4px 4px 10px' }} />

      <div className="side-profile" onClick={() => onNav('profile')}>
        <div className="topbar__avatar" style={{
          width: 36, height: 36,
          background: 'radial-gradient(120% 120% at 30% 20%, var(--bloom-b), var(--accent-3))',
          display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
          {D.user.initials}
        </div>
        <div>
          <div className="side-profile__name">{D.user.name}</div>
          <div className="side-profile__meta">Journal · {D.user.journalAge} in</div>
        </div>
      </div>
    </aside>
  );
}

/* ---------- TopBar ---------- */
function TopBar({ eyebrow, title, onSearch }) {
  const D = window.DATA;
  return (
    <div className="topbar">
      <div>
        <div className="topbar__eyebrow">{eyebrow}</div>
        <div className="topbar__title">{title}</div>
      </div>
      <div className="topbar__search" onClick={onSearch}>
        <Icon name="search" size={16} />
        <span>Ask your memories anything…</span>
      </div>
      <div className="topbar__avatar" style={{
        background: 'radial-gradient(120% 120% at 30% 20%, var(--bloom-b), var(--accent-3))',
        display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
        {D.user.initials}
      </div>
    </div>
  );
}

/* ---------- MemoryCard ---------- */
function MemoryCard({ c, onClick }) {
  return (
    <div className="mcard rise" onClick={onClick}>
      <div className="mcard__art">
        <WatercolorArt palette={c.palette} seed={c.id.length + c.era.charCodeAt(0)} motif={c.motif} />
        <div className="mcard__era">{c.era}</div>
        {c.fav ? <div className="mcard__fav"><Icon name="heart" size={15} /></div> : null}
      </div>
      <div className="mcard__body">
        <div className="mcard__title">{c.title}</div>
        <div className="mcard__excerpt">{c.excerpt}</div>
        <div className="mcard__meta">
          <span className="mcard__tag"><span className="chip__dot" style={{ background: 'var(--accent-3)' }} />{c.theme}</span>
        </div>
      </div>
    </div>
  );
}

/* small labelled section heading */
function SectionHead({ eyebrow, title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
      <div>
        {eyebrow ? <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div> : null}
        <h2 className="display" style={{ fontSize: 25, margin: 0 }}>{title}</h2>
      </div>
      {action ? <div className="chip" onClick={onAction}>{action}<Icon name="arrow" size={14} /></div> : null}
    </div>
  );
}

Object.assign(window, { Icon, ICONS, Sidebar, TopBar, MemoryCard, SectionHead });
