// MemoryCard.tsx — a captured story rendered as a watercolor card.
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { MemoryArt } from './MemoryArt';
import type { Memory } from '../lib/domain/types';

interface MemoryCardProps {
  c: Memory;
  onClick?: () => void;
}

export function MemoryCard({ c, onClick }: MemoryCardProps) {
  const seed = c.id.length + (c.era ? c.era.charCodeAt(0) : 7);
  return (
    <button className="mcard rise" onClick={onClick} type="button">
      <div className="mcard__art">
        <MemoryArt memory={c} seed={seed} />
        {c.era && c.era !== 'Undated' ? <div className="mcard__era">{c.era}</div> : null}
      </div>
      <div className="mcard__body">
        <div className="mcard__title">{c.title}</div>
        <div className="mcard__excerpt">{c.excerpt}</div>
        <div className="mcard__meta">
          {c.theme ? (
            <span className="mcard__tag">
              <span className="chip__dot" style={{ background: 'var(--accent-3)' }} />
              {c.theme}
            </span>
          ) : null}
          <span className="mcard__date" style={{ marginLeft: 'auto' }}>
            {new Date(c.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    </button>
  );
}

interface SectionHeadProps {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  onAction?: () => void;
}

/** Small labelled section heading. */
export function SectionHead({ eyebrow, title, action, onAction }: SectionHeadProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 18,
      }}
    >
      <div>
        {eyebrow ? (
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            {eyebrow}
          </div>
        ) : null}
        <h2 className="display" style={{ fontSize: 25, margin: 0 }}>
          {title}
        </h2>
      </div>
      {action ? (
        <button className="chip" onClick={onAction} type="button">
          {action}
          <Icon name="arrow" size={14} />
        </button>
      ) : null}
    </div>
  );
}
