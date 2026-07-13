// InterviewScreen.tsx — the centerpiece. Two modes (AI asks / Manual),
// turn-taking, interviewer picker, live extraction rail. Ported from the
// prototype (mvp-interview.jsx); mock logic now lives behind the interview
// engine (static fallback today, Azure AI Foundry in M6).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { Bloom, VoiceOrb, Waveform } from '../components/Watercolor';
import { MemoryArt } from '../components/MemoryArt';
import { firstNameOf } from '../lib/format';
import { getPersona, PERSONAS } from '../lib/domain/personas';
import { useStore } from '../lib/store/StoreProvider';
import { getInterviewEngine } from '../lib/ai';
import { illustrateMemory } from '../lib/ai/illustrateMemory';
import {
  getAnalyser,
  getMicPermissionState,
  isSpeechAvailable,
  speak,
  startRecognition,
  stopSpeaking,
  watchMicPermission,
  type MicPermissionState,
  type Recognition,
} from '../lib/speech/speechService';
import type {
  ExtractedEntity,
  Memory,
  SessionResult,
  StorytellerProfile,
  TranscriptTurn,
} from '../lib/domain/types';

type Mode = 'ai' | 'manual';
type Phase = 'question' | 'answer';

interface Bubble {
  who: 'ai' | 'storyteller' | 'asker';
  text: string;
  asker?: string;
}

// Curated life-experience topics for the "New topic" button.
// Each entry has a keyword (used to detect coverage in the transcript) and
// several warm, open-ended questions the AI can ask about that topic.
const LIFE_TOPIC_POOL: { topic: string; questions: string[] }[] = [
  {
    topic: 'travel',
    questions: [
      "Let's go somewhere new — what's the most memorable place you've ever been to?",
      'Is there a journey you took that changed how you saw the world?',
      'Tell me about the furthest from home you ever ventured.',
    ],
  },
  {
    topic: 'family',
    questions: [
      "Let's talk about family — who was the heart of your childhood home?",
      'What were your parents like — what did they stand for?',
      'Is there a family tradition that has stayed with you all these years?',
    ],
  },
  {
    topic: 'culture',
    questions: [
      "I'd love to hear about your roots — what culture or heritage do you feel most connected to?",
      "Are there any traditions from where you grew up that you've kept alive?",
      'What does your cultural background look, taste and sound like to you?',
    ],
  },
  {
    topic: 'hobbies',
    questions: [
      'When you had free time as a younger person, what did you love to do?',
      "Is there a hobby or pastime you've had your whole life?",
      "What did you make, build or create that you're proud of?",
    ],
  },
  {
    topic: 'sport',
    questions: [
      'Were you ever sporty? Tell me about a sport or physical activity that was important to you.',
      'Is there a game, match or sporting moment that still stands out in your memory?',
      'Did you have a team or a sporting hero you followed with passion?',
    ],
  },
  {
    topic: 'romance',
    questions: [
      "I'd love to hear a love story — how did you meet the most important person in your life?",
      'What do you remember about the early days of your relationship?',
      'Was there a moment when you knew they were the one?',
    ],
  },
  {
    topic: 'children',
    questions: [
      "Let's talk about the children in your life — what was it like when they were small?",
      "What's a memory of your child or grandchild that makes you smile even now?",
      "Is there something you hope they'll remember about you?",
    ],
  },
  {
    topic: 'siblings',
    questions: [
      'Tell me about your brothers or sisters — what were they like growing up?',
      "What's a childhood memory that involves a sibling?",
      'How has your relationship with your siblings changed over the years?',
    ],
  },
  {
    topic: 'work',
    questions: [
      "Let's talk about your working life — what was your first job, and what did it teach you?",
      'What work are you most proud of in your life?',
      'Is there a colleague or boss who really left their mark on you?',
    ],
  },
  {
    topic: 'food',
    questions: [
      "Let's talk about food — what dish takes you straight back to your childhood?",
      'Was there a recipe in your family that got passed down through the generations?',
      "Tell me about a meal you'll never forget.",
    ],
  },
  {
    topic: 'school',
    questions: [
      'Cast your mind back to school — what do you remember about those years?',
      'Was there a teacher who made a real difference to you?',
      'What did you love — or dread — about your school days?',
    ],
  },
  {
    topic: 'friendship',
    questions: [
      'Tell me about a friend who really mattered to you — what made them special?',
      "Is there a friendship you've carried your whole life?",
      "What's the most fun you ever had with a group of friends?",
    ],
  },
  {
    topic: 'home',
    questions: [
      'Describe the home you grew up in — what did it look, smell and feel like?',
      'Is there a place — a room, a garden, a street — you still return to in your mind?',
      'Have you ever had to leave a home you loved? What was that like?',
    ],
  },
  {
    topic: 'music',
    questions: [
      'What music was part of your life when you were young?',
      'Is there a song that takes you straight back to a particular moment?',
      'Did you ever play an instrument or sing? What was that like?',
    ],
  },
  {
    topic: 'proud moments',
    questions: [
      "What's something you've done in your life that you're really proud of?",
      'Was there a moment when you surprised yourself with what you were capable of?',
      'What achievement do you hope the people who love you will remember?',
    ],
  },
  {
    topic: 'times of change',
    questions: [
      "Life brings big changes — is there a turning point that shaped who you became?",
      "What's something that changed in the world during your lifetime that still amazes you?",
      'Tell me about a chapter of your life that was hard — and what you found on the other side.',
    ],
  },
  {
    topic: 'home moves',
    questions: [
      "Let's talk about the places you've lived — how many homes have you had over your life?",
      'Have you ever packed up and moved somewhere completely new? What drove that decision?',
      "Is there a home you've lived in that you think about more than the others?",
    ],
  },
  {
    topic: 'living overseas',
    questions: [
      'Have you ever lived in another country — even for a short time? What was that like?',
      "If you've lived abroad, what surprised you most about life there?",
      'What did living somewhere foreign teach you about yourself or your own culture?',
    ],
  },
  {
    topic: 'buying a home',
    questions: [
      "Tell me about the first home you ever owned — how did it come about?",
      'What did owning your own home mean to you at the time?',
      'Was there a house you dreamed of having — and did you ever get there?',
    ],
  },
  {
    topic: 'migration',
    questions: [
      "Did you or your family migrate to Australia? Tell me how that journey came about.",
      'What was it like arriving in a new country — what do you remember about those early days?',
      "What made Australia home for you — was there a moment it stopped feeling foreign?",
    ],
  },
];

