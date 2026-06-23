import type { Store } from '../domain/types';

/** Fixed IDs so the active profile can be selected after seeding. */
export const DEMO_ID_THOMAS  = 'demo-thomas-reid';
export const DEMO_ID_ELEANOR = 'demo-eleanor-mitchell';
export const DEMO_ID_YUKI    = 'demo-yuki-tanaka';
export const DEMO_ID_KOFI    = 'demo-kofi-asante';

/**
 * Lightweight prefill descriptors for the onboarding form.
 * One is picked at random when "Try an example profile" is clicked.
 * Fields are locked (read-only) once selected.
 * Images live in public/demo/ — drop the matching .jpg files there.
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
    personaId: 'historian' as const,
    photo: '/demo/eleanor.jpg' as string | null,
  },
  {
    id: DEMO_ID_YUKI,
    name: 'Yuki Tanaka',
    yearBorn: '1954',
    birthplace: 'Kyoto, Japan',
    bio: 'Grew up learning ikebana in her mother\'s studio in Kyoto. Moved to Melbourne in 1979 and ran a Japanese cooking school from home for twenty years.',
    gender: 'F' as const,
    personaId: 'grandchild' as const,
    photo: '/demo/yuki.jpg' as string | null,
  },
  {
    id: DEMO_ID_KOFI,
    name: 'Kofi Asante',
    yearBorn: '1976',
    birthplace: 'Kumasi, Ghana',
    bio: 'Raised by a schoolteacher father and market trader mother in Kumasi. Studied engineering in Accra, moved to Manchester in 2001, and coaches youth football on weekends.',
    gender: 'M' as const,
    personaId: 'researcher' as const,
    photo: '/demo/kofi.jpg' as string | null,
  },
];

/**
 * Full four-profile demo store used for both the auto-seed on first visit
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
            excerpt: "I had thirty-two kids on my first day and I couldn't remember a single name by lunchtime. I went home and wrote them all on cards.",
            summary: "Thomas recalls his first day as a classroom teacher in 1975 — overwhelmed by thirty-two names and determined to learn every one before the week was out. He went home and made cards, a habit that stayed with him for thirty years.",
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
            excerpt: "Barbara and I planted six seedlings along the back fence. By February we had so many tomatoes we were leaving bags on the neighbours' doorsteps.",
            summary: "The summer Thomas and Barbara planted their first vegetable garden became a running joke in the street — six tomato seedlings turned into an abundance that they couldn't give away fast enough, sparking a gardening passion that filled their weekends for decades.",
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
        personaId: 'historian',
        sessions: 1,
        createdAt: base - 86400000 * 30,
        memories: [
          {
            id: 'demo-mem-1',
            title: 'The Jam Season',
            era: '1950s',
            theme: 'Family',
            excerpt: 'Mum would start in the early morning, before the heat set in. The whole kitchen smelled of sugar and fruit for days.',
            summary: 'Eleanor recalls the annual summer jam-making ritual on the family farm — her mother rising before dawn, copper pots steaming, the scent of stone fruit filling the house for a week.',
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
            excerpt: 'I wore my best dress and white gloves. The floor manager showed me the glove counter and I thought — this is it, this is my life now.',
            summary: "At nineteen, Eleanor began work at Myer's Bourke Street store in Melbourne. Assigned to the accessories counter in an era when white gloves were still everyday wear, she felt the thrill of her first independent chapter.",
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
            excerpt: "He came in to buy a birthday present for his mother and he didn't know the first thing about scarves. I helped him for about forty minutes.",
            summary: 'Eleanor met her future husband Gerald at the accessories counter — he was buying a scarf for his mother and lingered so long her supervisor noticed. They were married two years later.',
            palette: ['var(--bloom-d)', 'var(--bloom-c)', 'var(--bloom-a)'],
            people: [{ text: 'Gerald', relation: 'husband' }],
            places: ['Myer Bourke Street', 'Melbourne'],
            years: ['1965'],
            createdAt: base - 86400000 * 7,
          },
        ],
      },
      {
        id: DEMO_ID_YUKI,
        name: 'Yuki Tanaka',
        yearBorn: '1954',
        birthplace: 'Kyoto, Japan',
        bio: "Grew up learning ikebana in her mother's studio in Kyoto. Moved to Melbourne in 1979 and ran a Japanese cooking school from home for twenty years.",
        photo: '/demo/yuki.jpg',
        gender: 'F',
        personaId: 'grandchild',
        sessions: 1,
        createdAt: base - 86400000 * 22,
        memories: [
          {
            id: 'demo-yuki-mem-1',
            title: "Mother's Ikebana Studio",
            era: '1960s',
            theme: 'Family',
            excerpt: 'The sound of scissors, the smell of green stems. Okāsan moved the branches until they breathed.',
            summary: "Yuki recalls spending childhood afternoons in her mother's ikebana studio in Kyoto — watching in silence as her mother arranged branches with a patience and precision she has never forgotten.",
            palette: ['var(--bloom-c)', 'var(--bloom-b)', 'var(--bloom-a)'],
            people: [{ text: 'Okāsan', relation: 'mother' }],
            places: ['Kyoto'],
            years: ['1963'],
            createdAt: base - 86400000 * 18,
          },
          {
            id: 'demo-yuki-mem-2',
            title: 'First Melbourne Winter',
            era: '1970s',
            theme: 'Migration',
            excerpt: 'I had never felt cold that got inside the house. In Kyoto, the cold was outside. Here it followed you in.',
            summary: 'Arriving in Melbourne in 1979, Yuki was startled by her first southern winter — a cold that crept through unfamiliar walls, in a city where she barely knew the words for things she needed most.',
            palette: ['var(--bloom-a)', 'var(--bloom-d)', 'var(--bloom-c)'],
            people: [{ text: 'Hiroshi', relation: 'husband' }],
            places: ['Melbourne', 'Kyoto'],
            years: ['1979'],
            createdAt: base - 86400000 * 11,
          },
        ],
      },
      {
        id: DEMO_ID_KOFI,
        name: 'Kofi Asante',
        yearBorn: '1976',
        birthplace: 'Kumasi, Ghana',
        bio: 'Raised by a schoolteacher father and market trader mother in Kumasi. Studied engineering in Accra, moved to Manchester in 2001, and coaches youth football on weekends.',
        photo: '/demo/kofi.jpg',
        gender: 'M',
        personaId: 'researcher',
        sessions: 1,
        createdAt: base - 86400000 * 12,
        memories: [
          {
            id: 'demo-kofi-mem-1',
            title: 'The Market Before Sunrise',
            era: '1980s',
            theme: 'Family',
            excerpt: "Mama would wake me at four. The market was a different world before the sun came up — cool, quiet, and already busy.",
            summary: "Kofi recalls being woken before sunrise as a boy to help his mother set up her cloth stall at Kumasi Central Market — a ritual that taught him the language of trade and the value of being first.",
            palette: ['var(--bloom-d)', 'var(--bloom-a)', 'var(--bloom-b)'],
            people: [{ text: 'Mama', relation: 'mother' }],
            places: ['Kumasi Central Market', 'Kumasi'],
            years: ['1984'],
            createdAt: base - 86400000 * 9,
          },
          {
            id: 'demo-kofi-mem-2',
            title: "Father's Red Pen",
            era: '1990s',
            theme: 'Education',
            excerpt: 'He marked papers until midnight every night. A red pen and the kitchen table. I learnt to finish my homework before he came home.',
            summary: "Kofi's father graded secondary school papers by kitchen light every night — a quiet image of dedication that shaped how Kofi understood hard work long before he could name it.",
            palette: ['var(--bloom-b)', 'var(--bloom-c)', 'var(--bloom-d)'],
            people: [{ text: 'Father', relation: 'father' }],
            places: ['Kumasi'],
            years: ['1991'],
            createdAt: base - 86400000 * 4,
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
