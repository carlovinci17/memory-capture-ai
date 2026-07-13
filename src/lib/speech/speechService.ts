// speechService.ts — browser Azure AI Speech (STT + TTS).
// The Speech key never reaches the browser: we fetch a short-lived token from
// /api/speech/token and use it with the SDK. The heavy SDK is lazy-imported
// only when voice is actually used. Voice is always optional — typing works
// regardless, and everything degrades silently when Speech isn't configured.

interface CachedToken {
  token: string;
  region: string;
  expires: number;
}

let cache: CachedToken | null = null;

/** Test helper — clears the in-memory token cache. */
export function _resetTokenCache(): void {
  cache = null;
}

async function getToken(): Promise<CachedToken | null> {
  if (cache && Date.now() < cache.expires) return cache;
  try {
    const res = await fetch('/api/speech/token');
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string; region?: string };
    if (!data.token || !data.region) return null;
    // Tokens last ~10 min; refresh a bit early.
    cache = { token: data.token, region: data.region, expires: Date.now() + 8 * 60 * 1000 };
    return cache;
  } catch {
    return null;
  }
}

/** Whether the Speech token endpoint is reachable + configured. */
export async function isSpeechAvailable(): Promise<boolean> {
  return (await getToken()) !== null;
}

export type MicPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

/**
 * Read the current microphone permission without ever triggering the browser's
 * prompt (Permissions API is query-only). Once a browser reports 'denied', no
 * website can re-trigger that prompt — only the user's own site settings can;
 * this lets the UI say so immediately instead of waiting for a failed attempt.
 */
export async function getMicPermissionState(): Promise<MicPermissionState> {
  try {
    if (!navigator.permissions?.query) return 'unsupported';
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return status.state as MicPermissionState;
  } catch {
    return 'unsupported';
  }
}

/**
 * Live-updates when the storyteller changes the mic permission in their browser's
 * site settings while this tab stays open (e.g. switching Block → Allow), so the
 * app can recover without requiring a reload. Returns an unsubscribe function;
 * a no-op if the Permissions API isn't available (e.g. some Safari versions).
 */
export async function watchMicPermission(
  onChange: (state: MicPermissionState) => void,
): Promise<() => void> {
  try {
    if (!navigator.permissions?.query) return () => {};
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    const handler = () => onChange(status.state as MicPermissionState);
    status.addEventListener('change', handler);
    return () => status.removeEventListener('change', handler);
  } catch {
    return () => {};
  }
}

export interface Recognition {
  stop(): void;
}

export interface RecognitionHandlers {
  /** Interim (in-progress) hypothesis for the current utterance. */
  onInterim: (text: string) => void;
  /** A finalized utterance segment. */
  onFinal: (text: string) => void;
  onError?: (detail: string) => void;
}

/**
 * Start continuous speech-to-text from the default microphone.
 * Returns a handle to stop it, or null if Speech is unavailable.
 */
