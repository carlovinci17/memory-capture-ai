// format.ts — small display helpers ported from the prototype (mvp-app.jsx).

export function firstNameOf(name: string | undefined): string {
  return (name || '').trim().split(/\s+/)[0] || 'friend';
}

export function initialsOf(name: string | undefined): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '🙂';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function greetingWord(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function todayLabel(now: Date = new Date()): string {
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
