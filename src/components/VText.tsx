import Markdown from 'markdown-to-jsx';
import { ComponentType, ReactNode } from 'react';
import VUnderline from './VUnderline';
import { interpolate } from '../utils/interpolate';

interface TextComponentProps {
  text: string;
}

// Custom markup directives: a `<tag>...</tag>` in the markdown source renders via this component
// instead of its literal HTML tag.
const DIRECTIVES: Record<string, ComponentType<TextComponentProps>> = {
  u: VUnderline,
};

const OVERRIDES = Object.fromEntries(
  Object.entries(DIRECTIVES).map(([tag, Component]) => [
    tag,
    {
      component: ({ children }: { children?: ReactNode }) => (
        <Component text={typeof children === 'string' ? children : String(children)} />
      ),
    },
  ])
);

interface VTextProps {
  text: string | string[];
  params?: Record<string, string | number>;
}

/**
 * Renders `text` as markdown. `DIRECTIVES` maps specific tags (e.g. `<u>`) to a React component
 * in place of the literal HTML tag they'd otherwise produce; everything else renders as plain
 * markdown-to-HTML. `{key}` placeholders are substituted from `params` before parsing.
 */
export default function VText({ text, params = {} }: VTextProps) {
  const lines = Array.isArray(text) ? text : [text];

  return (
    <>
      {lines.map((line, index) => (
        <Markdown key={index} options={{ overrides: OVERRIDES, forceBlock: true }}>
          {interpolate(line, params)}
        </Markdown>
      ))}
    </>
  );
}
