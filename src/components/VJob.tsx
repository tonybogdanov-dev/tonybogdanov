import { ReactNode, useState } from 'react';
import { faBuilding, faUserTie, faChevronRight, faArrowRightLong } from '@fortawesome/free-solid-svg-icons';
import cx from 'classnames';

import { BaseProp } from '../utils/base-props';
import VIcon from './VIcon';

export type VJobColor = 'blue' | 'green' | 'red' | 'yellow';

interface VJobProps extends BaseProp {
  label: 'Work' | 'Education';
  color: VJobColor;
  startYear: number;
  endYear?: number;
  position: [string, string];
  company: [string, string];
  companyUrl?: string;
  summary: string;
  flip?: boolean;
  children: ReactNode;
}

const COLOR_TYPE = {
  blue: 'bg-blue-d25',
  green: 'bg-green-d25',
  red: 'bg-red-d25',
  yellow: 'bg-yellow-d25',
};

const COLOR_SHADOW = {
  blue: 'bg-blue',
  green: 'bg-green',
  red: 'bg-red',
  yellow: 'bg-yellow',
};

const COLOR_META = {
  blue: 'text-blue-d35',
  green: 'text-green-d35',
  red: 'text-red-d35',
  yellow: 'text-yellow-d35',
};

const COLOR_YEAR = {
  blue: 'text-blue-w75',
  green: 'text-green-w75',
  red: 'text-red-w75',
  yellow: 'text-yellow-w75',
};

export default function VJob({
  className,
  label,
  color,
  startYear,
  endYear,
  position,
  company,
  companyUrl,
  summary,
  flip = false,
  children,
}: VJobProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cx('relative pb-[0.5rem]', flip ? 'pr-[1.25rem] pl-[0.5rem]' : 'pl-[1.25rem] pr-[0.5rem]', className)}
    >
      <div className="relative">
        <div
          className={cx(
            'absolute top-[0.625rem] w-[1.25rem] h-[5rem] rounded-2',
            flip ? '-right-[1.25rem] rounded-l-none' : '-left-[1.25rem] rounded-r-none',
            'flex items-center justify-center',
            COLOR_TYPE[color]
          )}
        >
          <div
            className={cx(
              'text-white uppercase text-[0.625rem] leading-none font-bold whitespace-nowrap',
              flip ? 'rotate-90' : '-rotate-90'
            )}
          >
            {label}
          </div>
        </div>

        <div
          className={cx(
            'absolute top-[1rem] -bottom-[0.5rem] rounded-2',
            flip ? 'right-[1rem] -left-[0.5rem]' : 'left-[1rem] -right-[0.5rem]',
            COLOR_SHADOW[color]
          )}
        />

        <div className="relative text-[0.875rem] bg-white shadow-1 rounded-2 p-xs">
          <div className="flex gap-xs w-full mb-[0.5rem]">
            <div className="grow">
              <div className="hidden sm:block text-[#bbb] leading-none mb-[0.5rem]">
                {startYear} &mdash; {endYear ?? 'Present'}
              </div>

              <div className="flex gap-[0.5rem] w-full">
                <div className="shrink-0 w-[1.5em] h-[1.5em] flex items-center justify-center text-[#bbb]">
                  <VIcon icon={faUserTie} />
                </div>

                <div className={cx('grow', 'font-bold whitespace-nowrap', COLOR_META[color])} title={position[1]}>
                  {position[0]}
                </div>

                <div className="shrink-0 sm:hidden text-[#bbb]">
                  {startYear}
                  {endYear ?
                    <> &mdash; {endYear}</>
                  : ''}

                  {!endYear && (
                    <>
                      {' '}
                      <VIcon icon={faArrowRightLong} className="text-[0.75rem]" />
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-[0.5rem] w-full">
                <div className="shrink-0 w-[1.5em] h-[1.5em] flex items-center justify-center text-[#bbb]">
                  <VIcon icon={faBuilding} />
                </div>

                <div className={cx('grow whitespace-nowrap', COLOR_META[color])}>
                  {companyUrl ?
                    <a href={companyUrl} target="_blank" rel="noopener noreferrer" className="underline" title={company[1]}>
                      {company[0]}
                    </a>
                  : <span title={company[1]}>{company[0]}</span>}
                </div>
              </div>
            </div>

            <div
              className={cx(
                'hidden sm:block shrink-0 text-lg-fixed leading-none font-serif self-center',
                COLOR_YEAR[color]
              )}
            >
              {startYear}
            </div>
          </div>

          {!expanded && (
            <>
              {summary}
              <button
                type="button"
                title="Read more"
                onClick={() => setExpanded(true)}
                className={cx(
                  'w-[1.3125rem] h-[1.3125rem] inline-block ml-[0.5rem] font-bold underline rounded-full',
                  'text-[0.75rem] text-white',
                  COLOR_TYPE[color]
                )}
              >
                <VIcon icon={faChevronRight} />
              </button>
            </>
          )}

          {expanded && children}
        </div>
      </div>
    </div>
  );
}
