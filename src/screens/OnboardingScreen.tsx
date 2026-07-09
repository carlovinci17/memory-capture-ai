// OnboardingScreen.tsx — create / edit / add storyteller.
import { useRef, useState, useEffect, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { Bloom, WatercolorArt } from '../components/Watercolor';
import { PERSONAS } from '../lib/domain/personas';
import { initialsOf } from '../lib/format';
import { useStore } from '../lib/store/StoreProvider';
import { isDemoMode } from '../lib/demo/demoMode';
import type { PersonaId, StorytellerProfile } from '../lib/domain/types';

const STEPS: { icon: IconName; t: string; d: string }[] = [
  { icon: 'profile', t: 'Tell us who you are', d: "A name, a place, a few words — that's all we need to begin." },
  { icon: 'mic', t: 'Sit down for a chat', d: 'Your chosen companion asks gentle questions. You simply talk.' },
  { icon: 'spark', t: 'Watch your story take shape', d: 'Every memory you share is gathered and kept, in your own words.' },
];

const CURRENT_YEAR = new Date().getFullYear();

export function OnboardingScreen({ editing = false }: { editing?: boolean }) {
  const { profiles, activeProfile, createProfile, updateProfile, deleteProfile, initDemoStore, skipToDemo } = useStore();
  const navigate = useNavigate();

  const initial = editing ? activeProfile : null;
  const params = new URLSearchParams(window.location.search);
  const forceAdd = params.has('new');
  const adding = !editing && profiles.length > 0 && forceAdd;

  // Redirect to home if the user already has profiles and isn't explicitly adding or editing.
  useEffect(() => {
    if (!editing && profiles.length > 0 && !forceAdd) navigate('/home', { replace: true });
  }, [editing, profiles.length, forceAdd, navigate]);

  // Show the two-path choice on a brand-new demo visit OR when arriving via "Get full access".
  const forceChoice = params.has('access');
  const showChoice = !editing && (profiles.length === 0 || forceChoice) && isDemoMode();
  const [step, setStep] = useState<'choice' | 'form'>(showChoice ? 'choice' : 'form');

  const [name, setName] = useState(initial?.name ?? '');
  const [yearBorn, setYearBorn] = useState(initial?.yearBorn ?? '');
  const [place, setPlace] = useState(initial?.birthplace ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null);
  const [gender, setGender] = useState<'M' | 'F' | ''>(initial?.gender ?? '');
  const [personaId, setPersonaId] = useState<PersonaId>(initial?.personaId ?? PERSONAS[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = src;
    };
    reader.readAsDataURL(f);
  };

  const canSubmit = name.trim().length > 0;
  const yearNum = Number(yearBorn);
  const yearLooksOff = yearBorn.length === 4 && (yearNum < 1900 || yearNum > CURRENT_YEAR);

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: Omit<StorytellerProfile, 'id'> = {
        name: name.trim(),
        yearBorn: String(yearBorn).trim(),
        birthplace: place.trim(),
        bio: bio.trim(),
        photo,
        gender: gender === 'M' ? 'M' : gender === 'F' ? 'F' : undefined,
        personaId,
        sessions: initial?.sessions ?? 0,
        memories: initial?.memories ?? [],
        createdAt: initial?.createdAt ?? Date.now(),
      };
      if (editing && initial) {
        await updateProfile(initial.id, { ...payload, id: initial.id });
        navigate(`/profiles/${initial.id}`);
      } else if (showChoice) {
        // Demo first visit: seed example profiles + user profile atomically into store.
        const userProfile: StorytellerProfile = { ...payload, id: crypto.randomUUID() };
        initDemoStore(userProfile);
        navigate('/home');
      } else {
        await createProfile(payload);
        navigate('/home');
      }
    } catch {
      setSubmitError('Something went wrong saving your profile. Please try again.');
      setSubmitting(false);
    }
  };

  const onCancel = () => {
    if (editing && initial) navigate(`/profiles/${initial.id}`);
    else if (profiles.length) navigate('/home');
  };

  const onDelete = async () => {
    if (!initial) return;
    if (window.confirm("Delete this profile and everything you've captured? This can't be undone.")) {
      const next = await deleteProfile(initial.id);
      navigate(next ? `/profiles/${next}` : '/onboarding');
    }
  };

  const showCancel = editing || adding;

  return (
    <div className="ob-stage" data-mood="terracotta" data-type="editorial" data-texture="medium">
      <div className="ob">
        {/* intro column */}
        <div className="ob__intro">
          <div className="ob__bloom">
            <Bloom color="var(--bloom-a)" r={40} seed={3} />
          </div>
          <div className="ob__brand">
            <div className="brand__mark">
              <Icon name="quote" size={22} />
            </div>
            <div className="ob__brand-name">Memory Capture AI</div>
          </div>
          <div className="ob__greet">
            {editing ? 'A few refinements' : adding ? 'A new storyteller' : 'Welcome'}
          </div>
          <h1 className="ob__title">
            {editing ? (
              <span>Update your <em>profile</em></span>
            ) : adding ? (
              <span>Add a new <em>storyteller</em></span>
            ) : (
              <span>Let's begin your <em>story</em></span>
            )}
          </h1>
          <p className="ob__lead">
            {editing
              ? "Change anything below — your details flow through to your home, your interviews, and everything you've captured."
              : adding
                ? "Set up another person's journal. Each storyteller keeps their own memories, interviews and interviewer — switch between them any time from the top-right."
                : 'Memory Capture is a living journal of your life. A warm AI companion interviews you, and turns what you share into something your family will treasure.'}
          </p>
          <div className="ob__steps">
            {STEPS.map((s, i) => (
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

        {/* panel column */}
        <div className="ob__panel rise">

          {/* ── Step 1: choice ───────────────────────────────────── */}
          {step === 'choice' ? (
            <>
              <div className="ob__panel-head">
                <div className="eyebrow ob__panel-eyebrow">Get started</div>
                <div className="ob__panel-title">How would you like to begin?</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <button className="btn btn--primary" onClick={() => setStep('form')} style={{ width: '100%' }}>
                  <Icon name="spark" size={16} /> Try for free
                </button>
                <div className="ob-path-choice__or">or</div>
                <button
                  className="btn btn--ghost"
                  onClick={() => {
                    window.location.href = '/.auth/login/google?prompt=select_account&post_login_redirect_uri=' + encodeURIComponent('/home?mcap_setup=1');
                  }}
                  style={{ width: '100%' }}
                >
                  Sign in with Google for full access
                </button>
              </div>

              <p className="ob-hint" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Icon name="info" size={14} style={{ marginTop: 2, color: 'var(--ink-3)', flex: 'none' }} />
                <span>
                  <strong>Try for free</strong> — stories saved in this browser only, nothing sent to a server.
                  <br /><br />
                  <strong>Full access</strong> — stories stored securely in the cloud, accessible from any device after approval.
                </span>
              </p>
              <p className="ob-hint" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="heart" size={13} style={{ color: 'var(--accent)', flex: 'none' }} />
                <strong>Always free. No credit card required.</strong>
              </p>
            </>
          ) : (

          /* ── Step 2: form ────────────────────────────────────── */
          <>
            <div className="ob__panel-head" style={{ position: 'relative' }}>
              <div className="eyebrow ob__panel-eyebrow">
                {editing ? 'Edit profile' : adding ? 'New storyteller' : 'A little about you'}
              </div>
              <div className="ob__panel-title">
                {editing ? 'Your details' : adding ? 'A little about you' : 'Create your profile'}
              </div>
              {showChoice && (
                <button
                  className="btn btn--ghost"
                  onClick={() => setStep('choice')}
                  style={{ position: 'absolute', top: 0, right: 0, padding: '4px 10px', fontSize: 13 }}
                >
                  <Icon name="arrow" size={13} style={{ transform: 'rotate(180deg)' }} /> Back
                </button>
              )}
            </div>

            {/* photo */}
            <div className="ob-field">
              <div className="ob-photo">
                <button
                  type="button"
                  className="ob-photo__drop"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Upload a photo"
                >
                  {photo ? (
                    <img src={photo} alt="" />
                  ) : (
                    <>
                      <WatercolorArt seed={6} palette={['var(--bloom-b)', 'var(--bloom-a)', 'var(--bloom-c)']} />
                      <div className="ob-photo__init">
                        {name.trim() ? initialsOf(name) : <Icon name="plus" size={24} />}
                      </div>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={onPickFile}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                  />
                </button>
                <div>
                  <div className="ob-photo__txt-t">
                    A photo of you <span style={{ color: 'var(--ink-4)', fontWeight: 500 }}>· optional</span>
                  </div>
                  <div className="ob-photo__txt-d">
                    It appears across your journal. A recent or beloved old one — both are perfect.
                  </div>
                  <button type="button" className="ob-photo__link" onClick={() => fileRef.current?.click()}>
                    {photo ? 'Change photo' : 'Upload a photo'}
                  </button>
                  {photo && (
                    <button
                      type="button"
                      className="ob-photo__link"
                      style={{ marginLeft: 14, color: 'var(--ink-3)' }}
                      onClick={() => setPhoto(null)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* name */}
            <div className="ob-field">
              <label className="ob-label" htmlFor="ob-name">Your name</label>
              <input
                id="ob-name"
                className="ob-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Eleanor Marchetti"
              />
            </div>

            {/* gender */}
            <div className="ob-field">
              <div className="ob-label" id="ob-gender-label">
                Gender <span className="opt">optional</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }} role="group" aria-labelledby="ob-gender-label">
                {(['M', 'F'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={'chip' + (gender === g ? ' is-active' : '')}
                    aria-pressed={gender === g}
                    onClick={() => setGender(gender === g ? '' : g)}
                  >
                    {g === 'M' ? 'Male' : 'Female'}
                  </button>
                ))}
              </div>
            </div>

            {/* year + place */}
            <div className="ob-field ob-field--row">
              <div>
                <label className="ob-label" htmlFor="ob-year">
                  Year you were born <span className="opt">optional</span>
                </label>
                <input
                  id="ob-year"
                  className="ob-input"
                  type="text"
                  inputMode="numeric"
                  value={yearBorn}
                  onChange={(e) => setYearBorn(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="1948"
                  aria-describedby={yearLooksOff ? 'ob-year-hint' : undefined}
                />
                {yearLooksOff && (
                  <div id="ob-year-hint" className="ob-hint" style={{ color: 'var(--accent-ink)' }}>
                    That year looks unusual — you can still keep it if it's right.
                  </div>
                )}
              </div>
              <div>
                <label className="ob-label" htmlFor="ob-place">
                  Where you're from <span className="opt">optional</span>
                </label>
                <input
                  id="ob-place"
                  className="ob-input"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="Camogli, Italy"
                />
              </div>
            </div>

            {/* bio */}
            <div className="ob-field">
              <label className="ob-label" htmlFor="ob-bio">
                A few words about you <span className="opt">optional</span>
              </label>
              <textarea
                id="ob-bio"
                className="ob-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Daughter of a fisherman, taught Italian for thirty-one years, mother of two…"
              />
              <div className="ob-hint">
                This becomes the opening line of your story. You can change it any time.
              </div>
            </div>

            {/* persona */}
            <div className="ob-field">
              <div className="ob-label" id="ob-persona-label">Choose your interviewer</div>
              <div className="persona-grid" role="radiogroup" aria-labelledby="ob-persona-label">
                {PERSONAS.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    role="radio"
                    aria-checked={p.id === personaId}
                    className={'persona-card' + (p.id === personaId ? ' is-active' : '')}
                    onClick={() => setPersonaId(p.id)}
                  >
                    <div className="persona-card__check"><Icon name="arrow" size={12} /></div>
                    <div className="persona-card__top">
                      <div
                        className="persona-card__av"
                        style={{ background: `radial-gradient(120% 120% at 30% 20%, var(--bloom-b), ${p.accent})` }}
                      >
                        {p.glyph}
                      </div>
                      <div className="persona-card__name">{p.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <p className="ob-hint" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Icon name="heart" size={14} style={{ marginTop: 2, color: 'var(--accent)', flex: 'none' }} />
              <span>
                These stories stay private to your account. By continuing you confirm you have
                permission to record {adding ? "this person's" : 'these'} memories.
              </span>
            </p>

            <div className="ob__actions">
              <button className="btn btn--primary" disabled={!canSubmit || submitting} onClick={submit}>
                <Icon name={editing ? 'arrow' : 'spark'} size={16} />{' '}
                {submitting ? 'Loading…' : editing ? 'Save changes' : adding ? 'Create journal' : 'Create my journal'}
              </button>
              {showCancel && (
                <button className="ob__cancel" onClick={onCancel}>Cancel</button>
              )}
              {showChoice && !canSubmit && (
                <button
                  className="btn btn--ghost"
                  style={{ fontSize: 13, color: 'var(--ink-3)' }}
                  onClick={() => { skipToDemo(); navigate('/home'); }}
                >
                  Continue without a profile
                </button>
              )}
              {submitError && (
                <span className="ob-hint" style={{ margin: 0, color: 'var(--error, #c0392b)' }}>
                  {submitError}
                </span>
              )}
              {editing && (
                <button className="btn-delete" style={{ marginLeft: 'auto' }} onClick={onDelete}>
                  Delete profile
                </button>
              )}
            </div>
          </>
          )}
        </div>
      </div>

      {/* footer — always visible on the onboarding screen */}
      <footer className="ob-footer">
        <span>© 2026 Memory Capture AI</span>
      </footer>
    </div>
  );
}