export async function startRecognition(handlers: RecognitionHandlers): Promise<Recognition | null> {
  const t = await getToken();
  if (!t) return null;
  try {
    const SDK = await import('microsoft-cognitiveservices-speech-sdk');
    const speechConfig = SDK.SpeechConfig.fromAuthorizationToken(t.token, t.region);
    speechConfig.speechRecognitionLanguage = 'en-US';
    const audioConfig = SDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SDK.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizing = (_s, e) => handlers.onInterim(e.result.text);
    recognizer.recognized = (_s, e) => {
      if (e.result.text) handlers.onFinal(e.result.text);
    };
    recognizer.canceled = (_s, e) => {
      // eslint-disable-next-line no-console -- STT failures otherwise leave no trace at all
      console.warn('[speech] recognition canceled:', e.reason, e.errorDetails);
      handlers.onError?.(e.errorDetails || String(e.reason));
    };

    recognizer.startContinuousRecognitionAsync(
      undefined,
      // eslint-disable-next-line no-console
      (err) => { console.warn('[speech] startContinuousRecognitionAsync failed:', err); handlers.onError?.(String(err)); },
    );
    return {
      stop() {
        recognizer.stopContinuousRecognitionAsync(
          () => recognizer.close(),
          () => recognizer.close(),
        );
      },
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[speech] startRecognition failed:', err);
    handlers.onError?.(String(err));
    return null;
  }
}

// ─── Web Audio chain for live waveform visualisation ─────────────────────────
let audioCtx: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let activeSource: AudioBufferSourceNode | null = null;
// Bumped by stopSpeaking() so an in-flight speak() bails instead of starting
// audio after the user navigated away or toggled read-aloud off.
let speakGeneration = 0;

/** Returns the live AnalyserNode while the AI is speaking, null otherwise. */
export function getAnalyser(): AnalyserNode | null {
  return analyserNode;
}

/** Escape XML-reserved chars for safe embedding in SSML. */
function escapeXml(t: string): string {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wrap plain text in SSML — slightly slower rate removes the robotic edge.
 * This is the single biggest quality improvement over plain speakTextAsync.
 */
function toSsml(text: string, voice: string): string {
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">` +
    `<voice name="${voice}"><prosody rate="-5%">${escapeXml(text)}</prosody></voice>` +
    `</speak>`
  );
}

/** Speak text aloud with a (per-interviewer) neural voice. No-op if unavailable. */
export async function speak(text: string, voice = 'en-US-JennyNeural'): Promise<void> {
  if (!text.trim()) return;
  stopSpeaking(); // cancel any in-flight speech before starting a new one
  const gen = speakGeneration;
  const t = await getToken();
  if (!t || gen !== speakGeneration) return; // cancelled while fetching token
  try {
    const SDK = await import('microsoft-cognitiveservices-speech-sdk');
    if (gen !== speakGeneration) return; // cancelled while loading the SDK

    const speechConfig = SDK.SpeechConfig.fromAuthorizationToken(t.token, t.region);
    speechConfig.speechSynthesisVoiceName = voice;

    // Route audio to a pull stream so we can play it ourselves through Web Audio.
    // This prevents the SDK from auto-playing and lets us attach an AnalyserNode
    // for the live waveform visualisation.
    const pullStream = SDK.AudioOutputStream.createPullStream();
    const audioOutputConfig = SDK.AudioConfig.fromStreamOutput(pullStream);
    const synth = new SDK.SpeechSynthesizer(speechConfig, audioOutputConfig);

    const result = await new Promise<{ audioData?: ArrayBuffer }>((resolve, reject) =>
      synth.speakSsmlAsync(toSsml(text, voice), resolve as (r: unknown) => void, reject),
    );
    synth.close();

    if (gen !== speakGeneration) return;

    const audioData = result?.audioData;
    if (!audioData || audioData.byteLength === 0) return;

    // Init AudioContext (must be resumed after a user gesture — mic click qualifies).
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    if (gen !== speakGeneration) return;

    // Decode the synthesized audio and route: source → analyser → speakers.
    const buffer = await audioCtx.decodeAudioData(audioData.slice(0)); // slice to avoid detach
    if (gen !== speakGeneration) return;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128; // 64 bins — enough for 38 waveform bars

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);
    analyser.connect(audioCtx.destination); // still plays through the speaker

    analyserNode = analyser;
    activeSource = source;
    source.start();

    await new Promise<void>((resolve) => {
      source.onended = () => resolve();
    });
  } catch {
    // TTS is a non-essential enhancement — fail silently
  } finally {
    analyserNode = null;
    activeSource = null;
  }
}

/** Stop any in-progress (or pending) synthesis. */
export function stopSpeaking(): void {
  speakGeneration += 1;
  try {
    activeSource?.stop();
  } catch {
    // already stopped or not yet started
  }
  activeSource = null;
  analyserNode = null;
}
