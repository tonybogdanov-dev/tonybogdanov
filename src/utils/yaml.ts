import fs from 'node:fs';
import { parse } from 'yaml';

/** Reads and parses a YAML file synchronously; used by config.node.ts for Node-side config loading. */
export function loadYaml<T>(filePath: string): T {
  return parse(fs.readFileSync(filePath, 'utf8')) as T;
}
