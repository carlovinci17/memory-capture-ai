import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { RouteChangeTracker } from './RouteChangeTracker';

function renderTracker(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <RouteChangeTracker />
      <Routes>
        <Route path="*" element={<div>page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.dataLayer = [];
});

describe('RouteChangeTracker', () => {
  it('pushes a virtual_pageview event with the current path on mount', () => {
    renderTracker('/interview');
    const events = window.dataLayer!.filter((e) => (e as { event?: string }).event === 'virtual_pageview');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ event: 'virtual_pageview', page_path: '/interview' });
  });

  it('includes the query string in page_path', () => {
    renderTracker('/onboarding?access=1');
    const [event] = window.dataLayer!.filter((e) => (e as { event?: string }).event === 'virtual_pageview');
    expect(event).toMatchObject({ page_path: '/onboarding?access=1' });
  });
});
