import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../App';
import { StoreProvider } from '../lib/store/StoreProvider';

const memory = {
  id: 'mem1',
  title: 'Leaving Camogli',
  excerpt: 'It was September 1967…',
  answer: 'It was September 1967 when I left. My father kept coiling the same rope on the quay.',
  question: 'Take me back to the morning you left Camogli.',
  era: '1967',
  theme: 'Home',
  palette: ['#D98C8C', '#E2A07E'],
  people: [{ text: 'Giovanni', relation: 'father' }],
  places: ['Camogli'],
  years: ['1967'],
  createdAt: 1,
};

function seed() {
  localStorage.setItem(
    'mcap_mvp_store_v1',
    JSON.stringify({
      profiles: [
        { id: 'p1', name: 'Eleanor', personaId: 'historian', memories: [memory], sessions: 1, createdAt: 1 },
      ],
      activeId: 'p1',
    }),
  );
}

describe('memory detail view (#5)', () => {
  beforeEach(() => localStorage.clear());

  it('shows the question, the verbatim answer, and noticed entities', async () => {
    const user = userEvent.setup();
    seed();
    render(
      <MemoryRouter initialEntries={['/memories/mem1']}>
        <StoreProvider>
          <App />
        </StoreProvider>
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByRole('heading', { name: /leaving camogli/i }));
    expect(screen.getByText(/take me back to the morning/i)).toBeInTheDocument();
    // Full answer is in the collapsible conversation section — expand it first
    await user.click(screen.getByRole('button', { name: /see the conversation/i }));
    expect(screen.getByText(/coiling the same rope/i)).toBeInTheDocument();
    expect(screen.getByText('Giovanni')).toBeInTheDocument();
    expect(screen.getByText('Camogli')).toBeInTheDocument();
  });

  it('shows the full conversation transcript when the expand button is clicked', async () => {
    const user = userEvent.setup();
    const withTranscript = {
      ...memory,
      transcript: [
        { who: 'ai', text: 'Take me back to the harbour.', ts: 0 },
        { who: 'storyteller', text: 'It was September 1967.', ts: 0 },
        { who: 'ai', text: 'And what did you carry with you?', ts: 0 },
        { who: 'storyteller', text: 'One brown suitcase and a tin of amaretti.', ts: 0 },
      ],
    };
    localStorage.setItem(
      'mcap_mvp_store_v1',
      JSON.stringify({
        profiles: [
          { id: 'p1', name: 'Eleanor', personaId: 'historian', memories: [withTranscript], sessions: 1, createdAt: 1 },
        ],
        activeId: 'p1',
      }),
    );
    render(
      <MemoryRouter initialEntries={['/memories/mem1']}>
        <StoreProvider>
          <App />
        </StoreProvider>
      </MemoryRouter>,
    );
    // Transcript is collapsed by default; expand it first
    await waitFor(() => screen.getByRole('button', { name: /see the conversation/i }));
    await user.click(screen.getByRole('button', { name: /see the conversation/i }));
    expect(screen.getByText(/and what did you carry with you/i)).toBeInTheDocument();
    expect(screen.getByText(/tin of amaretti/i)).toBeInTheDocument();
  });
});
