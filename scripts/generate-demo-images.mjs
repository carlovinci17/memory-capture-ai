/**
 * Regenerates all demo memory illustration images.
 * Calls /api/memories/illustrate for each demo memory, which generates
 * via gpt-image-1 and uploads directly to Azure Blob Storage.
 *
 * Usage: node scripts/generate-demo-images.mjs
 * Requires: npm start running in another terminal (SWA CLI + Azure Functions).
 */

const BASE = 'http://localhost:4280';

const MEMORIES = [
  {
    memoryId: 'demo-thomas-mem-1',
    title: 'A Classroom of Thirty',
    summary: 'Thomas recalls his first day as a classroom teacher in 1975 — overwhelmed by thirty-two names and determined to learn every one before the week was out.',
    theme: 'Work',
    era: '1970s',
  },
  {
    memoryId: 'demo-thomas-mem-2',
    title: 'The First Tomatoes',
    summary: "Six tomato seedlings turned into an abundance that they couldn't give away fast enough, sparking a gardening passion that filled their weekends for decades.",
    theme: 'Family',
    era: '1980s',
  },
  {
    memoryId: 'demo-mem-1',
    title: 'The Jam Season',
    summary: 'Eleanor recalls the annual summer jam-making ritual on the family farm — her mother rising before dawn, copper pots steaming, the scent of stone fruit filling the house.',
    theme: 'Family',
    era: '1950s',
  },
  {
    memoryId: 'demo-mem-2',
    title: 'First Day at Myer',
    summary: 'At nineteen, Eleanor began work at Myer\'s Bourke Street store — assigned to the accessories counter in an era when white gloves were still everyday wear.',
    theme: 'Work',
    era: '1961',
  },
  {
    memoryId: 'demo-mem-3',
    title: 'Meeting Gerald',
    summary: 'Eleanor met her future husband Gerald at the accessories counter — he was buying a scarf for his mother and lingered so long her supervisor noticed.',
    theme: 'Love',
    era: '1965',
  },
  {
    memoryId: 'demo-yuki-mem-1',
    title: "Mother's Ikebana Studio",
    summary: 'Yuki recalls spending childhood afternoons in her mother\'s ikebana studio in Kyoto — watching in silence as her mother arranged branches with patience and precision.',
    theme: 'Family',
    era: '1960s',
  },
  {
    memoryId: 'demo-yuki-mem-2',
    title: 'First Melbourne Winter',
    summary: 'Arriving in Melbourne in 1979, Yuki was startled by her first southern winter — a cold that crept through unfamiliar walls.',
    theme: 'Migration',
    era: '1970s',
  },
  {
    memoryId: 'demo-kofi-mem-1',
    title: 'The Market Before Sunrise',
    summary: 'Kofi recalls being woken before sunrise as a boy to help his mother set up her cloth stall at Kumasi Central Market.',
    theme: 'Family',
    era: '1980s',
  },
  {
    memoryId: 'demo-kofi-mem-2',
    title: "Father's Red Pen",
    summary: "Kofi's father graded secondary school papers by kitchen light every night — a quiet image of dedication that shaped how Kofi understood hard work.",
    theme: 'Education',
    era: '1990s',
  },
];

async function generate(memory) {
  process.stdout.write(`  Generating "${memory.title}"… `);
  const res = await fetch(`${BASE}/api/memories/illustrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memory),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.log(`FAILED (HTTP ${res.status}): ${body}`);
    return false;
  }
  const data = await res.json();
  console.log(`OK\n    → ${data.imageUrl}`);
  return true;
}

console.log(`Generating ${MEMORIES.length} demo memory images via ${BASE}\n`);
let ok = 0;
for (const m of MEMORIES) {
  const success = await generate(m);
  if (success) ok++;
  // Small pause between requests to avoid overwhelming the API.
  await new Promise((r) => setTimeout(r, 1000));
}

console.log(`\nDone: ${ok}/${MEMORIES.length} images generated.`);
if (ok < MEMORIES.length) {
  console.log('Some images failed. Check that npm start is running and gpt-image-1 is configured.');
}
