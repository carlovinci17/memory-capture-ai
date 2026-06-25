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

async function createProfile(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => screen.getByRole('button', { name: /try for free/i }));
  await user.click(screen.getByRole('button', { name: /try for free/i }));
  await waitFor(() => screen.getByLabelText('Your name'));
  await user.type(screen.getByLabelText('Your name'), 'Eleanor Marchetti');
  await user.click(screen.getByRole('button', { name: /create my journal/i }));
  await waitFor(() => screen.getByRole('button', { name: /start your first interview/i }));
}

describe('Interview loop (Manual mode)', () => {
  beforeEach(() => localStorage.clear());

  it('captures a verbatim memory card and reflects it in the summary', async () => {
    const user = userEvent.setup();
    renderApp();
    await createProfile(user);

    await user.click(screen.getByRole('button', { name: /start your first interview/i }));

    // Switch to Manual mode so the family asks first (no AI timer path).
    await user.click(screen.getByRole('tab', { name: /manual/i }));

    const compose = await screen.findByLabelText(/Ask Eleanor a question/i);
    await user.type(compose, 'Where were you born?');
    await user.keyboard('{Enter}');

    // Wait for the phase to switch to answer (turn indicator confirms it).
    await waitFor(() =>
      expect(screen.getByText(/Eleanor is answering/i)).toBeInTheDocument(),
    );

    const answerField = screen.getByLabelText(/Eleanor's answer/i);
    await user.type(answerField, 'I was born in Camogli in 1948.');
    await user.keyboard('{Enter}');

    // A memory card forms in the rail.
    await waitFor(() => expect(screen.getByText(/Newest memory card/i)).toBeInTheDocument());
    expect(screen.getByText(/1 this session/i)).toBeInTheDocument();

    // End the session and the summary reflects the captured memory.
    await user.click(screen.getByRole('button', { name: /^end$/i }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /beautifully done/i })).toBeInTheDocument(),
    );
    expect(screen.getByText('Memory captured')).toBeInTheDocument();
  });
});
