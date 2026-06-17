import type { Store } from '../domain/types';

export function getDemoStore(): Store {
  const profileId = 'demo-eleanor-mitchell';
  const base = Date.now();

  return {
    activeId: profileId,
    profiles: [
      {
        id: profileId,
        name: 'Eleanor Mitchell',
        yearBorn: '1942',
        birthplace: 'Ballarat, Victoria',
        bio: 'Grew up on a farm during the post-war years. Worked at Myer in Melbourne before marrying Gerald and raising three children in Fitzroy.',
        photo: null,
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
              'At nineteen, Eleanor began work at Myer\'s Bourke Street store in Melbourne. Assigned to the accessories counter in an era when white gloves were still everyday wear, she felt the thrill of her first independent chapter.',
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
              'He came in to buy a birthday present for his mother and he didn\'t know the first thing about scarves. I helped him for about forty minutes.',
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