function pickNewTopic(transcriptText: string): string {
  const lower = transcriptText.toLowerCase();
  const unused = LIFE_TOPIC_POOL.filter((t) => !lower.includes(t.topic));
  const pool = unused.length > 0 ? unused : LIFE_TOPIC_POOL;
  const entry = pool[Math.floor(Math.random() * pool.length)];
  return entry.questions[Math.floor(Math.random() * entry.questions.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Read-aloud preference: unset (first visit, or cleared by "Reset / Clear my
// data") defaults to on; otherwise honor whatever the storyteller last chose.
function readTtsPreference(): boolean {
  const raw = localStorage.getItem('mcap_tts');
  return raw === null ? true : raw === '1';
}

const PALETTES = [
  ['#D98C8C', '#E2A07E', '#E8C285'],
  ['#7FA8B0', '#A9BB97', '#E8C285'],
  ['#A9BB97', '#C9B581', '#7FA8B0'],
  ['#D98C8C', '#C08AA0', '#A9BB97'],
  ['#B7C4D2', '#E2A07E', '#D98C8C'],
];

const MODES: { id: Mode; label: string; icon: IconName; sub: string }[] = [
  {
    id: 'ai',
    label: 'AI asks',
    icon: 'quote',
    sub: 'Fully automated — the companion asks every question and follows up on its own.',
  },
  {
    id: 'manual',
    label: 'Manual',
    icon: 'people',
    sub: 'You ask the questions. The companion offers optional follow-ups — use them or skip them.',
  },
];

export function InterviewScreen({ profile }: { profile: StorytellerProfile }) {
  const navigate = useNavigate();
  const { changePersona, finishSession, updateMemory } = useStore();
  const engine = useMemo(() => getInterviewEngine(), []);
  const persona = getPersona(profile.personaId);

  const first = firstNameOf(profile.name);

  const [messages, setMessages] = useState<Bubble[]>([]);
  const [topicOptions, setTopicOptions] = useState<{ topic: string; questions: string[] }[] | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [noticed, setNoticed] = useState<ExtractedEntity[]>([]);
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [turns, setTurns] = useState(0);

  const [illustratingIds, setIllustratingIds] = useState<Set<string>>(new Set());

  const [mode, setMode] = useState<Mode>('ai');
  const [phase, setPhase] = useState<Phase>('answer');
  const [askerName] = useState('Family');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [waveData, setWaveData] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);
  const [topicPromptPending, setTopicPromptPending] = useState(false);
  const pendingNextMsgsRef = useRef<Bubble[]>([]);
  // Voice (Azure AI Speech) — optional enhancement; typing always works.
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [voiceChecking, setVoiceChecking] = useState(true);
  // Surfaces the last mic/recognition failure reason inline — recognition errors
  // otherwise degrade silently (by design), which makes them undiagnosable from
  // the field. Cleared as soon as listening starts again cleanly.
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // Detected up front (and live-watched) so a browser-level mic block surfaces
  // immediately, instead of only after a failed recognition attempt.
  const [micPermission, setMicPermission] = useState<MicPermissionState>('unsupported');
  // The definitive in-flight/resolved availability check. Topic selection can
  // happen before the mount-time isSpeechAvailable() check settles, so callers
  // await this promise instead of reading the (possibly still-stale) state above.
  const voiceCheckRef = useRef<Promise<boolean>>(Promise.resolve(false));
  // Read-aloud defaults to on for first-time visitors; a returning storyteller's
  // explicit choice (from the chip below) is remembered across sessions. Playback
  // itself still only starts after the topic-pick click, which supplies the
  // browser's required audio gesture — this only decides the initial preference.
  const [ttsOn, setTtsOn] = useState(readTtsPreference);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startRef = useRef(Date.now());
  const recognitionRef = useRef<Recognition | null>(null);
  const baseTextRef = useRef('');
  const lastSpokeRef = useRef(-1);
  const mountedRef = useRef(true);
  const listeningRef = useRef(false);
  const micPermissionRef = useRef<MicPermissionState>('unsupported');
  const modeRef = useRef<Mode>('ai');
  // Topic pacing: count questions on the current topic; pivot at a random threshold.
  const topicTurnsRef = useRef(0);
  const pivotAtRef = useRef(randomBetween(6, 8));
  // Silence-based auto-submit: fires after 2.5 s of no new speech segments.
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Synchronous paused flag so the TTS effect can check it without needing it in deps.
  const pausedRef = useRef(false);
  // Per-topic accumulation: one memory card is created per topic and updated as
  // follow-up answers arrive. Refs reset when the topic pivots.
  const currentTopicMemoryIdRef = useRef<string | null>(null);
  const currentTopicAnswersRef = useRef<string[]>([]);
  const currentTopicFirstQRef = useRef<string | undefined>(undefined);
  // Mirrors ttsOn state synchronously so stale closures read the current value via
  // the ref rather than a frozen closure snapshot.
  const ttsOnRef = useRef(false);
  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    // scrollTo is unimplemented in jsdom; guard so tests and SSR stay happy.
    el?.scrollTo?.({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking, suggestions, streamingText]);

  // Keep refs of fast-changing state so async callbacks read current values.
  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);
  useEffect(() => {
    micPermissionRef.current = micPermission;
  }, [micPermission]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Detect whether voice is available; fully stop mic + synth on unmount
  // (e.g. navigating away from the interview).
  useEffect(() => {
    mountedRef.current = true;
    let alive = true;
    let unwatch: (() => void) | undefined;
    const check = isSpeechAvailable();
    voiceCheckRef.current = check;
    void check.then((ok) => {
      if (!alive) return;
      setVoiceAvailable(ok);
      setVoiceChecking(false);
    });
    void getMicPermissionState().then((state) => {
      if (!alive) return;
      setMicPermission(state);
      // Surface a blocked mic immediately, without waiting for a failed attempt.
      if (state === 'denied') setVoiceError('NotAllowedError: Permission denied');
    });
    void watchMicPermission((state) => {
      if (!alive) return;
      setMicPermission(state);
      if (state === 'denied') setVoiceError('NotAllowedError: Permission denied');
      else if (state === 'granted') setVoiceError(null);
    }).then((unsub) => {
      if (!alive) unsub();
      else unwatch = unsub;
    });
    return () => {
      alive = false;
      mountedRef.current = false;
      unwatch?.();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      stopSpeaking();
    };
  }, []);

  // On mount, pick 2 random distinct topics for the user to choose from.
  // This avoids the AI producing a follow-up-style opening question.
  useEffect(() => {
    const pool = [...LIFE_TOPIC_POOL];
    const i1 = Math.floor(Math.random() * pool.length);
    const [t1] = pool.splice(i1, 1);
    const i2 = Math.floor(Math.random() * pool.length);
    setTopicOptions([t1, pool[i2]]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the read-aloud preference; stop talking immediately when turned off.
  // Also keep ttsOnRef in sync so stale closures can read the current value.
  useEffect(() => {
    ttsOnRef.current = ttsOn;
    localStorage.setItem('mcap_tts', ttsOn ? '1' : '0');
    if (!ttsOn) stopSpeaking();
  }, [ttsOn]);

  // Read each new AI question aloud when read-aloud is on, then auto-start the mic
  // so the storyteller can answer immediately without pressing anything.
  useEffect(() => {
    if (!ttsOn || pausedRef.current) return;
    const idx = messages.length - 1;
    const last = messages[idx];
    if (last && last.who === 'ai' && idx > lastSpokeRef.current) {
      lastSpokeRef.current = idx;
      void (async () => {
        setAiSpeaking(true);
        await speak(last.text, persona.voice);
        if (!mountedRef.current) return;
        setAiSpeaking(false);
        if (modeRef.current === 'ai' && !pausedRef.current) void startListening();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, ttsOn]);

  // Drive waveform bars from live audio frequency data while the AI is speaking.
  useEffect(() => {
    if (!aiSpeaking) { setWaveData([]); return; }
    let alive = true;
    const tick = () => {
      const analyser = getAnalyser();
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        setWaveData(Array.from(data.slice(0, 38)));
      }
      if (alive) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => { alive = false; };
  }, [aiSpeaking]);

  // Keep the most recent spoken words visible by scrolling the input to the end.
  const scrollInputToEnd = () => {
    const el = inputRef.current;
    if (el) {
      el.scrollLeft = el.scrollWidth;
      const end = el.value.length;
      try {
        el.setSelectionRange(end, end);
      } catch {
        // some input states don't support selection ranges
      }
    }
  };

  const setComposeText = (value: string) => {
    setText(value);
    requestAnimationFrame(scrollInputToEnd);
  };

  const stopListening = () => {
    clearSilenceTimer();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  };

  const startListening = async () => {
    if (listeningRef.current || pausedRef.current) return;
    // Already known blocked (from the proactive check or a prior failed attempt) —
    // no browser will re-show the prompt for us, so don't waste a real attempt.
    if (micPermissionRef.current === 'denied') {
      setVoiceError('NotAllowedError: Permission denied');
      return;
    }
    baseTextRef.current = text;
    setVoiceError(null);
    const rec = await startRecognition({
      onInterim: (t) => {
        clearSilenceTimer();
        setComposeText((baseTextRef.current + ' ' + t).trim());
      },
      onFinal: (t) => {
        baseTextRef.current = (baseTextRef.current + ' ' + t).trim();
        setComposeText(baseTextRef.current);
        clearSilenceTimer();
        // Auto-submit 2.5 s after the last recognised speech segment.
        silenceTimerRef.current = setTimeout(() => {
          if (modeRef.current === 'ai' && baseTextRef.current.trim()) {
            stopListening();
            answer(baseTextRef.current);
          }
        }, 2500);
      },
      onError: (detail) => {
        if (mountedRef.current) {
          setVoiceError(detail);
          // The Permissions API is unavailable in some browsers (e.g. Safari) — a
          // NotAllowedError from an actual attempt is just as definitive as a
          // 'denied' query result, so record it the same way either way.
          if (/NotAllowedError/i.test(detail)) setMicPermission('denied');
        }
        stopListening();
      },
    });
    if (!mountedRef.current) {
      rec?.stop();
      return;
    }
    if (rec) {
      recognitionRef.current = rec;
      setListening(true);
    } else {
      setVoiceAvailable(false);
    }
  };

  const toggleListening = () => (listening ? stopListening() : void startListening());

  const toTranscript = useCallback(
    (msgs: Bubble[]): TranscriptTurn[] =>
      msgs.map((m) => ({
        who: m.who,
        text: m.text,
        askerLabel: m.asker,
        ts: 0,
      })),
    [],
  );

  const addNoticed = (incoming: ExtractedEntity[]) => {
    setNoticed((prev) => {
      const seen = new Set(prev.map((n) => n.text.toLowerCase()));
      const next = [...prev];
      incoming.forEach((n) => {
        if (!seen.has(n.text.toLowerCase())) {
          seen.add(n.text.toLowerCase());
          next.push(n);
        }
      });
      return next.slice(0, 12);
    });
  };

  const refreshSuggestions = useCallback(async () => {
    const list = await engine.suggestQuestions(
      { profile, persona, transcript: toTranscript(messages) },
      3,
    );
    setSuggestions(list);
  }, [engine, profile, persona, messages, toTranscript]);

  // Refresh follow-up suggestions whenever it's the asker's turn (Manual mode).
  useEffect(() => {
    if (mode === 'manual' && phase === 'question' && !thinking) void refreshSuggestions();
    if (mode === 'ai') setSuggestions([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, phase, thinking, messages.length]);

  // Reset per-topic state when the interviewer pivots to a new subject.
  const resetTopicTracking = () => {
    currentTopicMemoryIdRef.current = null;
    currentTopicAnswersRef.current = [];
    currentTopicFirstQRef.current = undefined;
  };

  const captureAnswer = async (val: string, question?: string) => {
    setTurns((n) => n + 1);

    // Accumulate all answers for the current topic so the model can extract
    // a richer, more complete memory card from the full conversation thread.
    currentTopicAnswersRef.current.push(val);
    const combinedText = currentTopicAnswersRef.current.join('\n');
    if (!currentTopicFirstQRef.current) currentTopicFirstQRef.current = question;

    const result = await engine.extract(combinedText, noticed);

    // Always keep the accumulated answer text up to date, even if extraction
    // doesn't produce a title (e.g. a short follow-up answer).
    if (currentTopicMemoryIdRef.current) {
      const memId = currentTopicMemoryIdRef.current;
      setMemories((prev) => prev.map((m) => m.id === memId ? { ...m, answer: combinedText } : m));
    }

    if (result.title) {
      if (currentTopicMemoryIdRef.current) {
        // Follow-up answer on the same topic: update the existing card with richer content.
        const memId = currentTopicMemoryIdRef.current;
        setMemories((prev) => prev.map((m) => m.id === memId ? {
          ...m,
          title: result.title!,
          excerpt: result.excerpt,
          era: result.era,
          theme: result.theme || m.theme,
          summary: result.summary,
          answer: combinedText,
          people: result.people,
          places: result.places,
          years: result.years,
        } : m));
      } else {
        // First answer on a new topic: create a card and start the illustration.
        const card: Memory = {
          id: 'm' + Date.now(),
          title: result.title,
          excerpt: result.excerpt,
          era: result.era,
          palette: PALETTES[memories.length % PALETTES.length],
          theme: result.theme || 'Your story',
          createdAt: Date.now(),
          question: currentTopicFirstQRef.current,
          answer: combinedText,
          summary: result.summary,
          people: result.people,
          places: result.places,
          years: result.years,
        };
        currentTopicMemoryIdRef.current = card.id;
        setMemories((prev) => [...prev, card]);
        // Fire-and-forget illustration; image swaps in when ready (~20–30 s).
        setIllustratingIds((prev) => new Set([...prev, card.id]));
        void illustrateMemory({
          memoryId: card.id,
          title: card.title,
          summary: card.summary,
          theme: card.theme,
          era: card.era,
        }).then((result) => {
          setIllustratingIds((prev) => { const s = new Set(prev); s.delete(card.id); return s; });
          if (!result) return;
          const { imageUrl, imageThumbnailUrl } = result;
          if (mountedRef.current) {
            setMemories((prev) => prev.map((m) => m.id === card.id ? { ...m, imageUrl, imageThumbnailUrl } : m));
          }
          void updateMemory(profile.id, card.id, { imageUrl, imageThumbnailUrl });
        });
      }
      addNoticed([
        ...result.people.map((p) => ({ kind: 'person' as const, text: p.text, relation: p.relation })),
        ...result.places.map((text) => ({ kind: 'place' as const, text })),
        ...result.years.map((text) => ({ kind: 'year' as const, text })),
      ]);
    }
    return result;
  };

  const aiFollowUp = (msgs: Bubble[]) => {
    setThinking(true);
    setStreamingText('');
    // A short warm pause before the companion responds, then stream its reply.
    setTimeout(async () => {
      const q = await engine.nextQuestion(
        { profile, persona, transcript: toTranscript(msgs) },
        (textSoFar) => setStreamingText(textSoFar),
      );
      setThinking(false);
      setStreamingText('');
      setMessages((m) => [...m, { who: 'ai', text: q }]);
    }, 600);
  };

  // Manually pivot to a new life-experience topic and reset the pacing counter.
  const handleNextTopic = () => {
    if (thinking) return;
    const transcriptText = messages.map((m) => m.text).join(' ');
    const q = pickNewTopic(transcriptText);
    topicTurnsRef.current = 0;
    pivotAtRef.current = randomBetween(6, 8);
    resetTopicTracking();
    setThinking(true);
    setTimeout(() => {
      if (!mountedRef.current) return;
      setThinking(false);
      setMessages((m) => [...m, { who: 'ai', text: q }]);
    }, 500);
  };

  const confirmContinueTopic = () => {
    setTopicPromptPending(false);
    aiFollowUp(pendingNextMsgsRef.current);
  };

  const confirmNewTopic = () => {
    setTopicPromptPending(false);
    topicTurnsRef.current = 0;
    pivotAtRef.current = randomBetween(6, 8);
    resetTopicTracking();
    const transcriptText = pendingNextMsgsRef.current.map((m) => m.text).join(' ');
    const pivotQ = pickNewTopic(transcriptText);
    setThinking(true);
    setTimeout(() => {
      if (!mountedRef.current) return;
      setThinking(false);
      setMessages((m) => [...m, { who: 'ai', text: pivotQ }]);
    }, 600);
  };

  const askQuestion = (q?: string) => {
    const val = (q != null ? q : text).trim();
    if (!val || thinking) return;
    setText('');
    stopListening();
    setMessages((m) => [...m, { who: 'asker', text: val, asker: askerName }]);
    setPhase('answer');
  };

  const answer = (forceVal?: string) => {
    const val = (forceVal ?? text).trim();
    if (!val || thinking) return;
    setText('');
    setTopicPromptPending(false);
    stopListening();
    // The most recent non-answer turn is the question that prompted this memory.
    const question = [...messages].reverse().find((m) => m.who !== 'storyteller')?.text;
    const nextMsgs: Bubble[] = [...messages, { who: 'storyteller', text: val }];
    setMessages(nextMsgs);
    if (mode === 'ai') {
      setThinking(true);
      void captureAnswer(val, question).then(() => {
        if (!mountedRef.current) return;
        // Count this turn and decide: follow up on current topic or pivot.
        topicTurnsRef.current += 1;
        if (topicTurnsRef.current >= pivotAtRef.current) {
          pendingNextMsgsRef.current = nextMsgs;
          setThinking(false);
          setTopicPromptPending(true);
        } else {
          aiFollowUp(nextMsgs);
        }
      });
    } else {
      void captureAnswer(val, question);
      setPhase('question');
    }
  };

  const send = () => {
    if (mode !== 'ai' && phase === 'question') askQuestion();
    else answer();
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const switchMode = (id: Mode) => {
    setMode(id);
    setText('');
    if (id === 'ai') {
      const last = messages[messages.length - 1];
      setPhase('answer');
      if (last && last.who !== 'ai') aiFollowUp(messages);
    } else {
      setPhase('question');
    }
  };

  const onChangePersona = (id: StorytellerProfile['personaId']) => {
    void changePersona(profile.id, id);
    setPickerOpen(false);
  };

  // User selects a conversation topic from the picker — this click doubles as the
  // browser audio gesture, so if read-aloud is on we speak the opening question
  // here before starting the mic (voice always opens the mic either way).
  const selectTopic = async (idx: number) => {
    if (!topicOptions) return;
    const t = topicOptions[idx];
    const q = t.questions[0];
    setTopicOptions(null);
    // Set before setMessages() so the [messages, ttsOn] effect — which is already
    // "live" if read-aloud defaults to on — sees idx(0) > lastSpokeRef and skips,
    // leaving the explicit speak() below as the only one that runs.
    lastSpokeRef.current = 0;
    setMessages([{ who: 'ai', text: q }]);
    // Wait for the definitive check rather than the (possibly still-pending) state —
    // otherwise a click that beats isSpeechAvailable() to resolve reads a stale
    // `false` and silently skips both TTS and the mic for the whole session.
    const available = await voiceCheckRef.current;
    if (!mountedRef.current || !available) return;
    if (!ttsOnRef.current) {
      void startListening();
      return;
    }
    setAiSpeaking(true);
    await speak(q, persona.voice);
    if (!mountedRef.current) return;
    setAiSpeaking(false);
    void startListening();
  };


  const selectCustomTopic = async () => {
    const q = "What would you like to talk about today? It can be anything — a person, a place, a time in your life, or a feeling.";
    setTopicOptions(null);
    lastSpokeRef.current = 0;
    setMessages([{ who: 'ai', text: q }]);
    const available = await voiceCheckRef.current;
    if (!mountedRef.current || !available) return;
    if (!ttsOnRef.current) {
      void startListening();
      return;
    }
    setAiSpeaking(true);
    await speak(q, persona.voice);
    if (!mountedRef.current) return;
    setAiSpeaking(false);
    void startListening();
  };

  const pauseSession = () => {
    stopSpeaking();
    stopListening();
    pausedRef.current = true;
    setPaused(true);
  };

  const resumeSession = () => {
    pausedRef.current = false;
    setPaused(false);
    const lastAiMsg = [...messages].reverse().find((m) => m.who === 'ai');
    if (lastAiMsg && ttsOn) {
      setAiSpeaking(true);
      void speak(lastAiMsg.text, persona.voice).then(() => {
        if (!mountedRef.current) return;
        setAiSpeaking(false);
        if (modeRef.current === 'ai') void startListening();
      });
    } else if (modeRef.current === 'ai') {
      void startListening();
    }
  };

  const endSession = () => {
    const minutes = Math.max(1, Math.round((Date.now() - startRef.current) / 60000));
    const result: SessionResult = {
      memories,
      noticed,
      turns,
      minutes,
      transcript: toTranscript(messages),
    };
    void finishSession(profile.id, result);
    navigate('/summary', { state: { session: result } });
  };

  const askingNow = mode !== 'ai' && phase === 'question';
  const interviewStarted = messages.length > 0 && !topicOptions;
  const statusText = paused
    ? 'Paused'
    : thinking
      ? 'Thinking'
      : askingNow
        ? 'Your turn to ask'
        : listening
          ? 'Listening…'
          : 'Listening';

  const placeholder = askingNow
    ? `Ask ${first} a question…`
    : `${first}'s answer — speak or type…`;

  const newest = memories[memories.length - 1];

  return (
    <div className="iv">
      {/* stage */}
      <div className="iv__stage">
        <div className="iv__stagetop">
          <div className="iv__blooms" aria-hidden="true">
            <div style={{ position: 'absolute', left: '8%', top: '-20%', width: 240, height: 240 }}>
              <Bloom color="var(--bloom-a)" r={38} seed={2} />
            </div>
            <div
              className="bloom--optional"
              style={{ position: 'absolute', right: '6%', top: '-12%', width: 200, height: 200 }}
            >
              <Bloom color="var(--bloom-c)" r={36} seed={7} />
            </div>
          </div>
          <VoiceOrb
            persona={persona.glyph}
            size={108}
            aiSpeaking={aiSpeaking}
            listening={listening}
          />
          {(aiSpeaking || listening) && (
            <Waveform
              active={aiSpeaking || listening}
              liveData={waveData}
              color={aiSpeaking ? '#7c6af7' : '#4aab8a'}
            />
          )}
          <div className="iv__status">
            <span className="dot" /> {statusText}
          </div>
          <div className="iv__interviewer">
            <button
              className="iv__interviewer-btn"
              onClick={() => setPickerOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={pickerOpen}
              title="Change interviewer"
            >
              <span className="iv__persona-name">{persona.name}</span>
              <Icon
                name="chev"
                size={15}
                style={{ transform: pickerOpen ? 'rotate(180deg)' : 'none' }}
              />
            </button>
            {pickerOpen && (
              <>
                <button
                  type="button"
                  className="iv__picker-backdrop"
                  aria-label="Close interviewer picker"
                  onClick={() => setPickerOpen(false)}
                />
                <div className="iv__picker" role="menu">
                  <div className="pm-label">Choose your interviewer</div>
                  {PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      role="menuitem"
                      className={'iv__picker-item' + (p.id === persona.id ? ' is-active' : '')}
                      onClick={() => onChangePersona(p.id)}
                    >
                      <div
                        className="iv__picker-av"
                        style={{
                          background: `radial-gradient(120% 120% at 30% 20%, var(--bloom-b), ${p.accent})`,
                        }}
                      >
                        {p.glyph}
                      </div>
                      <div className="iv__picker-txt">
                        <div className="iv__picker-name">{p.name}</div>
                        <div className="iv__picker-blurb">{p.blurb}</div>
                      </div>
                      {p.id === persona.id ? (
                        <span className="pm-check">
                          <Icon name="check" size={14} />
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* mode switcher */}
          <div className="iv__modes" role="tablist" aria-label="Interview mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                className={'iv__mode' + (mode === m.id ? ' is-active' : '')}
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => switchMode(m.id)}
              >
                <Icon name={m.icon} size={15} /> {m.label}
              </button>
            ))}
          </div>
          <div className="iv__mode-sub">{MODES.find((m) => m.id === mode)?.sub}</div>
          {topicOptions ? (
            <div className="iv__topic-picker">
              <div className="iv__topic-label">Choose a topic to begin</div>
              <div className="iv__topic-cards">
                {topicOptions.map((t, i) => (
                  <button
                    key={t.topic}
                    className="iv__topic-card"
                    onClick={() => void selectTopic(i)}
                    disabled={aiSpeaking}
                  >
                    <span className="iv__topic-name">{t.topic}</span>
                    <span className="iv__topic-q">{t.questions[0]}</span>
                  </button>
                ))}
                <button
                  className="iv__topic-card iv__topic-card--custom"
                  onClick={() => void selectCustomTopic()}
                  disabled={aiSpeaking}
                >
                  <span className="iv__topic-name">Choose my own topic</span>
                  <span className="iv__topic-q">Tell the AI what you'd like to talk about</span>
                </button>
              </div>
            </div>
          ) : voiceAvailable && mode !== 'manual' && interviewStarted ? (
            <button
              className="chip"
              aria-pressed={ttsOn}
              onClick={() => setTtsOn((v) => !v)}
              style={{ marginTop: 12 }}
            >
              <Icon name={ttsOn ? 'pause' : 'play'} size={13} />
              {ttsOn ? 'Reading questions aloud' : 'Read questions aloud'}
            </button>
          ) : null}
        </div>

        <div className="iv__transcript" role="log" ref={scrollRef} aria-live="polite" aria-label="Transcript">
          {messages.map((b, i) => (
            <div key={i} className={'bubble bubble--' + b.who}>
              <div className="bubble__who">
                {b.who === 'storyteller' ? first : b.who === 'asker' ? b.asker || 'Family' : persona.name}
              </div>
              <div className={'bubble__text' + (b.who === 'storyteller' ? ' is-serif' : '')}>
                {b.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="bubble bubble--ai">
              <div className="bubble__who">{persona.name}</div>
              {streamingText ? (
                <div className="bubble__text">{streamingText}</div>
              ) : (
                <div className="bubble__text" style={{ display: 'inline-flex', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--ink-3)', animation: 'pulse 1.2s infinite' }} />
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--ink-3)', animation: 'pulse 1.2s infinite .2s' }} />
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--ink-3)', animation: 'pulse 1.2s infinite .4s' }} />
                </div>
              )}
            </div>
          )}
          {topicPromptPending && !thinking && (
            <>
              <div className="bubble bubble--ai">
                <div className="bubble__who">{persona.name}</div>
                <div className="bubble__text">
                  We've covered this topic well. Would you like to keep exploring, or shall we move on to something new?
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
                <button className="chip" onClick={confirmContinueTopic}>
                  <Icon name="quote" size={13} /> Continue this topic
                </button>
                <button className="chip" onClick={confirmNewTopic}>
                  <Icon name="spark" size={13} /> New topic
                </button>
              </div>
            </>
          )}
          {/* Manual mode: suggested questions appear inline in the chat */}
          {mode === 'manual' && askingNow && !thinking && suggestions.length > 0 && (
            <div className="iv__inline-suggestions">
              <div className="iv__qs-head">
                <div className="eyebrow" style={{ color: 'var(--ink-3)', fontSize: 11 }}>Suggested questions — optional</div>
                <button className="iv__qs-refresh" onClick={() => void refreshSuggestions()}>
                  <Icon name="spark" size={13} /> Others
                </button>
              </div>
              <div className="iv__qs-grid">
                {suggestions.map((q, i) => (
                  <button key={i} className="iv__q" onClick={() => askQuestion(q)}>
                    <span className="iv__q-ico"><Icon name="quote" size={14} /></span>
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* turn indicator (manual) */}
        {mode !== 'ai' && (
          <div
            className={'iv__turn ' + (askingNow ? 'iv__turn--ask' : 'iv__turn--answer')}
            style={{ marginBottom: 10 }}
            aria-live="polite"
          >
            <span
              className="who-dot"
              style={{ background: askingNow ? 'var(--accent-3)' : 'var(--accent)' }}
            />
            {askingNow ? `${askerName}'s turn to ask` : `${first} is answering`}
          </div>
        )}

        {/* AI mode: manually advance to a follow-up or a fresh topic */}
        {mode === 'ai' && (
          <div className="iv__ai-actions">
            {voiceChecking ? (
              <span style={{ fontSize: 12, color: 'var(--ink-4)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--ink-4)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                Checking voice…
              </span>
            ) : (
              <>
                {(() => {
                  const lastAiText = [...messages].reverse().find((m) => m.who === 'ai')?.text;
                  return (
                    <button
                      className="chip"
                      disabled={thinking || !voiceAvailable || !lastAiText}
                      onClick={() => lastAiText && void speak(lastAiText, persona.voice)}
                    >
                      <Icon name="repeat" size={13} /> Repeat
                    </button>
                  );
                })()}
                <button
                  className="chip"
                  disabled={thinking}
                  onClick={() => aiFollowUp(messages)}
                >
                  <Icon name="quote" size={13} /> Next question
                </button>
                <button
                  className="chip"
                  disabled={thinking}
                  onClick={handleNextTopic}
                >
                  <Icon name="spark" size={13} /> New topic
                </button>
              </>
            )}
          </div>
        )}

        <div className="iv__dock">
          <div className="iv__mic-wrap">
            <div style={{ position: 'relative' }}>
              <button
                className={'iv__micbtn' + (listening ? ' is-on' : '')}
                title={voiceAvailable ? (listening ? 'Stop recording' : 'Start recording — mic auto-activates after each question') : 'Voice unavailable — type instead'}
                aria-pressed={listening}
                aria-label={listening ? 'Stop recording' : 'Start recording'}
                disabled={!voiceAvailable || paused}
                onClick={() => void toggleListening()}
              >
                <Icon name={listening ? 'mic' : 'mic-off'} size={20} />
              </button>
              {listening && <span className="iv__onair" aria-label="Recording" />}
            </div>
          </div>
          <div className="iv__compose">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
              placeholder={placeholder}
              aria-label={placeholder}
            />
            <button
              className="iv__send"
              onClick={send}
              disabled={!text.trim() || thinking || paused}
              title="Send"
              aria-label="Send"
            >
              <Icon name="arrow" size={20} />
            </button>
          </div>
          <button
            className={'iv__end' + (paused ? ' is-paused' : '')}
            onClick={paused ? resumeSession : pauseSession}
            title={paused ? 'Resume session' : 'Pause session'}
          >
            <Icon name={paused ? 'play' : 'pause'} size={15} />
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button className="iv__end" onClick={endSession} title="End session">
            <Icon name="check" size={15} /> End
          </button>
        </div>
        <div className="iv__hint">
          {voiceChecking
            ? null
            : !voiceAvailable
              ? '🔇 Voice is unavailable here — you can type your answers. (Voice needs the running API: open the app on the SWA port, e.g. http://localhost:4281, not the Vite port.)'
              : voiceError
                ? /NotAllowedError|Permission denied/i.test(voiceError)
                  ? "🎙️ Microphone access is blocked for this site. Click the padlock/site-info icon in your browser's address bar, set Microphone to Allow (or reset permissions), then reload the page — pressing the mic button again won't help until that's changed."
                  : `🎙️ Microphone stopped: ${voiceError} — press the mic button to try again.`
                : mode === 'manual'
              ? askingNow
                ? `Manual mode: type each question you ask so it's recorded, then capture ${first}'s answer. Suggested questions (right) are optional.`
                : `Now type ${first}'s answer and press Enter — it's saved word for word. Then it's your turn to ask again.`
              : 'Speak aloud, or type the answer and press Enter — words are kept exactly as said.'}
        </div>
        <div style={{ height: 12 }} />
      </div>

      {/* extraction rail */}
      <div className="rail" aria-live="polite" aria-label="Captured so far">
        <div className="rail__head">
          <div className="eyebrow">As you speak</div>
        </div>

        {memories.length === 0 && (
          <div className="rail__empty">
            Every answer {first} gives starts gathering here — a memory card forms with each story,
            no matter who asks the question.
          </div>
        )}

        {newest && (
          <div className="xcard">
            <div className="xmem__art">
              <MemoryArt memory={newest} seed={memories.length + 4} thumbnail />
              {illustratingIds.has(newest.id) && !newest.imageThumbnailUrl && !newest.imageUrl && (
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
            <div className="xcard__label" style={{ paddingTop: 12 }}>
              <Icon name="spark" size={13} /> Newest memory card
              <span style={{ marginLeft: 'auto' }}>
                <span className="rail__count">{memories.length} this session</span>
              </span>
            </div>
            <div className="xmem__title">{newest.title}</div>
            <div className="xcard__body" style={{ paddingTop: 4 }}>
              <span className="mcard__tag">
                <Icon name="calendar" size={13} /> {newest.era}
              </span>
            </div>
          </div>
        )}

        {noticed.length > 0 && (
          <div className="xcard">
            <div className="xcard__label">
              <Icon name="people" size={13} /> Noticed in your words
            </div>
            <div className="xcard__body">
              <div className="noticed-chips">
                {noticed.map((n, i) => (
                  <span className="noticed-chip" key={i}>
                    <Icon name={n.kind === 'year' ? 'calendar' : n.kind === 'place' ? 'pin' : 'people'} size={13} />{' '}
                    {n.text}
                  </span>
                ))}
              </div>
              <div className="xrow__sub" style={{ marginTop: 10 }}>
                Names, places and dates are gathered automatically — you can tidy these up later.
              </div>
            </div>
          </div>
        )}

        {memories.length >= 2 && (
          <div
            className="xcard"
            style={{ background: 'linear-gradient(150deg, var(--surface), var(--surface-2))' }}
          >
            <div className="xcard__body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="quote" size={18} style={{ color: 'var(--accent)' }} />
              <div>
                <div className="xrow__sub" style={{ marginTop: 0, marginBottom: 8 }}>
                  A chapter is forming
                </div>
                <div
                  className="xrow__main"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}
                >
                  You've woven {memories.length} memories together
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
