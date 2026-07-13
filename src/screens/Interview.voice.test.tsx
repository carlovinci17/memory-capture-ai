// Regression test for a race between the mount-time isSpeechAvailable() check
// and the user clicking a topic card before that check resolves. Selecting a
// topic used to read the `voiceAvailable` state snapshot directly — if the
// check was still pending at click time, the read came back stale-`false` and
// silently skipped both TTS and the mic for the rest of the session.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../App';
import { StoreProvider } from '../lib/store/StoreProvider';
import { isSpeechAvailable, speak, startRecognition } from '../lib/speech/speechService';

vi.mock('../lib/speech/speechService', () => ({
  isSpeechAvailable: vi.fn(),
  speak: vi.fn().mockResolvedValue(undefined),
  stopSpeaking: vi.fn(),
  startRecognition: vi.fn().mockResolvedValue({ stop: vi.fn() }),
  getAnalyser: vi.fn().mockReturnValue(null),
}));

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <StoreProvider>
        <App />
      </StoreProvider>
    </MemoryRouter>,
  );
}

async function createProfile(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => screen.getByRole('button', { name: /try for free/i }));
  await user.click(screen.getByRole('button', { name: /try for free/i }));
  await waitFor(() => screen.getByLabelText('Your name'));
  await user.type(screen.getByLabelText('Your name'), 'Yuki Tanaka');
  await user.click(screen.getByRole('button', { name: /create my journal/i }));
  await waitFor(() => screen.getByRole('button', { name: /start your first interview/i }));
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('Interview voice startup race', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.clearAllMocks());

  it('still speaks and opens the mic when the topic is picked before the voice check resolves', async () => {
    const gate = deferred<boolean>();
    vi.mocked(isSpeechAvailable).mockReturnValue(gate.promise);

    const user = userEvent.setup();
    renderApp();
    await createProfile(user);
    await user.click(screen.getByRole('button', { name: /start your first interview/i }));

    // Click before the voice check has settled — this is the racy path.
    const customTopicBtn = await screen.findByRole('button', { name: /choose my own topic/i });
    await user.click(customTopicBtn);
    expect(speak).not.toHaveBeenCalled();

    // Now let the check resolve (as if the token endpoint was just slow).
    gate.resolve(true);

    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    expect(speak).toHaveBeenCalledWith(expect.stringMatching(/what would you like to talk about/i), expect.any(String));
    await waitFor(() => expect(startRecognition).toHaveBeenCalledTimes(1));
  });

  it('does not speak or open the mic when the voice check resolves false', async () => {
    const gate = deferred<boolean>();
    vi.mocked(isSpeechAvailable).mockReturnValue(gate.promise);

    const user = userEvent.setup();
    renderApp();
    await createProfile(user);
    await user.click(screen.getByRole('button', { name: /start your first interview/i }));

    const customTopicBtn = await screen.findByRole('button', { name: /choose my own topic/i });
    await user.click(customTopicBtn);
    gate.resolve(false);

    await screen.findByText(/what would you like to talk about/i);
    expect(speak).not.toHaveBeenCalled();
    expect(startRecognition).not.toHaveBeenCalled();
  });

  it('defaults read-aloud to on for a first-time visitor (no stored preference)', async () => {
    vi.mocked(isSpeechAvailable).mockResolvedValue(true);

    const user = userEvent.setup();
    renderApp();
    await createProfile(user);
    await user.click(screen.getByRole('button', { name: /start your first interview/i }));

    const customTopicBtn = await screen.findByRole('button', { name: /choose my own topic/i });
    await user.click(customTopicBtn);

    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(startRecognition).toHaveBeenCalledTimes(1));
  });

  it('honors a previously stored "read aloud off" preference — mic still opens, but no TTS', async () => {
    localStorage.setItem('mcap_tts', '0');
    vi.mocked(isSpeechAvailable).mockResolvedValue(true);

    const user = userEvent.setup();
    renderApp();
    await createProfile(user);
    await user.click(screen.getByRole('button', { name: /start your first interview/i }));

    const customTopicBtn = await screen.findByRole('button', { name: /choose my own topic/i });
    await user.click(customTopicBtn);

    await waitFor(() => expect(startRecognition).toHaveBeenCalledTimes(1));
    expect(speak).not.toHaveBeenCalled();
  });
});
