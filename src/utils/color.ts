import Color from 'color';

const literalColorPattern = /^#|^(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\(/i;

/**
 * Expands a brand color into a Tailwind-style shade scale: `DEFAULT`, `w5`-`w95`/`b5`-`b95`
 * (mixed toward white/black in steps of 5), and `l1`-`l99`/`d1`-`d99` (fine-grained
 * lighten/darken in steps of 1). `trueColor` is the color's fully-saturated hue (e.g. pure
 * `#0000ff` for a brand blue) — darkening mixes toward it rather than toward black so the hue
 * shifts the way it would if the brand color were a tint of that true color, instead of just
 * going muddy.
 */
export const generateColorVariants = (baseColor: string, trueColor: string): Record<string, string> => {
  const base = Color(baseColor);
  const trueCol = Color(trueColor);
  const white = Color('#fff');
  const black = Color('#000');

  const baseHsl = base.hsl();
  const h = baseHsl.hue();
  const s = baseHsl.saturationl();
  const l = baseHsl.lightness();

  const result: Record<string, string> = { DEFAULT: baseColor };

  for (let i = 5; i <= 95; i += 5) {
    result[`w${i}`] = base.mix(white, i / 100).hex();
    result[`b${i}`] = base.mix(black, i / 100).hex();
  }

  for (let i = 1; i <= 99; i++) {
    const t = i / 100;

    // Lighten: desaturate + lighten by i pts (in HSL, preserving hue)
    result[`l${i}`] = Color.hsl(h, Math.max(0, s - i), Math.min(100, l + i)).hex();

    // Darken: RGB-mix toward true color (shifts hue), then proportionally reduce L
    const mixed = base.mix(trueCol, t);
    const mixedHsl = mixed.hsl();

    result[`d${i}`] = mixedHsl.lightness(mixedHsl.lightness() * (1 - t)).hex();
  }

  return result;
};

/**
 * Resolves a palette name (e.g. `red`, `blue-d50`, matching the `--color-*` vars from
 * config/plugin.ts) or a literal CSS color (hex/rgb/hsl/etc.) into a value usable in an inline
 * `style`. Palette names fall back to being read as CSS keywords (e.g. `white`, `black`) when no
 * matching `--color-*` var is defined, so this works regardless of Tailwind's build-time purge.
 */
export function cssColor(color: string): string {
  const trimmed = color.trim();
  return literalColorPattern.test(trimmed) ? trimmed : `var(--color-${trimmed}, ${trimmed})`;
}

export function resolveCssColor(color: string): string {
  const trimmed = color.trim();
  if (literalColorPattern.test(trimmed)) return trimmed;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(`--color-${trimmed}`).trim();
  return resolved || trimmed;
}
