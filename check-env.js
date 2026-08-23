/**
 * Validates that every environment variable the production build and server need is present,
 * loading `.env` first when one exists (outside production). Used by the `build` npm script (so a
 * Docker image is never produced from an unconfigured environment) and by server.js on startup.
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ENV_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env');

// Production images get their configuration from the environment, so dotenv is a devDependency
// and is only pulled in when there is actually a .env file to read.
if (process.env.NODE_ENV !== 'production' && existsSync(ENV_FILE)) {
  await import('dotenv/config');
}

const REQUIRED = [
  {
    name: 'CONTACT_EMAIL',
    hint: 'Address the /api/email and /api/contact routes use.',
  },
  {
    name: 'RESEND_API_KEY',
    hint: 'Get one at https://resend.com/api-keys.',
  },
  {
    name: 'TURNSTILE_SECRET_KEY',
    hint: 'Turnstile tab of the Cloudflare dashboard.',
  },
];

export function resolveEnv() {
  const values = {};
  const missing = [];

  for (const { name, hint } of REQUIRED) {
    const value = process.env[name] || '';
    if (value) {
      values[name] = value;
    } else {
      missing.push({ name, hint });
    }
  }

  return { values, missing };
}

export function requireEnv(context) {
  const { values, missing } = resolveEnv();

  if (missing.length > 0) {
    console.error(`Refusing to ${context}: missing required environment variables.\n`);
    for (const { name, hint } of missing) {
      console.error(`  ${name} — ${hint}`);
    }
    console.error('\nSet them in the environment or copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  return values;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  requireEnv(process.argv[2] || 'build');
}
