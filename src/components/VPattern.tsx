import cx from 'classnames';
import { BaseProp } from '../utils/base-props';
import { cssColor } from '../utils/color';

type VPatternProps = BaseProp & {
  svg: string;
  color?: string;
  background?: string;
  maskSize?: number;
};

/**
 * Generic `svg` pattern masked onto a `currentColor` layer over `background`, colored by `color`
 * (Tailwind name or literal CSS color for both). Falls back to whatever `className` sets
 * otherwise.
 */
export default function VPattern({ className, svg, color, background, maskSize = 20 }: VPatternProps) {
  return (
    <div
      className={cx('absolute inset-0', className)}
      style={{
        color: color ? cssColor(color) : undefined,
        backgroundColor: background ? cssColor(background) : undefined,
      }}
    >
      <div
        className="absolute inset-0 bg-current"
        style={{
          maskImage: `url("${svg}")`,
          WebkitMaskImage: `url("${svg}")`,
          maskSize: `${maskSize}rem auto`,
          WebkitMaskSize: `${maskSize}rem auto`,
        }}
      />
    </div>
  );
}
