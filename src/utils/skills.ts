import type { FunctionComponent, SVGProps } from 'react';
import type { SkillData, SkillEntryData, SkillGroupData } from '../../config.base';

export type SkillIcon = FunctionComponent<SVGProps<SVGSVGElement>>;

export type SkillGroupInfo = SkillGroupData;

export interface SkillInfo extends Omit<SkillData, 'icon'> {
  icon: SkillIcon;
}

export type SkillEntryInfo = ({ type: 'group' } & SkillGroupInfo) | ({ type: 'skill' } & SkillInfo);

export function resolveSkillIcons(
  entries: SkillEntryData[],
  resolveIcon: (name: string) => SkillIcon
): SkillEntryInfo[] {
  return entries.map((entry) => (entry.type === 'skill' ? { ...entry, icon: resolveIcon(entry.icon) } : entry));
}
