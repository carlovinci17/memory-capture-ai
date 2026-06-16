import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../App';
import { StoreProvider } from '../lib/store/StoreProvider';

function seed() {
  localStorage.setItem(
    'mcap_mvp_store_v1',
    JSON.stringify({
      profiles: [
        { id: 'p1', name: 'Eleanor', personaId: 'historian', memories: [], sessions: 0, createdAt: 1 },
      ],
      activeId: 'p1',
    }),
  );
}

describe('changing interviewer (repro #4)', () => {
  beforeEach(() => localStorage.clear());

  it('updates the displayed interviewer when picked in the interview', async () => {
    seed();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/interview']}>
        <StoreProvider>
          <App />
        </StoreProvider>
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByRole('tablist', { name: /interview mode/i }));
    // Default historian — scope to the interviewer dropdown button.
    expect(screen.getByRole('button', { name: /curious historian/i })).toBeInTheDocument();
    // Open the picker and choose The Journalist.
    await user.click(screen.getByRole('button', { name: /curious historian/i }));
    const menu = screen.getByRole('menu');
    await user.click(within(menu).getByText('The Journalist'));
    // The interviewer button should now read The Journalist.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /the journalist/i })).toBeInTheDocument(),
    );
  });
});
