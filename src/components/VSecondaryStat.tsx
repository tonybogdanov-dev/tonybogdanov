import cx from 'classnames';
import { BaseProp } from '../utils/base-props';
import { arrayToLines } from '../utils/array-to-lines';

interface VSecondaryStatProps extends BaseProp {
  value: string[];
  label: string[];
  color: 'blue' | 'green' | 'yellow' | 'red';
}

const colorClasses = {
  blue: 'text-blue',
  green: 'text-green',
  yellow: 'text-yellow',
  red: 'text-red',
};

export default function VSecondaryStat({ value, label, color, className }: VSecondaryStatProps) {
  return (
    <div className={cx('grid grid-cols-2 gap-x-sm-fixed items-center py-[0.5rem]', className)}>
      <div className={cx('text-md-fixed font-serif text-right', colorClasses[color])}>{arrayToLines(value)}</div>
      <div className="text-[0.875em] leading-[1.25] text-[#999] text-left">{arrayToLines(label)}</div>
    </div>
  );
}
