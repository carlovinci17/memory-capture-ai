import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';
import { StoreProvider } from './lib/store/StoreProvider';

function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <StoreProvider>
        <App />
      </StoreProvider>
    </MemoryRouter>,
  );
}

describe('App', () => {
  beforeEach(() => localStorage.clear());

  it('routes a first-time visitor to onboarding', async () => {
    renderApp('/');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /let’s begin your story/i })).toBeInTheDocument(),
    );
  });
});
