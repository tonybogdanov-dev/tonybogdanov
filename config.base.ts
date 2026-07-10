import { generateColorVariants } from './src/utils/color';
import { buildSpacing } from './src/utils/spacing';

export type Browser = {
  label: string;
  os: string;
  osVersion: string;
  browserName: string;
  browserVersion: string;
};

export type ColorVariants = Record<string, string>;

export type Colors = Record<string, ColorVariants>;

export type ColorsYaml = {
  sequence: string[];
  brand: Record<string, string>;
  true: Record<string, string>;
};

export type Font = {
  name: string;
  weights: number[];
};

export type Fonts = {
  serif: Font;
  sansSerif: Font;
};

export type Overlay = {
  opacity: number;
  color: string;
};

export type Breakpoints = Record<string, string>;

export type Containers = Record<string, string>;

export type Shadows = Record<string, string>;

export type Radius = Record<string, string>;

export type ResponsiveSpacing = Record<string, Record<string, string>>;

export type Spacing = Record<string, string>;

export type Focus = Record<string, number>;

export type Features = {
  github: boolean;
  upwork: boolean;
};

export type Turnstile = {
  siteKey: string;
};

export type PrimaryStat = {
  label: string[];
  value: string;
};

export type SecondaryStat = {
  color: 'blue' | 'green' | 'yellow' | 'red';
  value: string[];
  label: string[];
};

export type Job = {
  group: number;
  label: 'Work' | 'Education';
  startYear: number;
  endYear?: number;
  /** [ short form shown in the card, long form used in tooltips & the CV ] */
  position: [string, string];
  /** [ short form shown in the card, long form used in tooltips & the CV ] */
  company: [string, string];
  companyUrl?: string;
  /** One-line outcome shown in the collapsed card & as the CV entry lead. */
  summary: string;
  /** Full description paragraphs (plain text; typographic dashes welcome). */
  description: string[];
};

export type SkillGroupData = {
  label: string;
  description: string;
};

export type SkillData = {
  label: string;
  /** Basename of the SVG in src/assets/skills (without extension). */
  icon: string;
  hidden?: string[]; // breakpoint names at which this skill is ignored when computing the layout
};

export type SkillEntryData = ({ type: 'group' } & SkillGroupData) | ({ type: 'skill' } & SkillData);

export type ResolvedSkillGroup = {
  label: string;
  skills: string[];
};

export type Profile = {
  start: number;
  name: string;
  title: string;
  linkedin: string;
  github: string;
  upwork: string;
  website: string;
  location: string;
  timezone: string;
  availability: string;
  availabilityExtended: string;
  summary: string;
};

export type Content = {
  title: string;
  profile: Profile;
  hero: {
    focus: string[];
    headline: string;
  };
  about: {
    headline: string;
    subline: string;
    text: string[];
    stats: {
      primary: PrimaryStat;
      secondary: SecondaryStat[];
    };
  };
  skills: {
    headline: string;
    subline: string;
    entries: SkillEntryData[];
  };
  timeline: {
    headline: string;
    subline: string;
    /**
     * Ordered newest -> oldest; consumers pick their own direction (the site timeline reads
     * top-down chronologically, the CV lists newest first).
     */
    jobs: Job[];
  };
};

export type Config = {
  browsers: Browser[];
  colors: Colors;
  colorSequence: string[];
  fonts: Fonts;
  overlay: Overlay;
  breakpoints: Breakpoints;
  containers: Containers;
  shadows: Shadows;
  radius: Radius;
  responsiveSpacing: ResponsiveSpacing;
  spacing: Spacing;
  focus: Focus;
  content: Content;
  features: Features;
  turnstile: Turnstile;
  yearsOfExperience: number;
  workGroups: Job[][];
  education: Job[];
  skillGroups: ResolvedSkillGroup[];
  email: string;
};

export type RawConfig = {
  browsers: Browser[];
  colorsYaml: ColorsYaml;
  fonts: Fonts;
  overlay: Overlay;
  breakpoints: Breakpoints;
  containers: Containers;
  shadows: Shadows;
  radius: Radius;
  responsiveSpacing: ResponsiveSpacing;
  focus: Focus;
  content: Content;
  features: Features;
  turnstile: Turnstile;
  email: string;
};

export function buildConfig(raw: RawConfig): Config {
  const colors: Colors = Object.fromEntries(
    Object.entries(raw.colorsYaml.brand).map(([name, hex]) => [
      name,
      generateColorVariants(hex, raw.colorsYaml.true[name]),
    ])
  );

  const work = raw.content.timeline.jobs.filter((job) => job.label === 'Work');
  const education = raw.content.timeline.jobs.filter((job) => job.label === 'Education');

  const workGroups = work.reduce<Job[][]>((groups, item) => {
    const last = groups[groups.length - 1];
    if (last && last[0].group === item.group) last.push(item);
    else groups.push([item]);
    return groups;
  }, []);

  const skillGroups = raw.content.skills.entries.reduce<ResolvedSkillGroup[]>((groups, entry) => {
    if (entry.type === 'group') groups.push({ label: entry.label, skills: [] });
    else groups[groups.length - 1]?.skills.push(entry.label);
    return groups;
  }, []);

  return {
    browsers: raw.browsers,
    colors,
    colorSequence: raw.colorsYaml.sequence,
    fonts: raw.fonts,
    overlay: raw.overlay,
    breakpoints: raw.breakpoints,
    containers: raw.containers,
    shadows: raw.shadows,
    radius: raw.radius,
    responsiveSpacing: raw.responsiveSpacing,
    spacing: buildSpacing(raw.responsiveSpacing, raw.breakpoints),
    focus: raw.focus,
    content: raw.content,
    features: raw.features,
    turnstile: raw.turnstile,
    yearsOfExperience: new Date().getFullYear() - raw.content.profile.start,
    workGroups,
    education,
    skillGroups,
    email: raw.email,
  };
}
