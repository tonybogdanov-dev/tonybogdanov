import { type Ref } from 'react';
import cx from 'classnames';
import { type IconDefinition } from '@fortawesome/fontawesome-common-types';
import { BaseProp } from '../utils/base-props';
import { cssColor } from '../utils/color';
import { shortUrl } from '../utils/url';
import VIcon from './VIcon';

interface VContactProps extends BaseProp {
  icon: IconDefinition;
  label: string;
  value: string;
  url?: string;
  innerRef?: Ref<HTMLDivElement>;
}

export default function VContact({ icon, label, value, url, className, innerRef }: VContactProps) {
  return (
    <div ref={innerRef} className={cx('flex gap-[0.5rem]', className)}>
      <div
        className="w-[1.5rem] h-[1.5rem] text-[1.125rem] flex items-center justify-center"
        style={{ color: cssColor('blue-d25') }}
      >
        <VIcon icon={icon} />
      </div>
      <div>
        <div className="font-bold leading-[1.25]">{label}</div>
        <div className="text-[0.875rem]">
          {url ?
            <a href={url} target="_blank" className="text-blue-d25 underline">
              {shortUrl(value)}
            </a>
          : value}
        </div>
      </div>
    </div>
  );
}
