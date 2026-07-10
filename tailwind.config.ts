import type { Config } from 'tailwindcss/types/config';
import plugin from 'tailwindcss/plugin';
import type { PluginAPI } from 'tailwindcss/types/config';
import { config } from './config.node';

const fontFamily = {
  sans: [`"${config.fonts.sansSerif.name}"`, 'sans-serif'],
  serif: [`"${config.fonts.serif.name}"`, 'sans-serif'],
};

const fontWeight = Object.fromEntries(
  [...new Set([...config.fonts.serif.weights, ...config.fonts.sansSerif.weights])].map((w) => [w, String(w)])
);

const customPlugin = plugin(function ({ addUtilities, addBase }: PluginAPI) {
  const colorVars: Record<string, string> = {};
  for (const [name, scale] of Object.entries(config.colors)) {
    for (const [variant, value] of Object.entries(scale)) {
      colorVars[variant === 'DEFAULT' ? `--color-${name}` : `--color-${name}-${variant}`] = value;
    }
  }

  const spaceVars: Record<string, string> = {};
  const overridesByBreakpoint: Record<string, Record<string, string>> = {};

  for (const [name, scale] of Object.entries(config.responsiveSpacing)) {
    spaceVars[`--space-${name}`] = scale.DEFAULT;

    for (const [breakpoint, value] of Object.entries(scale)) {
      if (breakpoint === 'DEFAULT') continue;
      overridesByBreakpoint[breakpoint] ??= {};
      overridesByBreakpoint[breakpoint][`--space-${name}`] = value;
    }
  }

  // Emitted ascending by min-width so wider breakpoints' `:root` overrides win the cascade.
  const breakpointsAscending = Object.keys(overridesByBreakpoint).sort(
    (a, b) => parseFloat(config.breakpoints[a]) - parseFloat(config.breakpoints[b])
  );

  addBase({
    ':root': { ...colorVars, ...spaceVars },
    ...Object.fromEntries(
      breakpointsAscending.map((breakpoint) => [
        `@media (min-width: ${config.breakpoints[breakpoint]})`,
        { ':root': overridesByBreakpoint[breakpoint] },
      ])
    ),
  });

  addUtilities({
    '.font-serif': { fontFamily: `"${config.fonts.serif.name}", serif` },
    '.font-sans': { fontFamily: `"${config.fonts.sansSerif.name}", sans-serif` },
  });
});

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: {
    container: false,
  },
  theme: {
    screens: config.breakpoints,
    extend: {
      fontFamily,
      fontWeight,
      boxShadow: config.shadows,
      borderRadius: config.radius,
      maxWidth: Object.fromEntries(Object.entries(config.containers).map(([k, v]) => [`container-${k}`, v])),
      transitionTimingFunction: {
        DEFAULT: 'ease-in-out',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      colors: config.colors,
      spacing: config.spacing,
      fontSize: config.spacing,
    },
  },
  plugins: [customPlugin],
} satisfies Config;
