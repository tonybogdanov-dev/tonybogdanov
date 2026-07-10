import cx from 'classnames';
import { CSSProperties, useLayoutEffect, useRef, useState } from 'react';

import { config } from '../../config.browser';
import { BaseProp } from '../utils/base-props';
import { cssColor } from '../utils/color';

const SM = parseFloat(config.breakpoints.sm) * 16;

const textClass = [
  'font-serif text-[length:var(--fs-xs)] sm:text-[length:var(--fs-sm)] md:text-[length:var(--fs-md)]',
  'lg:text-[length:var(--fs-lg)] xl:text-[length:var(--fs-xl)] xxl:text-[length:var(--fs-xxl)]',
  '[dominant-baseline:hanging]',
].join(' ');

const fontVars = {
  '--fs-xs': `${config.focus.xs}rem`,
  '--fs-sm': `${config.focus.sm}rem`,
  '--fs-md': `${config.focus.md}rem`,
  '--fs-lg': `${config.focus.lg}rem`,
  '--fs-xl': `${config.focus.xl}rem`,
  '--fs-xxl': `${config.focus.xxl}rem`,
} as CSSProperties;

type VFocusProps = BaseProp & {
  label: string[];
  color?: string;
};

/**
 * `label` (one line per entry) masked out of a `color` (Tailwind name or literal CSS color,
 * default `config.overlay.color` from config/overlay.yaml) rect at `config.overlay.opacity`,
 * sized to the rendered text.
 */
export default function VFocus({ className, label, color = config.overlay.color }: VFocusProps) {
  const textRef = useRef<SVGTextElement>(null);
  const [box, setBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [centered, setCentered] = useState(window.innerWidth < SM);

  useLayoutEffect(() => {
    const measure = () => {
      if (!textRef.current) return;
      const b = textRef.current.getBBox();
      setBox({ x: b.x, y: b.y, w: b.width, h: b.height });
      setCentered(window.innerWidth < SM);
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const tspanX = centered ? box.x + box.w / 2 : 0;
  const vbX = Math.floor(box.x);
  const vbY = Math.floor(box.y);
  const vbW = Math.ceil(box.x + box.w) - vbX;
  const vbH = Math.ceil(box.y + box.h) - vbY;

  return (
    <svg className={className} width={vbW} height={vbH} viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}>
      <defs>
        <mask id="mask">
          <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="white" />
          <text
            style={{ ...fontVars, textAnchor: centered ? 'middle' : 'start' }}
            className={cx(textClass, 'fill-black')}
            x="0"
            y="0"
          >
            {label.map((line, index) => (
              <tspan key={index} x={tspanX} dy={index === 0 ? '0' : '1em'}>
                {line}
              </tspan>
            ))}
          </text>
        </mask>
      </defs>
      <rect
        x={vbX}
        y={vbY}
        width={vbW}
        height={vbH}
        style={{ fill: cssColor(color), fillOpacity: config.overlay.opacity / 100 }}
        mask="url(#mask)"
      />
      {/* hidden measurer — always left-aligned for consistent bbox */}
      <text ref={textRef} style={fontVars} className={textClass} x="0" y="0" visibility="hidden" aria-hidden="true">
        {label.map((line, index) => (
          <tspan key={index} x="0" dy={index === 0 ? '0' : '1em'}>
            {line}
          </tspan>
        ))}
      </text>
    </svg>
  );
}
