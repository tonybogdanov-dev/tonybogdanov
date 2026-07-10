import { resolveSkillIcons, type SkillIcon } from './src/utils/skills';
import browsers from './config/browsers.yaml';
import colorsYaml from './config/colors.yaml';
import fonts from './config/fonts.yaml';
import overlay from './config/overlay.yaml';
import breakpoints from './config/breakpoints.yaml';
import containers from './config/containers.yaml';
import shadows from './config/shadows.yaml';
import radius from './config/radius.yaml';
import responsiveSpacing from './config/spacing.yaml';
import focus from './config/focus.yaml';
import content from './config/content.yaml';
import features from './config/features.yaml';
import turnstile from './config/turnstile.yaml';
import {
  buildConfig,
  type Breakpoints,
  type Browser,
  type Containers,
  type ColorsYaml,
  type Config,
  type Content,
  type Features,
  type Focus,
  type Fonts,
  type Overlay,
  type Radius,
  type ResponsiveSpacing,
  type Shadows,
  type Turnstile,
} from './config.base';

export const config: Config = buildConfig({
  browsers: browsers as Browser[],
  colorsYaml: colorsYaml as ColorsYaml,
  fonts: fonts as Fonts,
  overlay: overlay as Overlay,
  breakpoints: breakpoints as Breakpoints,
  containers: containers as Containers,
  shadows: shadows as Shadows,
  radius: radius as Radius,
  responsiveSpacing: responsiveSpacing as ResponsiveSpacing,
  focus: focus as Focus,
  content: content as Content,
  features: features as Features,
  turnstile: turnstile as Turnstile,
  // Kept out of the browser bundle on purpose; the real address is only ever fetched at
  // runtime via /api/email (see src/hooks/useRevealableEmail.ts).
  email: '',
});

const skillIcons = import.meta.glob('./src/assets/skills/*.svg', {
  eager: true,
  import: 'default',
  query: '?react',
}) as Record<string, SkillIcon>;

export const skills = resolveSkillIcons(
  config.content.skills.entries,
  (name) => skillIcons[`./src/assets/skills/${name}.svg`]
);

export * from './config.base';
