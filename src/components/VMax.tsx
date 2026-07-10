import { type ReactNode } from 'react';
import cx from 'classnames';
import { BaseProp } from '../utils/base-props';
import useMaxWidth, { type MaxWidth } from '../hooks/useMaxWidth';

interface VMaxProps extends BaseProp {
  children: ReactNode;
  max: Exclude<MaxWidth, null>;
}

export default function VMax({ children, max, className }: VMaxProps) {
  const maxWidth = useMaxWidth(max);

  return (
    <div className={cx('w-full', maxWidth.className, className)}>
      {maxWidth.style && <style>{maxWidth.style}</style>}
      {children}
    </div>
  );
}
