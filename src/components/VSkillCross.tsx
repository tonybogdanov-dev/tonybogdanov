import cx from 'classnames';
import { cssColor } from '../utils/color';

type VSkillCrossProps = {
  color: string;
};

export default function VSkillCross({ color }: VSkillCrossProps) {
  return (
    <>
      <div
        className={cx(
          'absolute w-[0.5rem] h-[0.5rem] -top-[0.125rem] -left-[0.125rem] border-t-[0.0625rem] border-l-[0.0625rem] opacity-0 transition-opacity group-hover:opacity-100'
        )}
        style={{ borderColor: cssColor(color) }}
      />
      <div
        className={cx(
          'absolute w-[0.5rem] h-[0.5rem] -top-[0.125rem] -right-[0.125rem] border-t-[0.0625rem] border-r-[0.0625rem] opacity-0 transition-opacity group-hover:opacity-100'
        )}
        style={{ borderColor: cssColor(color) }}
      />
      <div
        className={cx(
          'absolute w-[0.5rem] h-[0.5rem] -bottom-[0.125rem] -left-[0.125rem] border-b-[0.0625rem] border-l-[0.0625rem] opacity-0 transition-opacity group-hover:opacity-100'
        )}
        style={{ borderColor: cssColor(color) }}
      />
      <div
        className={cx(
          'absolute w-[0.5rem] h-[0.5rem] -bottom-[0.125rem] -right-[0.125rem] border-b-[0.0625rem] border-r-[0.0625rem] opacity-0 transition-opacity group-hover:opacity-100'
        )}
        style={{ borderColor: cssColor(color) }}
      />
    </>
  );
}
