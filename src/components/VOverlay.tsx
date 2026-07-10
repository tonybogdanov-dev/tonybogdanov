import cx from 'classnames';
import { config } from '../../config.browser';
import { BaseProp } from '../utils/base-props';
import { cssColor } from '../utils/color';

type VOverlayProps = BaseProp & {
  color?: string;
};

/**
 * Absolute overlay in `color` (Tailwind name or literal CSS color, default `config.overlay.color`
 * from config/overlay.yaml) at `config.overlay.opacity`, tinting whatever sits behind it.
 */
export default function VOverlay({ className, color = config.overlay.color }: VOverlayProps) {
  return (
    <div
      className={cx('absolute inset-0', className)}
      style={{ backgroundColor: cssColor(color), opacity: config.overlay.opacity / 100 }}
    />
  );
}
