import cx from 'classnames';
import { BaseProp } from '../utils/base-props';
import { arrayToLines } from '../utils/array-to-lines';
import VText from './VText';

interface VPrimaryStatProps extends BaseProp {
  value: string;
  params?: Record<string, string | number>;
  label: string[];
}

export default function VPrimaryStat({ value, params, label, className }: VPrimaryStatProps) {
  return (
    <div
      className={cx(
        'bg-gradient-to-b from-blue-d65 to-blue-d50 rounded-3 shadow-2 grid grid-cols-2',
        'gap-x-sm-fixed items-center',
        className
      )}
    >
      <div className="text-blue text-xxl-fixed font-serif text-right">
        <VText text={value} params={params} />
      </div>
      <div className="text-blue text-left">{arrayToLines(label)}</div>
    </div>
  );
}
