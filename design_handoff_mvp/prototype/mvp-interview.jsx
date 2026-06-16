// mvp-interview.jsx — interactive interview (MVP) with 3 conversation modes.
//   1. AI asks      — the companion drives the conversation (default)
//   2. Manual       — a family member takes over and asks (voice or text)
//   3. Help me      — the AI suggests questions for the family member to ask
// Real: what the storyteller types becomes captured memories + live extraction.

/* ---- helpers: turn spoken/typed answers into a memory card + noticed bits ---- */
const STOPWORDS = new Set(['I', 'A', 'The', 'My', 'We', 'It', 'And', 'But', 'When', 'Where', 'There',
'That', 'This', 'They', 'He', 'She', 'You', 'Me', 'Then', 'So', 'No', 'Yes', 'Oh', 'Well', 'Her', 'His',
'Our', 'Their', 'In', 'On', 'At', 'To', 'Of', 'For', 'With', 'Mr', 'Mrs', 'Ms', 'Dr', 'It’s', "It's"]);

const FOLLOWUPS = [
'That’s wonderful. Who else was there with you in that memory?',
'Tell me more — what did that feel like, in the moment?',
'Beautiful. And what happened next?',
'I can almost picture it. What sounds or smells come back to you?',
'Why do you think that one has stayed with you all these years?',
'And the people around you then — what were they like?',
'What a detail to keep. Where exactly was this?'];


const PALETTES = [
['#D98C8C', '#E2A07E', '#E8C285'],
['#7FA8B0', '#A9BB97', '#E8C285'],
['#A9BB97', '#C9B581', '#7FA8B0'],
['#D98C8C', '#C08AA0', '#A9BB97'],
['#B7C4D2', '#E2A07E', '#D98C8C']];


// warm, family-style prompts the AI offers in "Help me" mode
const QUESTION_POOL = [
'What were you like when you were my age?',
'What’s a smell or taste that takes you straight back home?',
'Who made you laugh the most when you were growing up?',
'What were Sunday afternoons like in your family?',
'What’s the bravest thing you’ve ever done?',
'What did your mother always used to say to you?',
'Is there a story about our family you think I should know?',
'What music was playing in the house when you were young?',
'If you could relive one ordinary day, which one would it be?',
'{place} — what did it look, sound and smell like back then?',
'What do you hope we remember about you?',
'What’s something you’ve never told anyone?'];


const ASKER_PRESETS = ['Grandchild', 'Daughter', 'Son', 'Friend'];

const MODES = [
{ id: 'ai', label: 'AI asks', icon: 'quote', sub: 'Fully automated — the companion asks every question and follows up on its own.' },
{ id: 'manual', label: 'Manual', icon: 'people', sub: 'You ask the questions. The companion offers optional follow-ups — use them or skip them.' }];


function titleCase(s) {return s.replace(/\b\w/g, (c) => c.toUpperCase());}

