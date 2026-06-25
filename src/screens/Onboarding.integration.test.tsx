import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '../App';
import { StoreProvider } from '../lib/store/StoreProvider';

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <StoreProvider>
        <App />
      </StoreProvider>
    </MemoryRouter>,
  );
}

describe('Onboarding → Home flow', () => {
  beforeEach(() => localStorage.clear());

  it('creates a storyteller and lands on Home', async () => {
    const user = userEvent.setup();
    renderApp();

    // Choice step is shown first on a fresh demo visit.
    await waitFor(() => screen.getByRole('button', { name: /try for free/i }));
    await user.click(screen.getByRole('button', { name: /try for free/i }));

    await waitFor(() => screen.getByLabelText('Your name'));
    await user.type(screen.getByLabelText('Your name'), 'Eleanor Marchetti');
    await user.click(screen.getByRole('button', { name: /create my journal/i }));

    // Home greets the storyteller by first name.
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /your story\s*starts here/i })).toBeInTheDocument(),
    );
    expect(screen.getAllByText(/Eleanor/).length).toBeGreaterThan(0);

    // User's profile is first; demo profiles are also seeded.
    const raw = JSON.parse(localStorage.getItem('mcap_mvp_store_v1') || '{}');
    expect(raw.profiles[0].name).toBe('Eleanor Marchetti');
  });
});
