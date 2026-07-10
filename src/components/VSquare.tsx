import cx from 'classnames';
import { type ReactNode } from 'react';
import { BaseProp } from '../utils/base-props';

type VSquareProps = BaseProp & {
  children?: ReactNode;
};

/** Square box (100% width, 0 height, 100% bottom padding) holding `children` absolutely positioned to fill it. */
export default function VSquare({ className, children }: VSquareProps) {
  return (
    <div className={cx('relative w-full h-0 pb-[100%]', className)}>
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}
