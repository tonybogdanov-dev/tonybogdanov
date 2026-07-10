/**
 * Derives the flat Tailwind spacing scale from the responsive spacing grid: each name maps to a
 * `var(--space-*)` reference (so it resolves per-breakpoint via the CSS custom properties emitted
 * from `responsiveSpacing`), plus a `-fixed` variant holding the literal rem value at that name's
 * own breakpoint (e.g. `sm-fixed` uses the `sm` breakpoint's value, not `DEFAULT`).
 */
export function buildSpacing(
  responsiveSpacing: Record<string, Record<string, string>>,
  breakpoints: Record<string, string>
): Record<string, string> {
  const names = Object.keys(responsiveSpacing);
  const breakpointKeys = ['DEFAULT', ...Object.keys(breakpoints)];

  const spacing: Record<string, string> = Object.fromEntries(names.map((name) => [name, `var(--space-${name})`]));

  for (const [index, name] of names.entries()) {
    spacing[`${name}-fixed`] = responsiveSpacing[name][breakpointKeys[index]];
  }

  return spacing;
}