function deriveTitle(text) {
  const clean = text.replace(/\b(18|19|20)\d{2}\b/g, ' ') // drop years (shown as era)
  .replace(/[^A-Za-z\s'’]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = clean.split(' ').filter(Boolean);
  if (!words.length) return 'A new memory';
  const small = new Set(['the', 'a', 'an', 'and', 'of', 'to', 'in', 'on', 'at', 'was', 'were', 'is', 'are',
  'it', 'i', 'my', 'we', 'so', 'but', 'then', 'that', 'this', 'with', 'for', 'when', 'where', 'while',
  'would', 'could', 'should', 'had', 'have', 'has', 'did', 'do', 'as', 'by', 'from', 'about', 'me',
  'her', 'his', 'our', 'their', 'not', 'no', 'up', 'out', 'into', 'over', 'just', 'still', 'left',
  'went', 'came', 'said', 'told', 'looked']);
  const keep = words.filter((w) => !small.has(w.toLowerCase()));
  const pick = (keep.length >= 2 ? keep : words).slice(0, 4).join(' ');
  return titleCase(pick.length > 38 ? pick.slice(0, 36) + '…' : pick);
}

function extractFrom(text) {
  const years = text.match(/\b(18|19|20)\d{2}\b/g) || [];
  const names = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  sentences.forEach((sent) => {
    const toks = sent.trim().split(/\s+/);
    toks.forEach((raw, i) => {
      const w = raw.replace(/[^A-Za-z’']/g, '');
      if (i === 0) return;
      if (w.length < 3) return;
      if (!/^[A-Z][a-z’']+$/.test(w)) return;
      if (STOPWORDS.has(w)) return;
      names.push(w);
    });
  });
  return { years: [...new Set(years)], names: [...new Set(names)] };
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]];}
  return a;
}

/* ============================================================
   INTERVIEW SCREEN
   ============================================================ */
function InterviewScreen({ profile, persona, onEnd, onChangePersona }) {
  const first = firstNameOf(profile.name);
  const place = profile.birthplace || 'home';
  const personaShort = persona.name.split(' ').slice(-1)[0];

  const openingQ = profile.birthplace ?
  `It’s good to sit with you, ${first}. I’d love to start where you began — take me back to ${profile.birthplace}. What’s your earliest memory of it?` :
  `It’s good to sit with you, ${first}. Let’s begin gently — tell me about where you grew up. What’s your earliest memory of it?`;

  const [messages, setMessages] = useState([{ who: 'ai', text: openingQ }]);
  const [memories, setMemories] = useState([]);
  const [noticed, setNoticed] = useState([]);
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const [turns, setTurns] = useState(0);

  const [mode, setMode] = useState('ai'); // 'ai' | 'manual' | 'help'
  const [phase, setPhase] = useState('answer'); // 'question' | 'answer' (manual/help only)
  const [askerName, setAskerName] = useState('Family');
  const [suggestions, setSuggestions] = useState([]);
  const [listening, setListening] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const scrollRef = useRef(null);
  const fuRef = useRef(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking, suggestions]);

  const addNoticed = (incoming) => {
    setNoticed((prev) => {
      const seen = new Set(prev.map((n) => n.text.toLowerCase()));
      const next = [...prev];
      incoming.forEach((n) => {if (!seen.has(n.text.toLowerCase())) {seen.add(n.text.toLowerCase());next.push(n);}});
      return next.slice(0, 12);
    });
  };

  // build AI-suggested questions for the family member (Help me mode)
  const buildSuggestions = useCallback(() => {
    const out = [];
    const lastMe = [...messages].reverse().find((m) => m.who === 'me');
    if (lastMe) {
      const ex = extractFrom(lastMe.text);
      if (ex.names[0]) out.push(`You mentioned ${ex.names[0]} — what were they like?`);
      if (ex.names[1]) out.push(`Tell me more about ${ex.names[1]}.`);
      if (ex.years[0]) out.push(`What else do you remember from ${ex.years[0]}?`);
    }
    const sub = (q) => q.replace(/\{first\}/g, first).replace(/\{place\}/g, place);
    for (const q of shuffle(QUESTION_POOL).map(sub)) {
      if (out.length >= 3) break;
      if (!out.includes(q)) out.push(q);
    }
    return out.slice(0, 3);
  }, [messages, first, place]);

  // refresh AI follow-up suggestions whenever it's the asker's turn (Manual mode)
  useEffect(() => {
    if (mode === 'manual' && phase === 'question' && !thinking) setSuggestions(buildSuggestions());
    if (mode === 'ai') setSuggestions([]);
  }, [mode, phase, thinking, messages.length]); // eslint-disable-line

  const captureAnswer = (val) => {
    setTurns((n) => n + 1);
    if (val.length >= 14) {
      const ex = extractFrom(val);
      const era = ex.years.length ? ex.years.sort()[0] : 'Undated';
      const card = {
        id: 'm' + Date.now(),
        title: deriveTitle(val),
        excerpt: val.length > 150 ? val.slice(0, 148).trim() + '…' : val,
        era,
        palette: PALETTES[memories.length % PALETTES.length],
        theme: 'Your story',
        createdAt: Date.now()
      };
      setMemories((prev) => [...prev, card]);
      addNoticed([
      ...ex.names.map((n) => ({ kind: 'name', text: n })),
      ...ex.years.map((y) => ({ kind: 'year', text: y }))]
      );
    }
  };

  const aiFollowUp = () => {
    setThinking(true);
    setTimeout(() => {
      const q = FOLLOWUPS[fuRef.current % FOLLOWUPS.length];
      fuRef.current += 1;
      setThinking(false);
      setMessages((m) => [...m, { who: 'ai', text: q }]);
    }, 1300);
  };

  // a family member asks a question (manual / help mode)
  const askQuestion = (q) => {
    const val = (q != null ? q : text).trim();
    if (!val || thinking) return;
    setText('');
    setListening(false);
    setMessages((m) => [...m, { who: 'asker', text: val, asker: askerName }]);
    setPhase('answer');
  };

  // the storyteller answers
  const answer = () => {
    const val = text.trim();
    if (!val || thinking) return;
    setText('');
    setListening(false);
    setMessages((m) => [...m, { who: 'me', text: val }]);
    captureAnswer(val);
    if (mode === 'ai') aiFollowUp();else
    setPhase('question');
  };

  const send = () => {
    if (mode !== 'ai' && phase === 'question') askQuestion();else
    answer();
  };
  const onKey = (e) => {if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault();send();}};

  // switching modes
  const switchMode = (id) => {
    setMode(id);
    setText('');
    if (id === 'ai') {
      // hand the reins back to the companion: if the last turn wasn't an AI
      // question, have the companion pose the next one.
      const last = messages[messages.length - 1];
      setPhase('answer');
      if (last && last.who !== 'ai') aiFollowUp();
    } else {
      // family takes over — it becomes their turn to ask straight away
      setPhase('question');
    }
  };

  const endSession = () => {
    const minutes = Math.max(1, Math.round((Date.now() - startRef.current) / 60000));
    onEnd({ memories, noticed, turns, minutes });
  };

  const askingNow = mode !== 'ai' && phase === 'question';
  const statusText = thinking ? 'Thinking' :
  askingNow ? 'Your turn to ask' :
  listening ? 'Listening…' : 'Listening';

  const placeholder = askingNow ?
  `Ask ${first} a question…` :
  `${first}’s answer — speak or type…`;

  return (
    <div className="iv">
      {/* stage */}
      <div className="iv__stage">
        <div className="iv__stagetop">
          <div className="iv__blooms" aria-hidden="true">
            <div style={{ position: 'absolute', left: '8%', top: '-20%', width: 240, height: 240 }}><Bloom color="var(--bloom-a)" r={38} seed={2} /></div>
            <div className="bloom--optional" style={{ position: 'absolute', right: '6%', top: '-12%', width: 200, height: 200 }}><Bloom color="var(--bloom-c)" r={36} seed={7} /></div>
          </div>
          <VoiceOrb persona={persona.glyph} size={108} />
          <div className="iv__status"><span className="dot" /> {statusText}</div>
          <div className="iv__interviewer">
            <button className="iv__interviewer-btn"
            onClick={() => setPickerOpen((o) => !o)} title="Change interviewer">
              <span className="iv__persona-name">{persona.name}</span>
              <Icon name="chev" size={15} style={{ transform: pickerOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            {pickerOpen &&
            <React.Fragment>
              <div className="iv__picker-backdrop" onClick={() => setPickerOpen(false)} />
              <div className="iv__picker">
                <div className="pm-label">Choose your interviewer</div>
                {window.DATA.personas.map((p) =>
                <div key={p.id} className={'iv__picker-item' + (p.id === persona.id ? ' is-active' : '')}
                onClick={() => {if (onChangePersona) onChangePersona(p.id);setPickerOpen(false);}}>
                    <div className="iv__picker-av" style={{ background: `radial-gradient(120% 120% at 30% 20%, var(--bloom-b), ${p.accent})` }}>{p.glyph}</div>
                    <div className="iv__picker-txt">
                      <div className="iv__picker-name">{p.name}</div>
                      <div className="iv__picker-blurb">{p.blurb}</div>
                    </div>
                    {p.id === persona.id ? <span className="pm-check"><Icon name="check" size={14} /></span> : null}
                  </div>
                )}
              </div>
            </React.Fragment>
            }
          </div>

          {/* mode switcher */}
          <div className="iv__modes" role="tablist">
            {MODES.map((m) =>
            <button key={m.id} className={'iv__mode' + (mode === m.id ? ' is-active' : '')}
            role="tab" aria-selected={mode === m.id} onClick={() => switchMode(m.id)}>
                <Icon name={m.icon} size={15} /> {m.label}
              </button>
            )}
          </div>
          <div className="iv__mode-sub">{MODES.find((m) => m.id === mode).sub}</div>
        </div>

        <div className="iv__transcript" ref={scrollRef}>
          {messages.map((b, i) =>
          <div key={i} className={'bubble bubble--' + b.who}>
              <div className="bubble__who">{b.who === 'me' ? first : b.who === 'asker' ? b.asker || 'Family' : persona.name}</div>
              <div className={'bubble__text' + (b.who === 'me' ? ' is-serif' : '')}>{b.text}</div>
            </div>
          )}
          {thinking &&
          <div className="bubble bubble--ai">
              <div className="bubble__who">{persona.name}</div>
              <div className="bubble__text" style={{ display: 'inline-flex', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--ink-3)', animation: 'pulse 1.2s infinite' }} />
                <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--ink-3)', animation: 'pulse 1.2s infinite .2s' }} />
                <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--ink-3)', animation: 'pulse 1.2s infinite .4s' }} />
              </div>
            </div>
          }
        </div>

        {/* turn indicator (manual / help) */}
        {mode !== 'ai' &&
        <div className={'iv__turn ' + (askingNow ? 'iv__turn--ask' : 'iv__turn--answer')} style={{ marginBottom: 10 }}>
            <span className="who-dot" style={{ background: askingNow ? 'var(--accent-3)' : 'var(--accent)' }} />
            {askingNow ? `${askerName}’s turn to ask` : `${first} is answering`}
          </div>
        }

        <div className="iv__dock">
          <button className={'iv__micbtn' + (listening ? ' is-on' : '')} title="Voice input"
          onClick={() => setListening((v) => !v)}><Icon name="mic" size={20} /></button>
          <div className="iv__compose">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} placeholder={placeholder} />
            <button className="iv__send" onClick={send} disabled={!text.trim() || thinking} title="Send"><Icon name="arrow" size={20} /></button>
          </div>
          <button className="iv__end" onClick={endSession} title="End session"><Icon name="pause" size={15} /> End</button>
        </div>
        <div className="iv__hint">
          {mode === 'manual' ?
          askingNow ?
          `Manual mode: type each question you ask so it’s recorded, then capture ${first}’s answer. Suggested questions (right) are optional.` :
          `Now type ${first}’s answer and press Enter — it’s saved word for word. Then it’s your turn to ask again.` :
          'Speak aloud, or type the answer and press Enter — words are kept exactly as said.'}
        </div>
        <div style={{ height: 12 }} />
      </div>

      {/* extraction rail */}
      <div className="rail">
        <div className="rail__head">
          <div className="eyebrow">As you speak</div>
          <span className="live"><span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--accent)', display: 'inline-block' }} /> Weaving</span>
        </div>

        {/* Manual mode: optional AI-suggested follow-up questions */}
        {mode === 'manual' && askingNow && !thinking &&
        <div className="xcard" style={{ borderColor: 'color-mix(in oklab, var(--accent) 30%, var(--line))' }}>
            <div className="iv__qs-head" style={{ padding: '13px 16px 0', margin: 0 }}>
              <div className="eyebrow">Suggested questions · optional</div>
              <span className="iv__qs-refresh" onClick={() => setSuggestions(buildSuggestions())}>
                <Icon name="spark" size={13} /> Others
              </span>
            </div>
            <div className="iv__qs-grid" style={{ padding: '11px 16px 15px' }}>
              {suggestions.map((q, i) =>
            <button key={i} className="iv__q" onClick={() => askQuestion(q)}>
                  <span className="iv__q-ico"><Icon name="quote" size={14} /></span>
                  <span>{q}</span>
                </button>
            )}
            </div>
          </div>
        }

        {memories.length === 0 &&
        <div className="rail__empty">Every answer {first} gives starts gathering here — a memory card forms with each story, no matter who asks the question.</div>
        }

        {memories.length > 0 &&
        <div className="xcard">
            <div className="xmem__art"><WatercolorArt palette={memories[memories.length - 1].palette} seed={memories.length + 4} /></div>
            <div className="xcard__label" style={{ paddingTop: 12 }}>
              <Icon name="spark" size={13} /> Newest memory card
              <span className="rail__count" style={{ marginLeft: 'auto' }}>{memories.length} this session</span>
            </div>
            <div className="xmem__title">{memories[memories.length - 1].title}</div>
            <div className="xcard__body" style={{ paddingTop: 4 }}>
              <span className="mcard__tag"><Icon name="calendar" size={13} /> {memories[memories.length - 1].era}</span>
            </div>
          </div>
        }

        {noticed.length > 0 &&
        <div className="xcard">
            <div className="xcard__label"><Icon name="people" size={13} /> Noticed in your words</div>
            <div className="xcard__body">
              <div className="noticed-chips">
                {noticed.map((n, i) =>
              <span className="noticed-chip" key={i}>
                    <Icon name={n.kind === 'year' ? 'calendar' : 'people'} size={13} /> {n.text}
                  </span>
              )}
              </div>
              <div className="xrow__sub" style={{ marginTop: 10 }}>Names, places and dates are gathered automatically — you can tidy these up later.</div>
            </div>
          </div>
        }

        {memories.length >= 2 &&
        <div className="xcard" style={{ background: 'linear-gradient(150deg, var(--surface), var(--surface-2))' }}>
            <div className="xcard__body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="quote" size={18} style={{ color: 'var(--accent)' }} />
              <div>
                <div className="xrow__sub" style={{ marginTop: 0 }}>A chapter is forming</div>
                <div className="xrow__main" style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>You’ve woven {memories.length} memories together</div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>);

}

Object.assign(window, { InterviewScreen });