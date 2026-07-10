import { useId } from 'react';
import cx from 'classnames';
import { config } from '../../config.browser';

export type MaxWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | number | null;

const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
const maxWidthClasses = [
  'max-w-container-xs',
  'sm:max-w-container-sm',
  'md:max-w-container-md',
  'lg:max-w-container-lg',
  'xl:max-w-container-xl',
  'xxl:max-w-container-xxl',
];

const containerRems = breakpointOrder.map((bp) => parseFloat(config.containers[bp]));

/**
 * Resolves a `MaxWidth` value into a Tailwind class ladder (breakpoint name or `null`)
 * or a scoped `<style>` rule set (number, since Tailwind can't JIT arbitrary values that
 * only exist at runtime). Apply `className` to the target element and render `style`
 * (if present) anywhere in the same tree.
 */
export default function useMaxWidth(max: MaxWidth) {
  const scopedClass = `mw-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const maxWidthClass =
    max === null ? maxWidthClasses.join(' ')
    : typeof max === 'string' ? maxWidthClasses.slice(0, breakpointOrder.indexOf(max) + 1).join(' ')
    : null;

  let scopedStyle: string | null = null;
  if (typeof max === 'number') {
    let prev: number | null = null;
    const rules: string[] = [];
    breakpointOrder.forEach((bp, index) => {
      const value = Math.min(containerRems[index], max);
      if (value === prev) {
        return;
      }
      prev = value;
      const rule = `.${scopedClass}{max-width:${value}rem}`;
      rules.push(index === 0 ? rule : `@media (min-width:${config.breakpoints[bp]}){${rule}}`);
    });
    scopedStyle = rules.join('');
  }

  return {
    className: cx(maxWidthClass, scopedStyle && scopedClass),
    style: scopedStyle,
  };
}
