import { faCircleCheck, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import cx from 'classnames';
import { BaseProp } from '../utils/base-props';
import VIcon from './VIcon';

interface VAlertProps extends BaseProp {
  text: string;
  type: 'success' | 'error';
}

const ICONS = {
  success: faCircleCheck,
  error: faCircleExclamation,
};

export default function VAlert({ text, type, className }: VAlertProps) {
  return (
    <div
      className={cx(
        'flex gap-2 text-[0.875rem] rounded-2 border-[0.125rem] p-[0.75rem]',
        'success' === type && 'border-green-w50 text-green-d25 bg-green-w75',
        'error' === type && 'border-red-w50 text-red-d25 bg-red-w75',
        className
      )}
    >
      <div className="w-[1.3125rem] h-[1.3125rem] flex items-center justify-center shrink-0">
        <VIcon icon={ICONS[type]} className="" />
      </div>
      <div className="">{text}</div>
    </div>
  );
}
