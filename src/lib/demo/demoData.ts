import type { Store } from '../domain/types';

/** Fixed IDs so the active profile can be selected after seeding. */
export const DEMO_ID_THOMAS = 'demo-thomas-reid';
export const DEMO_ID_ELEANOR = 'demo-eleanor-mitchell';

/**
 * Lightweight prefill descriptors for the onboarding form.
 * One is picked at random when "Try an example profile" is clicked.
 * Fields are locked (read-only) once selected.
 */
export const DEMO_PROFILES_PREFILL = [
  {
    id: DEMO_ID_THOMAS,
    name: 'Thomas Reid',
    yearBorn: '1951',
    birthplace: 'Geelong, Victoria',
    bio: 'Retired primary school principal and avid vegetable gardener. Raised four children with wife Barbara and has kept a journal since 1975.',
    gender: 'M' as const,
    personaId: 'journalist' as const,
    photo: '/demo/thomas.jpg' as string | null,
  },
  {
    id: DEMO_ID_ELEANOR,
    name: 'Eleanor Mitchell',
    yearBorn: '1942',
    birthplace: 'Ballarat, Victoria',
    bio: 'Grew up on a farm during the post-war years. Worked at Myer in Melbourne before marrying Gerald and raising three children in Fitzroy.',
    gender: 'F' as const,
    personaId: 'journalist' as const,
    photo: '/demo/eleanor.jpg' as string | null,
  },
];

/**
 * Full two-profile demo store used for both the auto-seed on first visit
 * and the "Try an example profile" onboarding flow.
 * Pass activeId to control which profile is active (defaults to Thomas).
 */
export function getFullDemoStore(activeId: string = DEMO_ID_THOMAS): Store {
  const base = Date.now();
  return {
    activeId,
    profiles: [
      {
        id: DEMO_ID_THOMAS,
        name: 'Thomas Reid',
        yearBorn: '1951',
        birthplace: 'Geelong, Victoria',
        bio: 'Retired primary school principal and avid vegetable gardener. Raised four children with wife Barbara and has kept a journal since 1975.',
        photo: '/demo/thomas.jpg',
        gender: 'M',
        personaId: 'journalist',
        sessions: 1,
        createdAt: base - 86400000 * 15,
        memories: [
          {
            id: 'demo-thomas-mem-1',
            title: 'A Classroom of Thirty',
            era: '1970s',
            theme: 'Work',
            excerpt:
              'I had thirty-two kids on my first day and I couldn\'t remember a single name by lunchtime. I went home and wrote them all on cards.',
            summary:
              'Thomas recalls his first day as a classroom teacher in 1975 — overwhelmed by thirty-two names and determined to learn every one before the week was out. He went home and made cards, a habit that stayed with him for thirty years.',
            palette: ['var(--bloom-b)', 'var(--bloom-a)', 'var(--bloom-d)'],
            people: [],
            places: ['Geelong West Primary School'],
            years: ['1975'],
            createdAt: base - 86400000 * 10,
          },
          {
            id: 'demo-thomas-mem-2',
            title: 'The First Tomatoes',
            era: '1980s',
            theme: 'Family',
            excerpt:
              'Barbara and I planted six seedlings along the back fence. By February we had so many tomatoes we were leaving bags on the neighbours\' doorsteps.',
            summary:
              'The summer Thomas and Barbara planted their first vegetable garden became a running joke in the street — six tomato seedlings turned into an abundance that they couldn\'t give away fast enough, sparking a gardening passion that filled their weekends for decades.',
            palette: ['var(--bloom-a)', 'var(--bloom-c)', 'var(--bloom-b)'],
            people: [{ text: 'Barbara', relation: 'wife' }],
            places: ['Geelong', 'back garden'],
            years: ['1983'],
            createdAt: base - 86400000 * 5,
          },
        ],
      },
      {
        id: DEMO_ID_ELEANOR,
        name: 'Eleanor Mitchell',
        yearBorn: '1942',
        birthplace: 'Ballarat, Victoria',
        bio: 'Grew up on a farm during the post-war years. Worked at Myer in Melbourne before marrying Gerald and raising three children in Fitzroy.',
        photo: '/demo/eleanor.jpg',
        gender: 'F',
        personaId: 'journalist',
        sessions: 1,
        createdAt: base - 86400000 * 30,
        memories: [
          {
            id: 'demo-mem-1',
            title: 'The Jam Season',
            era: '1950s',
            theme: 'Family',
            excerpt:
              'Mum would start in the early morning, before the heat set in. The whole kitchen smelled of sugar and fruit for days.',
            summary:
              'Eleanor recalls the annual summer jam-making ritual on the family farm — her mother rising before dawn, copper pots steaming, the scent of stone fruit filling the house for a week.',
            palette: ['var(--bloom-a)', 'var(--bloom-c)', 'var(--bloom-d)'],
            people: [{ text: 'Mum', relation: 'mother' }],
            places: ['Ballarat farm'],
            years: ['1952'],
            createdAt: base - 86400000 * 20,
          },
          {
            id: 'demo-mem-2',
            title: 'First Day at Myer',
            era: '1961',
            theme: 'Work',
            excerpt:
              'I wore my best dress and white gloves. The floor manager showed me the glove counter and I thought — this is it, this is my life now.',
            summary:
              "At nineteen, Eleanor began work at Myer's Bourke Street store in Melbourne. Assigned to the accessories counter in an era when white gloves were still everyday wear, she felt the thrill of her first independent chapter.",
            palette: ['var(--bloom-c)', 'var(--bloom-a)', 'var(--bloom-d)'],
            people: [{ text: 'Floor manager', relation: null }],
            places: ['Myer Bourke Street', 'Melbourne'],
            years: ['1961'],
            createdAt: base - 86400000 * 14,
          },
          {
            id: 'demo-mem-3',
            title: 'Meeting Gerald',
            era: '1965',
            theme: 'Love',
            excerpt:
              "He came in to buy a birthday present for his mother and he didn't know the first thing about scarves. I helped him for about forty minutes.",
            summary:
              'Eleanor met her future husband Gerald at the accessories counter — he was buying a scarf for his mother and lingered so long her supervisor noticed. They were married two years later.',
            palette: ['var(--bloom-d)', 'var(--bloom-c)', 'var(--bloom-a)'],
            people: [{ text: 'Gerald', relation: 'husband' }],
            places: ['Myer Bourke Street', 'Melbourne'],
            years: ['1965'],
            createdAt: base - 86400000 * 7,
          },
        ],
      },
    ],
  };
}

/** Legacy single-profile store — kept for any callers that still reference it. */
export function getDemoStore(): Store {
  const full = getFullDemoStore(DEMO_ID_ELEANOR);
  return { activeId: DEMO_ID_ELEANOR, profiles: [full.profiles[1]] };
}
