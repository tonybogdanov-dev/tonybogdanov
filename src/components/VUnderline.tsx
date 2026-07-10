import { useState } from 'react';
import cx from 'classnames';
import { BaseProp } from '../utils/base-props';
import { cssColor } from '../utils/color';

interface VUnderlineProps extends BaseProp {
  text: string;
  color?: string;
}

const START_RADIUS = 2;
const END_RADIUS = 1;
const MIN_CP_DIST = 6;

const START_Y_MIN = 0.5;
const START_Y_MAX = 1;
const END_Y_MIN = 0;
const END_Y_MAX = 0.5;

const perp = (dx: number, dy: number): [number, number] => {
  const m = Math.sqrt(dx * dx + dy * dy);
  return m === 0 ? [0, 1] : [-dy / m, dx / m];
};

const generate = () => {
  const W = 64,
    H = 8;
  const startX = START_RADIUS;
  const endX = W - END_RADIUS;

  const rand = (min: number, max: number) => min + Math.random() * (max - min);

  const startY = rand(Math.max(START_RADIUS, H * START_Y_MIN), Math.min(H - START_RADIUS, H * START_Y_MAX));
  const endY = rand(Math.max(END_RADIUS, H * END_Y_MIN), Math.min(H - END_RADIUS, H * END_Y_MAX));

  const cp1x = rand(startX + MIN_CP_DIST, W / 2 - START_RADIUS);
  const cp1y = rand(START_RADIUS, H - START_RADIUS);
  const cp2x = rand(W / 2 + END_RADIUS, endX - MIN_CP_DIST);
  const cp2y = rand(END_RADIUS, H - END_RADIUS);

  const [nxS, nyS] = perp(cp1x - startX, cp1y - startY);
  const [nxE, nyE] = perp(endX - cp2x, endY - cp2y);

  const tsx = startX + nxS * START_RADIUS,
    tsy = startY + nyS * START_RADIUS;
  const bsx = startX - nxS * START_RADIUS,
    bsy = startY - nyS * START_RADIUS;
  const tex = endX + nxE * END_RADIUS,
    tey = endY + nyE * END_RADIUS;
  const bex = endX - nxE * END_RADIUS,
    bey = endY - nyE * END_RADIUS;

  const tcp1x = cp1x + nxS * START_RADIUS,
    tcp1y = cp1y + nyS * START_RADIUS;
  const tcp2x = cp2x + nxE * END_RADIUS,
    tcp2y = cp2y + nyE * END_RADIUS;
  const bcp1x = cp1x - nxS * START_RADIUS,
    bcp1y = cp1y - nyS * START_RADIUS;
  const bcp2x = cp2x - nxE * END_RADIUS,
    bcp2y = cp2y - nyE * END_RADIUS;

  const path = [
    `M ${tsx},${tsy}`,
    `C ${tcp1x},${tcp1y} ${tcp2x},${tcp2y} ${tex},${tey}`,
    `L ${bex},${bey}`,
    `C ${bcp2x},${bcp2y} ${bcp1x},${bcp1y} ${bsx},${bsy}`,
    'Z',
  ].join(' ');

  return { path, startX, startY, endX, endY };
};

/** Text with a hand-drawn, randomly-reshuffled underline squiggle (click to regenerate). */
export default function VUnderline({ text, color, className }: VUnderlineProps) {
  const [{ path, startX, startY, endX, endY }, setShape] = useState(generate);

  return (
    <span
      className={cx('inline-block font-bold relative', !color && 'text-blue', className)}
      style={{ color: color ? cssColor(color) : undefined }}
      onClick={() => setShape(generate())}
    >
      {text}
      <svg
        className="absolute left-0 w-full pointer-events-none"
        style={{ top: 'calc(100% - 0.125em)', height: '0.4375em' }}
        viewBox="0 0 64 8"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <circle cx={startX} cy={startY} r={START_RADIUS} fill="currentColor" />
        <circle cx={endX} cy={endY} r={END_RADIUS} fill="currentColor" />
        <path d={path} fill="currentColor" />
      </svg>
    </span>
  );
}
