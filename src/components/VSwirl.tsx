import cx from 'classnames';
import { BaseProp } from '../utils/base-props';

type VSwirlProps = BaseProp;

/** Fixed, full-viewport swirl background (blue saturation blend + blur over the `swirl` bg). */
export default function VSwirl({ className }: VSwirlProps) {
  return (
    <div className={cx('fixed inset-0 swirl', className)}>
      <div className="absolute inset-0 bg-blue mix-blend-saturation" />
      <div className="absolute inset-0 backdrop-blur-[1rem]" />
    </div>
  );
}
