import { Fragment } from 'react';
import cx from 'classnames';
import { BaseProp } from '../utils/base-props';
import VSecondaryStat from './VSecondaryStat';

interface Stat {
  color: 'blue' | 'green' | 'yellow' | 'red';
  value: string[];
  label: string[];
}

interface VSecondaryStatsProps extends BaseProp {
  stats: Stat[];
  statClassName?: string;
}

export default function VSecondaryStats({ stats, className, statClassName }: VSecondaryStatsProps) {
  return (
    <div className={cx('bg-white rounded-3 shadow-2', className)}>
      {stats.map((stat, index) => (
        <Fragment key={index}>
          {index > 0 && <hr className="w-full h-[0.0625rem] m-0 border-0 bg-[#f8f8f8]" />}
          <VSecondaryStat color={stat.color} value={stat.value} label={stat.label} className={statClassName} />
        </Fragment>
      ))}
    </div>
  );
}
