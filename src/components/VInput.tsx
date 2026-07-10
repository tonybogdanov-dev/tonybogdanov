import { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import cx from 'classnames';

type VInputProps = { label: string; id: string } & (
  | ({ multiline: true } & TextareaHTMLAttributes<HTMLTextAreaElement>)
  | ({ multiline?: false } & InputHTMLAttributes<HTMLInputElement>)
);

/** Labeled form field; renders a `<textarea>` when `multiline` is set, otherwise an `<input>`. */
export default function VInput(props: VInputProps) {
  const { label, id, className, required } = props;

  return (
    <div>
      <label className="block font-700 mb-[0.25rem]" htmlFor={id}>
        {label}
        {required && <span className="text-red"> *</span>}
      </label>
      {props.multiline ?
        <textarea
          id={id}
          className={cx(
            'w-full rounded-2 border-[0.125rem] border-[#eee] bg-[#f8f8f8] px-[1rem] py-[0.75rem]',
            'font-[inherit] text-[0.875rem] text-[#555] placeholder:text-[#bbb]',
            'focus:outline-none focus:border-blue focus:bg-white transition-colors focus:duration-0',
            'disabled:border-[#f8f8f8] disabled:text-[#bbb]',
            'resize-none',
            className
          )}
          {...omit(props)}
        />
      : <input
          id={id}
          className={cx(
            'w-full rounded-2 border-[0.125rem] border-[#eee] bg-[#f8f8f8] px-[1rem] py-[0.75rem]',
            'font-[inherit] text-[0.875rem] text-[#555] placeholder:text-[#bbb]',
            'focus:outline-none focus:border-blue focus:bg-white transition-colors focus:duration-0',
            'disabled:border-[#f8f8f8] disabled:text-[#bbb]',
            className
          )}
          {...omit(props)}
        />
      }
    </div>
  );
}

function omit<T extends { label: string; id: string; multiline?: boolean; className?: string }>(props: T) {
  const { label, id, multiline, className, ...rest } = props;
  return rest;
}
