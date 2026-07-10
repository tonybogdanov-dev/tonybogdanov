import { Fragment, type ReactNode } from 'react';

/**
 * Renders each string as its own line, joined by `<br/>` (e.g. `['a', 'b']` -> `<>a<br/>b</>`).
 */
export function arrayToLines(lines: string[]): ReactNode {
  return lines.map((line, index) => (
    <Fragment key={index}>
      {index > 0 && <br />}
      {line}
    </Fragment>
  ));
}
