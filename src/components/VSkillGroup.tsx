import cx from 'classnames';
import { BaseProp } from '../utils/base-props';
import { cssColor } from '../utils/color';
import VSkillCross from './VSkillCross';

type VSkillGroupProps = BaseProp & {
  label: string;
  description: string;
  color?: string;
  active?: boolean;
};

export default function VSkillGroup({
  className,
  label,
  description,
  color = 'yellow',
  active = false,
}: VSkillGroupProps) {
  return (
    <div className={cx('group relative z-10 w-full h-full text-black p-[0.5rem] flex flex-col', className)}>
      <VSkillCross color={color} />

      <div
        className={cx('absolute inset-0 transition-opacity', active ? 'opacity-100' : 'opacity-75')}
        style={{ backgroundColor: cssColor(color) }}
      />

      <div className="relative font-serif text-xs-fixed">{label}</div>
      <div className="relative text-[0.875rem] leading-[1.25] mt-auto">{description}</div>
    </div>
  );
}
