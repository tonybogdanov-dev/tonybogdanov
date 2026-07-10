import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import cx from 'classnames';

interface VButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: ReactNode;
  iconPosition?: 'leading' | 'trailing';
  variant?: 'outline' | 'ghost';
  href?: string;
  download?: boolean;
}

/** Pill-shaped outline button (blue border/text) that fills solid blue on hover/active, with a leading or trailing `icon`. */
export default function VButton({
  label,
  icon,
  iconPosition = 'trailing',
  variant = 'outline',
  href,
  download,
  className,
  ...props
}: VButtonProps) {
  const text = <span className="block h-[3.5rem] text-[1rem] leading-[3.5rem]">{label}</span>;
  const content =
    iconPosition === 'leading' ?
      <>
        {icon}
        {text}
      </>
    : <>
        {text}
        {icon}
      </>;

  const classes = cx(
    'inline-flex items-center gap-2 px-6 h-[3.5rem] rounded-full',
    'border-[0.125rem] bg-transparent text-blue',
    'font-sans font-700',
    'transition-[background-color,border-color,color] hover:bg-blue hover:text-white active:bg-blue-b25',
    'active:text-white active:duration-0',
    'cursor-pointer select-none',
    'disabled:bg-[#f8f8f8] disabled:border-[#f8f8f8] disabled:text-[#bbb]',
    'disabled:cursor-not-allowed disabled:pointer-events-none',
    variant === 'outline' ?
      'border-blue active:border-blue-b25'
    : 'border-transparent hover:border-blue active:border-blue-b25',
    className
  );

  if (href) {
    return (
      <a href={href} download={download} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {content}
    </button>
  );
}
