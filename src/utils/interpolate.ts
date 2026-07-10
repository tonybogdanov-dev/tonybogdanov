/** Replaces `{key}` placeholders in `text` with values from `params`. */
export function interpolate(text: string, params: Record<string, string | number>): string {
  return text.replace(/\{(\w+)}/g, (match, key) => (key in params ? String(params[key]) : match));
}
