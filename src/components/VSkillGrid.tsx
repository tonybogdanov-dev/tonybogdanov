import { CSSProperties, FunctionComponent, SVGProps, useMemo, useState } from 'react';
import cx from 'classnames';
import { BaseProp } from '../utils/base-props';
import VSkillGroup from './VSkillGroup';
import VSkillBox from './VSkillBox';

export type SkillIcon = FunctionComponent<SVGProps<SVGSVGElement>>;

export interface SkillGroupInfo {
  label: string;
  description: string;
}

export interface SkillInfo {
  label: string;
  icon: SkillIcon;
  hidden?: string[];
}

export type SkillEntryInfo = ({ type: 'group' } & SkillGroupInfo) | ({ type: 'skill' } & SkillInfo);

export interface SkillCoordinates {
  xs: [number, number];
  sm?: [number, number];
  md?: [number, number];
  lg?: [number, number];
  xl?: [number, number];
}

export type Breakpoint = keyof SkillCoordinates;

type SkillGroup = SkillGroupInfo & SkillCoordinates;
type Skill = SkillInfo & SkillCoordinates;
type SkillEntry = ({ type: 'group' } & SkillGroup) | ({ type: 'skill' } & Skill);

const COLUMNS_BY_BREAKPOINT: Record<Breakpoint, number> = { xs: 2, sm: 4, md: 5, lg: 6, xl: 7 };

function layoutSkills(breakpoint: Breakpoint, columnCount: number, entries: SkillEntry[]): SkillEntry[] {
  let row = 0;
  let column = 0;

  return entries.map((entry) => {
    if (entry.type === 'skill' && entry.hidden?.includes(breakpoint)) {
      return entry;
    }

    if (entry.type === 'group' && column === columnCount - 1) {
      row++;
      column = 0;
    }

    const result = { ...entry, [breakpoint]: [row, column] } as SkillEntry;

    column++;
    if (column === columnCount) {
      column = 0;
      row++;
    }

    return result;
  });
}

const gridClass = [
  'grid gap-[0.1875rem]',
  'grid-cols-[repeat(var(--cols-xs),minmax(0,1fr))] grid-rows-[repeat(var(--rows-xs),minmax(0,1fr))]',
  'sm:grid-cols-[repeat(var(--cols-sm),minmax(0,1fr))] sm:grid-rows-[repeat(var(--rows-sm),minmax(0,1fr))]',
  'md:grid-cols-[repeat(var(--cols-md),minmax(0,1fr))] md:grid-rows-[repeat(var(--rows-md),minmax(0,1fr))]',
  'lg:grid-cols-[repeat(var(--cols-lg),minmax(0,1fr))] lg:grid-rows-[repeat(var(--rows-lg),minmax(0,1fr))]',
  'xl:grid-cols-[repeat(var(--cols-xl),minmax(0,1fr))] xl:grid-rows-[repeat(var(--rows-xl),minmax(0,1fr))]',
].join(' ');

const cellClass = [
  '[grid-column:var(--col-xs)] [grid-row:var(--row-xs)]',
  'sm:[grid-column:var(--col-sm)] sm:[grid-row:var(--row-sm)]',
  'md:[grid-column:var(--col-md)] md:[grid-row:var(--row-md)]',
  'lg:[grid-column:var(--col-lg)] lg:[grid-row:var(--row-lg)]',
  'xl:[grid-column:var(--col-xl)] xl:[grid-row:var(--row-xl)]',
].join(' ');

const VISIBILITY_CLASS: Record<Breakpoint, { shown: string; hidden: string }> = {
  xs: { shown: 'block', hidden: 'hidden' },
  sm: { shown: 'sm:block', hidden: 'sm:hidden' },
  md: { shown: 'md:block', hidden: 'md:hidden' },
  lg: { shown: 'lg:block', hidden: 'lg:hidden' },
  xl: { shown: 'xl:block', hidden: 'xl:hidden' },
};

