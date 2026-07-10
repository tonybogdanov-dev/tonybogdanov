import cx from 'classnames';

import { BaseProp } from '../utils/base-props';
import { cssColor } from '../utils/color';
import VUnderline from './VUnderline';

interface VHeadlineProps extends BaseProp {
  headline?: string;
  subline?: string;
  color?: string;
  underlineColor?: string;
}

export default function VHeadline({ headline, subline, color, underlineColor, className }: VHeadlineProps) {
  return (
    <div className={cx('mb-xs', className)}>
      {subline && <VUnderline text={subline} color={underlineColor} />}
      {headline && (
        <div
          className={cx('font-serif text-md', !color && 'text-blue-d50')}
          style={{ color: color ? cssColor(color) : undefined }}
        >
          {headline}
        </div>
      )}
    </div>
  );
}
