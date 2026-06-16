// Ambient types for jest-axe (untyped package). No imports — keep it global.
declare module 'jest-axe' {
  export function axe(
    html: Element | string,
    options?: Record<string, unknown>,
  ): Promise<{ violations: unknown[] }>;
  export const toHaveNoViolations: Record<string, unknown>;
}
