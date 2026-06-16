// useA11ySettings.ts — persisted accessibility preferences (larger text +
// high contrast), applied as data attributes on <html> so CSS in a11y.css can
// react. Preferences survive reloads.
import { useCallback, useEffect, useState } from 'react';

const TEXT_KEY = 'mcap_a11y_textsize';
const CONTRAST_KEY = 'mcap_a11y_contrast';

function read(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export interface A11ySettings {
  largeText: boolean;
  highContrast: boolean;
  toggleLargeText: () => void;
  toggleHighContrast: () => void;
}

export function useA11ySettings(): A11ySettings {
  const [largeText, setLargeText] = useState(() => read(TEXT_KEY));
  const [highContrast, setHighContrast] = useState(() => read(CONTRAST_KEY));

  useEffect(() => {
    const el = document.documentElement;
    if (largeText) el.setAttribute('data-textsize', 'large');
    else el.removeAttribute('data-textsize');
    try {
      localStorage.setItem(TEXT_KEY, largeText ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [largeText]);

  useEffect(() => {
    const el = document.documentElement;
    if (highContrast) el.setAttribute('data-contrast', 'high');
    else el.removeAttribute('data-contrast');
    try {
      localStorage.setItem(CONTRAST_KEY, highContrast ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [highContrast]);

  const toggleLargeText = useCallback(() => setLargeText((v) => !v), []);
  const toggleHighContrast = useCallback(() => setHighContrast((v) => !v), []);

  return { largeText, highContrast, toggleLargeText, toggleHighContrast };
}