function resolveCoordinate(entry: SkillEntry, breakpoint: Breakpoint, breakpoints: Breakpoint[]): [number, number] {
  for (let i = breakpoints.indexOf(breakpoint); i >= 0; i--) {
    const value = entry[breakpoints[i]];
    if (value) return value;
  }
  return entry.xs ?? [0, 0];
}

function isHiddenAt(entry: SkillEntry, breakpoint: Breakpoint): boolean {
  return entry.type === 'skill' && (entry.hidden?.includes(breakpoint) ?? false);
}

export interface VSkillGridProps extends BaseProp {
  skills: SkillEntryInfo[];
  colors: string[];
  breakpoints: string[];
}

export default function VSkillGrid({ className, skills: skillEntries, colors, breakpoints }: VSkillGridProps) {
  const supportedBreakpoints = useMemo(
    () => (['xs', ...breakpoints] as Breakpoint[]).filter((breakpoint) => breakpoint in COLUMNS_BY_BREAKPOINT),
    [breakpoints]
  );

  const skills = useMemo(
    () =>
      (Object.entries(COLUMNS_BY_BREAKPOINT) as [Breakpoint, number][]).reduce<SkillEntry[]>(
        (entries, [breakpoint, columnCount]) => layoutSkills(breakpoint, columnCount, entries),
        skillEntries as unknown as SkillEntry[]
      ),
    [skillEntries]
  );

  const gridVars = useMemo(
    () =>
      Object.fromEntries(
        supportedBreakpoints.flatMap((breakpoint) => {
          const visible = skills.filter((entry) => !isHiddenAt(entry, breakpoint));
          const rows =
            Math.max(0, ...visible.map((entry) => resolveCoordinate(entry, breakpoint, supportedBreakpoints)[0])) + 1;
          const columns =
            Math.max(0, ...visible.map((entry) => resolveCoordinate(entry, breakpoint, supportedBreakpoints)[1])) + 1;

          return [
            [`--rows-${breakpoint}`, rows],
            [`--cols-${breakpoint}`, columns],
          ];
        })
      ) as CSSProperties,
    [skills, supportedBreakpoints]
  );

  const [hoveredGroup, setHoveredGroup] = useState<number | null>(null);

  let groupIndex = -1;

  return (
    <div className={cx(gridClass, className)} style={gridVars}>
      {skills.map((entry, i) => {
        if (entry.type === 'group') groupIndex++;
        const thisGroupIndex = groupIndex;
        const color = colors[groupIndex % colors.length];
        const active = hoveredGroup === thisGroupIndex;

        const coordinates = Object.fromEntries(
          supportedBreakpoints.map((breakpoint) => [
            breakpoint,
            resolveCoordinate(entry, breakpoint, supportedBreakpoints),
          ])
        ) as Record<Breakpoint, [number, number]>;

        const cellVars = Object.fromEntries(
          supportedBreakpoints.flatMap((breakpoint) => {
            const [row, column] = coordinates[breakpoint];
            return [
              [`--col-${breakpoint}`, column + 1],
              [`--row-${breakpoint}`, row + 1],
            ];
          })
        ) as CSSProperties;

        const visibilityClass = supportedBreakpoints
          .map((breakpoint) =>
            isHiddenAt(entry, breakpoint) ? VISIBILITY_CLASS[breakpoint].hidden : VISIBILITY_CLASS[breakpoint].shown
          )
          .join(' ');

        return (
          <div
            key={i}
            className={cx('aspect-square', cellClass, visibilityClass)}
            style={cellVars}
            onMouseEnter={() => setHoveredGroup(thisGroupIndex)}
            onMouseLeave={() => setHoveredGroup(null)}
          >
            {entry.type === 'group' ?
              <VSkillGroup label={entry.label} description={entry.description} color={color} active={active} />
            : <VSkillBox label={entry.label} icon={entry.icon} color={color} active={active} />}
          </div>
        );
      })}
    </div>
  );
}
