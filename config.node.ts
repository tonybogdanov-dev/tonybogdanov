import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadYaml } from './src/utils/yaml';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const browsers = loadYaml<Browser[]>(path.join(__dirname, 'config/browsers.yaml'));
const colorsYaml = loadYaml<ColorsYaml>(path.join(__dirname, 'config/colors.yaml'));
const fonts = loadYaml<Fonts>(path.join(__dirname, 'config/fonts.yaml'));
const overlay = loadYaml<Overlay>(path.join(__dirname, 'config/overlay.yaml'));
const breakpoints = loadYaml<Breakpoints>(path.join(__dirname, 'config/breakpoints.yaml'));
const containers = loadYaml<Containers>(path.join(__dirname, 'config/containers.yaml'));
const shadows = loadYaml<Shadows>(path.join(__dirname, 'config/shadows.yaml'));
const radius = loadYaml<Radius>(path.join(__dirname, 'config/radius.yaml'));
const responsiveSpacing = loadYaml<ResponsiveSpacing>(path.join(__dirname, 'config/spacing.yaml'));
const focus = loadYaml<Focus>(path.join(__dirname, 'config/focus.yaml'));
const content = loadYaml<Content>(path.join(__dirname, 'config/content.yaml'));
const features = loadYaml<Features>(path.join(__dirname, 'config/features.yaml'));
const turnstile = loadYaml<Turnstile>(path.join(__dirname, 'config/turnstile.yaml'));
const email = process.env.CONTACT_EMAIL ?? '';

export const config: Config = buildConfig({
  browsers,
  colorsYaml,
  fonts,
  overlay,
  breakpoints,
  containers,
  shadows,
  radius,
  responsiveSpacing,
  focus,
  content,
  features,
  turnstile,
  email,
});

export * from './config.base';
