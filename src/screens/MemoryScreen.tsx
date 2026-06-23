// MemoryScreen.tsx — detail view for one captured memory.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { MemoryArt } from '../components/MemoryArt';
import { isSpeechAvailable, speak, stopSpeaking } from '../lib/speech/speechService';
import { getPersona } from '../lib/domain/personas';
import { firstNameOf } from '../lib/format';
import { useStore } from '../lib/store/StoreProvider';
import { illustrateMemory } from '../lib/ai/illustrateMemory';
import type { StorytellerProfile, Memory } from '../lib/domain/types';

export function MemoryScreen({ profile }: { profile: StorytellerProfile }) {
  const navigate = useNavigate();
  const { memId } = useParams();
  const { deleteMemory, updateMemory } = useStore();
  const memory = (profile.memories || []).find((m) => m.id === memId);

  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  // Answer editor
  const [editingAnswer, setEditingAnswer] = useState(false);
  const [answerDraft, setAnswerDraft] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  // Image generation
  const [generatingImage, setGeneratingImage] = useState(false);

  // Year editor
  const [addingYear, setAddingYear] = useState(false);
  const [yearInput, setYearInput] = useState('');
  const yearInputRef = useRef<HTMLInputElement>(null);

  // Person editor
  const [addingPerson, setAddingPerson] = useState(false);
  const [personNameInput, setPersonNameInput] = useState('');
  const [personRelInput, setPersonRelInput] = useState('');
  const personInputRef = useRef<HTMLInputElement>(null);

  // Place editor
  const [addingPlace, setAddingPlace] = useState(false);
  const [placeInput, setPlaceInput] = useState('');
  const placeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    void isSpeechAvailable().then((ok) => alive && setVoiceAvailable(ok));
    return () => {
      alive = false;
      stopSpeaking();
    };
  }, []);

  const people = useMemo(() => memory?.people ?? [], [memory]);
  const places = useMemo(() => memory?.places ?? [], [memory]);
  const years = useMemo(() => memory?.years ?? [], [memory]);
  const hasFullContent = !!(memory?.transcript?.length || memory?.answer);

  if (!memory) {
    return (
      <div className="page page--wide">
        <button className="chip" onClick={() => navigate(`/profiles/${profile.id}`)}>
          <Icon name="arrow" size={14} style={{ transform: 'rotate(180deg)' }} /> Back
        </button>
        <p className="rail__empty" style={{ marginTop: 18 }}>
          That memory couldn't be found.
        </p>
      </div>
    );
  }

  const reextract = async (mem: Memory): Promise<{ summary: string; excerpt: string } | null> => {
    const peopleCtx = (mem.people ?? []).map((p) => p.relation ? `${p.text} (${p.relation})` : p.text).join(', ');
    const placesCtx = (mem.places ?? []).join(', ');
    const yearsCtx = (mem.years ?? []).join(', ');
    const enrichment = [
      peopleCtx && `People: ${peopleCtx}`,
      placesCtx && `Places: ${placesCtx}`,
      yearsCtx && `Dates: ${yearsCtx}`,
    ].filter(Boolean).join('. ');
    const answerText = [
      mem.answer || mem.excerpt,
      enrichment && `[Context — ${enrichment}]`,
    ].filter(Boolean).join('\n\n').slice(0, 4000);
    try {
      const res = await fetch('/api/interview/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerText }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { summary?: string; excerpt?: string };
      if (!data.summary) return null;
      return { summary: data.summary, excerpt: data.excerpt ?? mem.excerpt };
    } catch {
      return null;
    }
  };

  const saveAnswer = async () => {
    const trimmed = answerDraft.trim();
    if (!trimmed) return;
    setRegenerating(true);
    const patch: Partial<Memory> = { answer: trimmed };
    const updated: Memory = { ...memory!, answer: trimmed };
    const extracted = await reextract(updated);
    if (extracted) {
      patch.summary = extracted.summary;
      patch.excerpt = extracted.excerpt;
    }
    await updateMemory(profile.id, memory!.id, patch);
    setRegenerating(false);
    setEditingAnswer(false);
  };

  const generateImage = async () => {
    if (!memory || generatingImage) return;
    setGeneratingImage(true);
    const imageUrl = await illustrateMemory({
      memoryId: memory.id,
      title: memory.title,
      summary: memory.summary,
      theme: memory.theme,
      era: memory.era,
    });
    if (imageUrl) await updateMemory(profile.id, memory.id, { imageUrl });
    setGeneratingImage(false);
  };

  const readAloud = async () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    const script =
      memory.transcript && memory.transcript.length
        ? memory.transcript.map((t) => t.text).join('. ')
        : [memory.question, memory.answer || memory.excerpt].filter(Boolean).join('. ');
    await speak(script, getPersona(profile.personaId).voice);
    setSpeaking(false);
  };

  const saveYear = async () => {
    const val = yearInput.trim();
    if (!val) return;
    const current = memory.years ?? [];
    if (!current.includes(val)) {
      const newYears = [...current, val];
      // Keep era in sync with the earliest year so display never stays "Undated"
      const era = newYears.slice().sort()[0];
      await updateMemory(profile.id, memory.id, { years: newYears, era });
    }
    setYearInput('');
    setAddingYear(false);
  };

  const savePerson = async () => {
    const name = personNameInput.trim();
    if (!name) return;
    await updateMemory(profile.id, memory.id, {
      people: [...(memory.people ?? []), { text: name, relation: personRelInput.trim() || null }],
    });
    setPersonNameInput('');
    setPersonRelInput('');
    setAddingPerson(false);
  };

  const savePlace = async () => {
    const val = placeInput.trim();
    if (!val) return;
    const current = memory.places ?? [];
    if (!current.includes(val)) {
      await updateMemory(profile.id, memory.id, { places: [...current, val] });
    }
    setPlaceInput('');
    setAddingPlace(false);
  };

  const onDelete = async () => {
    if (window.confirm(`Delete "${memory.title}"? This can't be undone.`)) {
      await deleteMemory(profile.id, memory.id);
      navigate(`/profiles/${profile.id}`);
    }
  };

  return (
    <div className="page page--wide">
      <button className="chip" onClick={() => navigate(`/profiles/${profile.id}`)} style={{ marginBottom: 18 }}>
        <Icon name="arrow" size={14} style={{ transform: 'rotate(180deg)' }} /> All memories
      </button>

      {/* Header */}
      <section className="profile-hero rise">
        <div className="profile-portrait" style={{ position: 'relative' }}>
          <MemoryArt memory={memory} seed={(memory.title || '').length + 3} />
          {generatingImage && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', background: 'rgba(0,0,0,0.18)' }}>
              <span className="painting-indicator">
                <svg className="painting-indicator__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Painting
                <span className="painting-indicator__dot">.</span>
                <span className="painting-indicator__dot">.</span>
                <span className="painting-indicator__dot">.</span>
              </span>
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <div className="eyebrow">
            {[memory.era, memory.theme].filter(Boolean).join(' · ')}{(memory.era || memory.theme) ? ' · ' : ''}Captured {new Date(memory.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <h1 className="profile-name" style={{ marginTop: 6 }}>
            {memory.title}
          </h1>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            {voiceAvailable && (
              <button className="btn btn--ghost" onClick={() => void readAloud()}>
                <Icon name={speaking ? 'pause' : 'mic'} size={15} />
                {speaking ? 'Stop' : 'Read aloud'}
              </button>
            )}
            {!memory.imageUrl && (
              <button className="btn btn--ghost" onClick={() => void generateImage()} disabled={generatingImage}>
                <Icon name="spark" size={15} />
                {generatingImage ? 'Generating…' : 'Generate image'}
              </button>
            )}
            <button className="btn-delete" onClick={() => void onDelete()}>
              Delete memory
            </button>
          </div>
        </div>
      </section>

      {/* Two-column body */}
      <div className="mem__body-grid">

        {/* Left — summary content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel rise">
            {memory.question && (
              <>
                <div className="eyebrow" style={{ marginBottom: 8 }}>The question</div>
                <p style={{ color: 'var(--ink-2)', fontStyle: 'italic', fontSize: 15, lineHeight: 1.6, margin: '0 0 18px' }}>
                  "{memory.question}"
                </p>
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="eyebrow">Summary</div>
              {regenerating && <span className="ob-hint" style={{ margin: 0, fontSize: 12 }}>Updating…</span>}
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink)', margin: 0 }}>
              {memory.summary || memory.excerpt}
            </p>
          </div>

          {/* Conversation — collapsible, with edit */}
          {hasFullContent && (
            <div className="panel rise">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  className="mem__expand-btn"
                  onClick={() => { setTranscriptOpen((o) => !o); if (editingAnswer) setEditingAnswer(false); }}
                  aria-expanded={transcriptOpen}
                  style={{ flex: 1 }}
                >
                  <Icon
                    name="chev"
                    size={15}
                    style={{ transform: transcriptOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
                  />
                  {transcriptOpen ? 'Hide conversation' : 'See the conversation'}
                </button>
                {transcriptOpen && !editingAnswer && (
                  <button
                    className="chip"
                    style={{ fontSize: 12, marginLeft: 10 }}
                    onClick={() => { setAnswerDraft(memory.answer || memory.excerpt); setEditingAnswer(true); }}
                  >
                    <Icon name="arrow" size={12} /> Edit
                  </button>
                )}
              </div>

              {transcriptOpen && (
                <div style={{ marginTop: 18 }}>
                  {editingAnswer ? (
                    <>
                      <textarea
                        value={answerDraft}
                        onChange={(e) => setAnswerDraft(e.target.value)}
                        rows={8}
                        style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-display)', fontSize: 15, lineHeight: 1.7, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button className="btn btn--primary" style={{ fontSize: 13 }} onClick={() => void saveAnswer()} disabled={regenerating || !answerDraft.trim()}>
                          {regenerating ? 'Saving…' : 'Save & regenerate summary'}
                        </button>
                        <button className="btn btn--ghost" style={{ fontSize: 13 }} onClick={() => setEditingAnswer(false)} disabled={regenerating}>
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : memory.transcript && memory.transcript.length ? (
                    memory.transcript.map((t, i) => (
                      <div key={i} className={'bubble bubble--' + t.who} style={{ marginBottom: 10 }}>
                        <div className="bubble__who">
                          {t.who === 'storyteller'
                            ? firstNameOf(profile.name)
                            : t.who === 'asker'
                              ? t.askerLabel || 'Family'
                              : getPersona(profile.personaId).name}
                        </div>
                        <div className={'bubble__text' + (t.who === 'storyteller' ? ' is-serif' : '')}>
                          {t.text}
                        </div>
                      </div>
                    ))
                  ) : memory.answer ? (
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, lineHeight: 1.7, color: 'var(--ink)', margin: 0 }}>
                      {memory.answer}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — Complete the picture */}
        <div className="panel rise mem__enrich-panel">
          <div className="eyebrow" style={{ marginBottom: 4 }}>As you recall more</div>
          <h3 className="mem__enrich-title">Complete the picture</h3>

          {/* Theme (AI-assigned, read-only) */}
          {memory.theme && (
            <div className="mem__enrich-row">
              <div className="mem__entity-label">Theme</div>
              <div className="noticed-chips" style={{ marginTop: 6 }}>
                <span className="noticed-chip">
                  <Icon name="spark" size={13} /> {memory.theme}
                </span>
              </div>
            </div>
          )}

          {/* When */}
          <div className="mem__enrich-row">
            <div className="mem__entity-label">When</div>
            <div className="noticed-chips" style={{ marginTop: 6 }}>
              {years.map((year, i) => (
                <span className="noticed-chip" key={i}>
                  <Icon name="calendar" size={13} /> {year}
                </span>
              ))}
              {addingYear ? (
                <span className="mem__add-form">
                  <input
                    ref={yearInputRef}
                    className="mem__add-input"
                    value={yearInput}
                    onChange={(e) => setYearInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void saveYear();
                      if (e.key === 'Escape') { setAddingYear(false); setYearInput(''); }
                    }}
                    placeholder="e.g. 1975 or 1970s"
                  />
                  <button className="chip" onClick={() => void saveYear()} style={{ padding: '2px 10px' }}>Save</button>
                  <button className="chip" onClick={() => { setAddingYear(false); setYearInput(''); }} style={{ padding: '2px 8px' }}>✕</button>
                </span>
              ) : (
                <button
                  className="noticed-chip mem__add-btn"
                  onClick={() => { setAddingYear(true); setTimeout(() => yearInputRef.current?.focus(), 50); }}
                >
                  <Icon name="plus" size={12} /> Add date
                </button>
              )}
            </div>
          </div>

          {/* People */}
          <div className="mem__enrich-row">
            <div className="mem__entity-label">People</div>
            <div className="noticed-chips" style={{ marginTop: 6 }}>
              {people.map((p, i) => (
                <span className="noticed-chip" key={i}>
                  <Icon name="people" size={13} />
                  {p.text}{p.relation ? <em style={{ color: 'var(--ink-3)', fontStyle: 'normal' }}> · {p.relation}</em> : null}
                </span>
              ))}
              {addingPerson ? (
                <span className="mem__add-form mem__add-form--col">
                  <input
                    ref={personInputRef}
                    className="mem__add-input"
                    value={personNameInput}
                    onChange={(e) => setPersonNameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') { setAddingPerson(false); setPersonNameInput(''); setPersonRelInput(''); } }}
                    placeholder="Name"
                  />
                  <input
                    className="mem__add-input"
                    value={personRelInput}
                    onChange={(e) => setPersonRelInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void savePerson(); if (e.key === 'Escape') { setAddingPerson(false); setPersonNameInput(''); setPersonRelInput(''); } }}
                    placeholder="Relation (e.g. sister)"
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="chip" onClick={() => void savePerson()} style={{ padding: '2px 10px' }}>Save</button>
                    <button className="chip" onClick={() => { setAddingPerson(false); setPersonNameInput(''); setPersonRelInput(''); }} style={{ padding: '2px 8px' }}>✕</button>
                  </div>
                </span>
              ) : (
                <button
                  className="noticed-chip mem__add-btn"
                  onClick={() => { setAddingPerson(true); setTimeout(() => personInputRef.current?.focus(), 50); }}
                >
                  <Icon name="plus" size={12} /> Add person
                </button>
              )}
            </div>
          </div>

          {/* Places */}
          <div className="mem__enrich-row">
            <div className="mem__entity-label">Places</div>
            <div className="noticed-chips" style={{ marginTop: 6 }}>
              {places.map((place, i) => (
                <span className="noticed-chip" key={i}>
                  <Icon name="pin" size={13} /> {place}
                </span>
              ))}
              {addingPlace ? (
                <span className="mem__add-form">
                  <input
                    ref={placeInputRef}
                    className="mem__add-input"
                    value={placeInput}
                    onChange={(e) => setPlaceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void savePlace();
                      if (e.key === 'Escape') { setAddingPlace(false); setPlaceInput(''); }
                    }}
                    placeholder="e.g. Melbourne"
                  />
                  <button className="chip" onClick={() => void savePlace()} style={{ padding: '2px 10px' }}>Save</button>
                  <button className="chip" onClick={() => { setAddingPlace(false); setPlaceInput(''); }} style={{ padding: '2px 8px' }}>✕</button>
                </span>
              ) : (
                <button
                  className="noticed-chip mem__add-btn"
                  onClick={() => { setAddingPlace(true); setTimeout(() => placeInputRef.current?.focus(), 50); }}
                >
                  <Icon name="plus" size={12} /> Add place
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
