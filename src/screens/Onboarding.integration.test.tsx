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

    await waitFor(() => screen.getByLabelText('Your name'));
    await user.type(screen.getByLabelText('Your name'), 'Eleanor Marchetti');
    await user.click(screen.getByRole('button', { name: /create my journal/i }));

    // Home greets the storyteller by first name.
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /your story\s*starts here/i })).toBeInTheDocument(),
    );
    expect(screen.getAllByText(/Eleanor/).length).toBeGreaterThan(0);

    // And it persisted to the repository.
    const raw = JSON.parse(localStorage.getItem('mcap_mvp_store_v1') || '{}');
    expect(raw.profiles).toHaveLength(1);
    expect(raw.profiles[0].name).toBe('Eleanor Marchetti');
  });
});
