import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import App from '../App';
import { StoreProvider } from '../lib/store/StoreProvider';

beforeEach(() => {
  localStorage.clear();
  // Enable demo mode so the "Reset / Clear my data" banner button is visible.
  localStorage.setItem('mcap_mode', 'demo');
  localStorage.setItem(
    'mcap_mvp_store_v1',
    JSON.stringify({
      profiles: [
        { id: 'p1', name: 'Eleanor', personaId: 'historian', memories: [], sessions: 0, createdAt: 1 },
      ],
      activeId: 'p1',
    }),
  );
  // Other app settings a returning visitor may have changed — these should not
  // survive a "Reset / Clear my data", or it isn't really a fresh-start reset.
  localStorage.setItem('mcap_sidebar_collapsed', '1');
  localStorage.setItem('mcap_a11y_textsize', '1');
  localStorage.setItem('mcap_a11y_contrast', '1');
  localStorage.setItem('mcap_tts', '0');
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});
afterEach(() => vi.restoreAllMocks());

describe('Reset demo data', () => {
  it('clears all profiles and returns to onboarding', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/home']}>
        <StoreProvider>
          <App />
        </StoreProvider>
      </MemoryRouter>,
    );
    // "Reset / Clear my data" lives in the demo-mode banner at the top of every page.
    await waitFor(() => screen.getByRole('button', { name: /clear my data/i }));
    await user.click(screen.getByRole('button', { name: /clear my data/i }));

    // Lands back on the onboarding choice screen.
    await waitFor(() => expect(screen.getByRole('button', { name: /try for free/i })).toBeInTheDocument());
    // The store key itself is wiped, not just emptied, as part of the full reset.
    expect(localStorage.getItem('mcap_mvp_store_v1')).toBeNull();
  });

  it('wipes every app setting, not just the profiles, so it is a genuine first-visit reset', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/home']}>
        <StoreProvider>
          <App />
        </StoreProvider>
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByRole('button', { name: /clear my data/i }));
    await user.click(screen.getByRole('button', { name: /clear my data/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /try for free/i })).toBeInTheDocument());
    const remainingMcapKeys = Object.keys(localStorage).filter((key) => key.startsWith('mcap_'));
    expect(remainingMcapKeys).toEqual([]);
  });
});
