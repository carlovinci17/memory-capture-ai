import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import App from './App';
import { StoreProvider } from './lib/store/StoreProvider';

expect.extend(toHaveNoViolations as unknown as Parameters<typeof expect.extend>[0]);

const profile = {
  id: 'p1',
  name: 'Eleanor Marchetti',
  yearBorn: '1948',
  birthplace: 'Camogli',
  personaId: 'historian',
  memories: [],
  sessions: 0,
  createdAt: 1,
};

function seed() {
  localStorage.setItem('mcap_mvp_store_v1', JSON.stringify({ profiles: [profile], activeId: 'p1' }));
}

function renderRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <StoreProvider>
        <App />
      </StoreProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());

describe('accessibility (axe)', () => {
  it('onboarding has no violations', async () => {
    const { container } = renderRoute('/onboarding');
    await waitFor(() => screen.getByRole('button', { name: /try for free/i }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('home has no violations', async () => {
    seed();
    const { container } = renderRoute('/home');
    await waitFor(() => screen.getByRole('heading', { name: /your story/i }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('profiles list has no violations', async () => {
    seed();
    const { container } = renderRoute('/profiles');
    await waitFor(() => screen.getByRole('heading', { name: /^profiles$/i }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('interview has no violations', async () => {
    seed();
    const { container } = renderRoute('/interview');
    await waitFor(() => screen.getByRole('tablist', { name: /interview mode/i }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
