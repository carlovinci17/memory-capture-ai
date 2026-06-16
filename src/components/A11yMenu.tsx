// A11yMenu.tsx — accessibility quick-settings: larger text + high contrast.
// Lives in the sidebar; both toggles persist and apply instantly.
import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { useA11ySettings } from '../lib/a11y/useA11ySettings';

export function A11yMenu() {
  const { largeText, highContrast, toggleLargeText, toggleHighContrast } = useA11ySettings();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="a11y">
      <button
        className="nav__item"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="spark" className="nav__icon" />
        <span>Accessibility</span>
      </button>

      {open && (
        <div className="a11y__menu" role="menu" aria-label="Accessibility settings">
          <button
            role="menuitemcheckbox"
            aria-checked={largeText}
            className={'a11y__opt' + (largeText ? ' is-on' : '')}
            onClick={toggleLargeText}
          >
            <Icon name={largeText ? 'check' : 'plus'} size={15} /> Larger text
          </button>
          <button
            role="menuitemcheckbox"
            aria-checked={highContrast}
            className={'a11y__opt' + (highContrast ? ' is-on' : '')}
            onClick={toggleHighContrast}
          >
            <Icon name={highContrast ? 'check' : 'plus'} size={15} /> High contrast
          </button>
        </div>
      )}
    </div>
  );
}
