import { type ReactNode } from 'react';
import cx from 'classnames';
import { BaseProp } from '../utils/base-props';

type Align = 'start' | 'center' | 'end';


interface VAlignerProps extends BaseProp {
  children: ReactNode;
  before?: ReactNode;
  after?: ReactNode;
  stretch?: boolean;
  vertical?: boolean;
  xs?: Align;
  sm?: Align;
  md?: Align;
  lg?: Align;
  xl?: Align;
  xxl?: Align;
}

/**
 * Flex row (or column, if `vertical`) of `before`/children/`after`, each breakpoint prop (`xs`
 * through `xxl`) hiding the `before` (`start`) or `after` (`end`) side from that size upward, each
 * falling back to the nearest smaller breakpoint's setting when unset.
 */
export default function VAligner({
  children,
  before,
  after,
  stretch = false,
  vertical = false,
  xs = 'center',
  sm,
  md,
  lg,
  xl,
  xxl,
  className,
}: VAlignerProps) {
  const base = vertical ? 'flex flex-col' : 'flex';

  const sideClasses = (side: Align) =>
    cx(
      'relative flex-1',
      xs === side && 'hidden',
      sm !== undefined && (sm === side ? 'sm:hidden' : 'sm:block'),
      md !== undefined && (md === side ? 'md:hidden' : 'md:block'),
      lg !== undefined && (lg === side ? 'lg:hidden' : 'lg:block'),
      xl !== undefined && (xl === side ? 'xl:hidden' : 'xl:block'),
      xxl !== undefined && (xxl === side ? 'xxl:hidden' : 'xxl:block')
    );

  return (
    <div className={cx(base, stretch && 'h-full items-stretch', className)}>
      <div className={sideClasses('start')}>{before}</div>
      <div className="relative flex-none">{children}</div>
      <div className={sideClasses('end')}>{after}</div>
    </div>
  );
}
