import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import App from '../App';
import { StoreProvider } from '../lib/store/StoreProvider';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    'mcap_mvp_store_v1',
    JSON.stringify({
      profiles: [
        { id: 'p1', name: 'Eleanor', personaId: 'historian', memories: [], sessions: 0, createdAt: 1 },
      ],
      activeId: 'p1',
    }),
  );
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
    await waitFor(() => screen.getByRole('button', { name: /reset demo data/i }));
    await user.click(screen.getByRole('button', { name: /reset demo data/i }));

    // Lands back on the first-run onboarding form.
    await waitFor(() => expect(screen.getByLabelText('Your name')).toBeInTheDocument());
    const raw = JSON.parse(localStorage.getItem('mcap_mvp_store_v1') || '{}');
    expect(raw.profiles).toHaveLength(0);
  });
});
