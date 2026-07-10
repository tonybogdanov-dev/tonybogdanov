import cx from 'classnames';
import { BaseProp } from '../utils/base-props';
import { cssColor } from '../utils/color';
import type { SkillIcon } from '../utils/skills';
import VSkillCross from './VSkillCross';

type VSkillBoxProps = BaseProp & {
  label: string;
  icon: SkillIcon;
  color?: string;
  active?: boolean;
};

export default function VSkillBox({ className, label, icon: Icon, color = 'yellow', active = false }: VSkillBoxProps) {
  return (
    <div
      className={cx(
        'group relative w-full h-full flex flex-col items-center justify-center gap-[0.375rem] p-[0.5rem]',
        className
      )}
    >
      <VSkillCross color={color} />

      <div
        className={cx('absolute inset-0 transition-opacity', active ? 'opacity-20' : 'opacity-10')}
        style={{ backgroundColor: cssColor(color) }}
      />

      <Icon
        role="img"
        aria-label={label}
        className="relative w-lg-fixed h-lg-fixed shrink-0 object-contain text-white rounded-2 mb-[0.5rem]"
      />

      <div className="relative font-bold text-white text-[0.875rem] text-center">{label}</div>
    </div>
  );
}
