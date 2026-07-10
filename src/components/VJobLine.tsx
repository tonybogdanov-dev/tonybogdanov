import cx from 'classnames';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { BaseProp } from '../utils/base-props';
import { cssColor, resolveCssColor } from '../utils/color';
import { VJobColor } from './VJob';

type VJobLineProps = BaseProp & {
  sourceColor: VJobColor;
  targetColor: VJobColor;
  flip?: boolean;
};

type Point = { x: number; y: number };

function bezierD(w: number, h: number, flip: boolean) {
  const fx = (x: number) => (flip ? w - x : x);

  const p1: Point = { x: fx(0), y: 0 };
  const p2: Point = { x: w / 2, y: h / 2 };
  const p3: Point = { x: fx(0), y: h };

  const c1 = { x: p2.x, y: h / 8 };
  const c2 = { x: 2 * p2.x - c1.x, y: 2 * p2.y - c1.y };

  return `M${p1.x} ${p1.y} Q${c1.x} ${c1.y} ${p2.x} ${p2.y} Q${c2.x} ${c2.y} ${p3.x} ${p3.y}`;
}

const DASH_SPEED = 28;
const DASH_ARRAY = [10, 6];
const DASH_ARRAY_STR = DASH_ARRAY.join(' ');
const DASH_PERIOD = DASH_ARRAY[0] + DASH_ARRAY[1];

export default function VJobLine({ className, sourceColor, targetColor, flip = false }: VJobLineProps) {
  const gradientId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [{ w, h }, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    if (!boxRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, []);

  const d = bezierD(w, h, flip);

  const [length, setLength] = useState(0);

  useLayoutEffect(() => {
    if (!w || !h) return;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    setLength(path.getTotalLength());
  }, [d, w, h]);

  const dur = length / DASH_SPEED;
  const dashPhase = (DASH_PERIOD - (length % DASH_PERIOD)) % DASH_PERIOD;
  const dashSweep = Math.round(length / DASH_PERIOD) * DASH_PERIOD;
  const sourceFull = resolveCssColor(sourceColor);
  const targetFull = resolveCssColor(`${targetColor}-d25`);

  return (
    <div className={cx('relative w-full h-sm pointer-events-none', className)}>
      <div
        ref={boxRef}
        className={cx(
          'absolute hidden sm:block w-[2rem] -top-[1.5rem] -bottom-[3rem]',
          flip ? '-left-[2rem]' : '-right-[2rem]'
        )}
      >
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2={h} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={cssColor(sourceColor)} />
              <stop offset="1" stopColor={cssColor(`${targetColor}-d25`)} />
            </linearGradient>
          </defs>
          <g fill="none" stroke="#000" strokeWidth={2} strokeLinecap="round">
            <path stroke={`url(#${gradientId})`} strokeDasharray={DASH_ARRAY_STR} d={d}>
              {dur > 0 && (
                <animate
                  attributeName="stroke-dashoffset"
                  values={`${dashPhase};${dashPhase + dashSweep}`}
                  dur={`${dur}s`}
                  keyTimes="0;1"
                  calcMode="linear"
                  repeatCount="indefinite"
                />
              )}
            </path>
          </g>
          {dur > 0 && (
            <g fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 -3 L0 0 L3 3" stroke={targetFull}>
                <animateMotion
                  dur={`${dur}s`}
                  repeatCount="indefinite"
                  rotate="auto"
                  keyPoints="1;0"
                  keyTimes="0;1"
                  calcMode="linear"
                  path={d}
                />
                <animate
                  attributeName="stroke"
                  values={`${targetFull};${sourceFull}`}
                  dur={`${dur}s`}
                  keyTimes="0;1"
                  calcMode="linear"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
