// data.js — demo content for Eleanor's living memory journal.
// Fictional. Eleanor Marchetti, b. 1948, coastal Liguria, Italy → Boston.

window.DATA = {
  user: {
    name: 'Eleanor Marchetti',
    born: 1948,
    birthplace: 'Camogli, Liguria',
    now: 'Brookline, Massachusetts',
    initials: 'EM',
    summary: 'Daughter of a fisherman and a seamstress. Emigrated at 19, taught Italian for thirty-one years, mother of two, grandmother of five.',
    journalAge: '4 months',
    stats: { stories: 47, people: 23, places: 11, years: 78, hours: 9.4 },
  },

  personas: [
    { id: 'historian', name: 'Curious Historian', glyph: '📜', accent: '#C16B4A',
      blurb: 'Places your life inside the wider world — wars, waves of change, the year you remember.',
      sample: 'What was the harbour like the morning you left Camogli?' },
    { id: 'journalist', name: 'The Journalist', glyph: '📰', accent: '#6E8FA8',
      blurb: 'Follows the thread, asks the one more question, finds the turning point.',
      sample: 'You said the letter changed everything — tell me about the moment you opened it.' },
    { id: 'grandchild', name: 'The Grandchild', glyph: '🧶', accent: '#C08AA0',
      blurb: 'Warm and wide-eyed. Asks the questions family wishes they had asked sooner.',
      sample: 'Nonna, what did Sunday lunch smell like when you were small?' },
    { id: 'researcher', name: 'Family Researcher', glyph: '🌿', accent: '#7E9A6C',
      blurb: 'Maps names, dates and places into your family tree as you talk.',
      sample: 'Your mother — Rosa — was she born in Camogli too, or did she come from inland?' },
  ],

  // live interview transcript (interview centerpiece)
  transcript: [
    { who: 'ai', text: 'Good afternoon, Eleanor. Last time you mentioned the harbour at Camogli. Could you take me back to the morning you left for America?' },
    { who: 'me', text: 'It was September, 1967. Still warm. The boats were coming in, and my father wouldn\u2019t look at me — he kept coiling the same rope.' },
    { who: 'ai', text: 'He kept his hands busy. What did you carry with you?' },
    { who: 'me', text: 'One brown suitcase, and a tin of my mother\u2019s amaretti. I ate the last one on the ship and cried, because then there was nothing left of home that I could taste.' },
    { who: 'ai', text: 'That\u2019s a beautiful, painful detail. Did you know then that you wouldn\u2019t come back for a long time?' },
    { who: 'me', text: 'No. I thought two years, maybe three. It was eleven before I saw the harbour again.' },
  ],

  // live extraction shown forming in the right rail
  extraction: {
    memoryCard: { title: 'Leaving Camogli', era: '1967', motif: 'a brown suitcase on a stone quay' },
    people: [
      { name: 'Giovanni Marchetti', rel: 'Father · fisherman', new: false },
      { name: 'Rosa Marchetti', rel: 'Mother · seamstress', new: true },
    ],
    place: { name: 'Camogli harbour', region: 'Liguria, Italy', year: 1967 },
    year: 1967,
    theme: 'Departure & belonging',
  },

  // timeline of life events
  timeline: [
    { year: 1948, decade: '1940s', title: 'Born in Camogli', kind: 'milestone',
      text: 'Born above her father\u2019s net store, the third of four children, to the sound of the morning fish auction.', place: 'Camogli' },
    { year: 1954, decade: '1950s', title: 'First day at the convent school', kind: 'event',
      text: 'Walked the cliff path in a grey pinafore; was scolded for collecting sea glass instead of saying her prayers.', place: 'Camogli' },
    { year: 1959, decade: '1950s', title: 'The summer of the red balloon', kind: 'memory',
      text: 'A travelling fair came to the piazza. She won a red balloon and let it go on purpose, just to watch it leave.', place: 'Camogli' },
    { year: 1963, decade: '1960s', title: 'Apprenticed to her mother', kind: 'event',
      text: 'Learned to hem, to read fabric with her fingers, to make a wedding dress from almost nothing.', place: 'Camogli' },
    { year: 1967, decade: '1960s', title: 'Left for America', kind: 'milestone',
      text: 'Sailed from Genoa with one suitcase and a tin of amaretti. Eleven years before she returned.', place: 'Genoa → New York' },
    { year: 1969, decade: '1960s', title: 'Met Thomas', kind: 'milestone',
      text: 'A rainy night class in Boston. He mispronounced \u201cbuongiorno\u201d on purpose, every week, to make her laugh.', place: 'Boston' },
    { year: 1971, decade: '1970s', title: 'Married Thomas Hale', kind: 'milestone',
      text: 'A small wedding in a borrowed garden. She wore a dress she sewed herself in three weeks.', place: 'Cambridge, MA' },
    { year: 1973, decade: '1970s', title: 'Began teaching Italian', kind: 'event',
      text: 'Thirty-one years of evening classes. Generations of Bostonians learned to roll their R\u2019s in her classroom.', place: 'Boston' },
    { year: 1975, decade: '1970s', title: 'Sofia is born', kind: 'milestone',
      text: 'Their first daughter, named for Eleanor\u2019s grandmother. Born during a blizzard.', place: 'Boston' },
    { year: 1978, decade: '1970s', title: 'Return to Camogli', kind: 'memory',
      text: 'Brought Sofia to meet the harbour. Her father, older now, finally looked at her — and wept.', place: 'Camogli' },
    { year: 1981, decade: '1980s', title: 'Daniel is born', kind: 'milestone',
      text: 'Their son. He would grow up to love the sea, just as she had.', place: 'Boston' },
    { year: 2004, decade: '2000s', title: 'Last class', kind: 'event',
      text: 'Retired from teaching. Her students filled the room with handmade cards in shaky Italian.', place: 'Boston' },
    { year: 2026, decade: '2020s', title: 'Begins her memory journal', kind: 'milestone',
      text: 'Sits down to tell it all, so her grandchildren will know where the amaretti came from.', place: 'Brookline' },
  ],

  // relationship map
  people: [
    { id: 'eleanor', name: 'Eleanor', rel: 'self', ring: 0, group: 'self' },
    { id: 'giovanni', name: 'Giovanni', rel: 'Father', ring: 1, group: 'family', mentions: 12 },
    { id: 'rosa', name: 'Rosa', rel: 'Mother', ring: 1, group: 'family', mentions: 14 },
    { id: 'thomas', name: 'Thomas', rel: 'Husband', ring: 1, group: 'family', mentions: 21 },
    { id: 'sofia', name: 'Sofia', rel: 'Daughter', ring: 1, group: 'family', mentions: 9 },
    { id: 'daniel', name: 'Daniel', rel: 'Son', ring: 1, group: 'family', mentions: 8 },
    { id: 'lucia', name: 'Lucia', rel: 'Sister', ring: 2, group: 'family', mentions: 6 },
    { id: 'pietro', name: 'Pietro', rel: 'Brother', ring: 2, group: 'family', mentions: 4 },
    { id: 'nonna-sofia', name: 'Nonna Sofia', rel: 'Grandmother', ring: 2, group: 'family', mentions: 5 },
    { id: 'clara', name: 'Clara', rel: 'Best friend', ring: 2, group: 'friend', mentions: 7 },
    { id: 'mr-bishop', name: 'Mr. Bishop', rel: 'Mentor', ring: 2, group: 'colleague', mentions: 3 },
  ],

  // memory canvas tiles
  canvas: [
    { id: 'balloon', title: 'The Red Balloon', era: '1959', theme: 'Childhood', fav: true,
      motif: 'a red balloon rising over a piazza', palette: ['#D98C8C', '#E2A07E', '#E8C285'],
      excerpt: 'Won at the summer fair and set free on purpose — her first taste of letting go.' },
    { id: 'harbour', title: 'Camogli Harbour', era: '1967', theme: 'Home', fav: true,
      motif: 'fishing boats on turquoise water at dawn', palette: ['#7FA8B0', '#A9BB97', '#E8C285'],
      excerpt: 'The painted boats, the morning auction, her father coiling rope as she left.' },
    { id: 'amaretti', title: 'Mother\u2019s Amaretti', era: '1967', theme: 'Family', fav: false,
      motif: 'a small tin of almond biscuits', palette: ['#E8C285', '#E2A07E', '#D98C8C'],
      excerpt: 'The last taste of home, eaten on the deck of a ship bound for New York.' },
    { id: 'classroom', title: 'Evening Italian', era: '1973', theme: 'Work', fav: false,
      motif: 'a chalkboard with conjugations', palette: ['#A9BB97', '#C9B581', '#7FA8B0'],
      excerpt: 'Thirty-one years of rolled R\u2019s and rainy Tuesday classes.' },
    { id: 'wedding', title: 'A Borrowed Garden', era: '1971', theme: 'Love', fav: true,
      motif: 'a handmade dress under a garden trellis', palette: ['#D98C8C', '#C08AA0', '#A9BB97'],
      excerpt: 'Married Thomas in a dress she sewed herself in three short weeks.' },
    { id: 'bicycle', title: 'The Cliff-Path Bicycle', era: '1956', theme: 'Childhood', fav: false,
      motif: 'a rusty bicycle against a stone wall', palette: ['#A9BB97', '#7FA8B0', '#E2A07E'],
      excerpt: 'Too big for her, ridden anyway, down the path that smelled of salt and pine.' },
    { id: 'blizzard', title: 'Sofia\u2019s Blizzard', era: '1975', theme: 'Family', fav: false,
      motif: 'a snowbound window, a newborn', palette: ['#B7C4D2', '#E2A07E', '#D98C8C'],
      excerpt: 'Their first child arrived as Boston disappeared under three feet of white.' },
    { id: 'reunion', title: 'Father\u2019s Tears', era: '1978', theme: 'Home', fav: true,
      motif: 'two figures on a stone quay', palette: ['#7FA8B0', '#E8C285', '#C08AA0'],
      excerpt: 'Eleven years away. He finally looked at her, and at last he wept.' },
  ],

  // example search queries
  searchExamples: [
    'What stories mention my father?',
    'Show memories from the 1970s',
    'Memories about leaving home',
    'Everything connected to Italy',
    'When did Eleanor feel most homesick?',
  ],
};
