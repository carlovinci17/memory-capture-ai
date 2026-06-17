// Icon.tsx — stroke-path line icons ported verbatim from the prototype (ui.jsx).
import type { CSSProperties } from 'react';

export const ICONS = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20h14V9.5M9.5 20v-6h5v6',
  interview: 'M12 3a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4ZM5 11a7 7 0 0 0 14 0M12 18v3',
  timeline:
    'M12 3v18M12 6.5h7M12 12h-7M12 17.5h5M19 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM8 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM17 17.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z',
  canvas:
    'M4 5.5A1.5 1.5 0 0 1 5.5 4h5A1.5 1.5 0 0 1 12 5.5v5A1.5 1.5 0 0 1 10.5 12h-5A1.5 1.5 0 0 1 4 10.5v-5ZM14 6.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0ZM14 14h6v6h-6zM4 15.5A1.5 1.5 0 0 1 5.5 14h3A1.5 1.5 0 0 1 10 15.5v3A1.5 1.5 0 0 1 8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3Z',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14ZM20 20l-4-4',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0',
  people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 19a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M21 18.5a5.5 5.5 0 0 0-4-5',
  heart:
    'M12 20s-7-4.5-9.2-8.2C1.2 8.9 2.5 5.5 5.7 5.5c1.9 0 3.1 1.1 3.8 2.2.7-1.1 1.9-2.2 3.8-2.2 3.2 0 4.5 3.4 2.9 6.3C19 15.5 12 20 12 20Z',
  mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM6 11a6 6 0 0 0 12 0M12 17v3',
  'mic-off': 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM6 11a6 6 0 0 0 12 0M12 17v3M3 3l18 18',
  pause: 'M9 5v14M15 5v14',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  spark: 'M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3Z',
  pin: 'M12 21s-6-5.7-6-10a6 6 0 1 1 12 0c0 4.3-6 10-6 10ZM12 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z',
  calendar: 'M5 6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6ZM5 9.5h14M8.5 3.5v3M15.5 3.5v3',
  plus: 'M12 5v14M5 12h14',
  play: 'M7 5l11 7-11 7V5Z',
  quote: 'M9 7H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v3M19 7h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v3',
  chev: 'M6 9l6 6 6-6',
  check: 'M5 12.5l4.5 4.5L19 7',
  info: 'M12 3a9 9 0 1 1 0 18A9 9 0 0 1 12 3Zm0 5.5h.01M12 10.5v5',
  repeat: 'M1 4v6h6M3.51 15a9 9 0 1 0 .49-4.1',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  'eye-off':
    'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M10.73 10.73a3 3 0 0 0 4.24 4.24M3 3l18 18',
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 20, className = '', style }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d={ICONS[name] || ''} />
    </svg>
  );
}
