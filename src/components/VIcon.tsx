import { type IconDefinition } from '@fortawesome/fontawesome-common-types';
import cx from 'classnames';

interface VIconProps {
  icon: IconDefinition;
  className?: string;
}

/** Renders a Font Awesome icon definition as a plain inline SVG, without the `fontawesome-svg-core` runtime. */
export default function VIcon({ icon, className }: VIconProps) {
  const [width, height, , , pathData] = icon.icon;
  const d = Array.isArray(pathData) ? pathData[1] : pathData;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ height: '1em', width: `${(width / height).toFixed(3)}em` }}
      className={cx('inline-block shrink-0 align-[-0.125em] fill-current overflow-visible', className)}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
