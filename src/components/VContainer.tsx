import { type ReactNode } from 'react';
import cx from 'classnames';
import { BaseProp } from '../utils/base-props';
import useMaxWidth, { type MaxWidth } from '../hooks/useMaxWidth';

interface VContainerProps extends BaseProp {
  children: ReactNode;
  before?: ReactNode;
  after?: ReactNode;
  stretch?: boolean;
  max?: MaxWidth;
  innerClassName?: string;
  beforeClassName?: string;
  afterClassName?: string;
}

export default function VContainer({
  children,
  before,
  after,
  stretch = false,
  max = null,
  className,
  innerClassName,
  beforeClassName,
  afterClassName,
}: VContainerProps) {
  const maxWidth = useMaxWidth(max);

  return (
    <div className={cx('w-full flex', stretch && 'h-full', className)}>
      {maxWidth.style && <style>{maxWidth.style}</style>}
      <div className={cx('relative flex-1 min-w-[0.5rem]', stretch && 'h-full', beforeClassName)}>{before}</div>
      <div className={cx('relative w-full grow-0 shrink', maxWidth.className, stretch && 'h-full', innerClassName)}>
        {children}
      </div>
      <div className={cx('relative flex-1 min-w-[0.5rem]', stretch && 'h-full', afterClassName)}>{after}</div>
    </div>
  );
}
