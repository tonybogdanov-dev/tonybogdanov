import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { handleEmail } from './src/api/email.js';
import { handleContact } from './src/api/contact.js';
import { requireEnv } from './check-env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '.dist');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Loads .env when present, then exits rather than serving a half-configured site. The email is
// kept out of the client bundle entirely (see useRevealableEmail) and handed over only on an
// explicit runtime request, so harvesting it requires an actual JS-executing client.
const { CONTACT_EMAIL: email } = requireEnv('start the server');

// Written into .dist by the `emit-runtime-config` Vite plugin, so the runtime image ships neither
// the yaml sources nor a yaml parser.
const { upwork } = JSON.parse(readFileSync(path.join(DIST_DIR, '.runtime.json'), 'utf8'));

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function readIfPresent(file) {
  return existsSync(file) ? readFileSync(file) : null;
}

// The whole build is ~1 MB, so it is read into memory once at boot: no fs syscalls per request,
// no directory traversal reachable from a url, and precompressed variants served as-is.
function loadAssets(dir, prefix, assets) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const { name } = entry;
    if (name.startsWith('.')) continue;

    const file = path.join(dir, name);
    const url = `${prefix}/${name}`;

    if (entry.isDirectory()) {
      loadAssets(file, url, assets);
      continue;
    }

    if (name.endsWith('.br') || name.endsWith('.gz')) continue;

    const body = readFileSync(file);
    assets.set(url, {
      body,
      br: readIfPresent(`${file}.br`),
      gzip: readIfPresent(`${file}.gz`),
      type: MIME_TYPES[path.extname(name).toLowerCase()] || 'application/octet-stream',
      etag: `"${createHash('sha1').update(body).digest('base64url')}"`,
      cacheControl: url.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    });
  }

  return assets;
}

const assets = loadAssets(DIST_DIR, '', new Map());
const indexHtml = { ...assets.get('/index.html'), cacheControl: 'no-cache' };

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self'",
  "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

function setSecurityHeaders(res) {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
}

function sendAsset(req, res, asset) {
  res.setHeader('Content-Type', asset.type);
  res.setHeader('Cache-Control', asset.cacheControl);
  res.setHeader('ETag', asset.etag);
  res.setHeader('Vary', 'Accept-Encoding');

  if (req.headers['if-none-match'] === asset.etag) {
    res.statusCode = 304;
    res.end();
    return;
  }

  const accepted = req.headers['accept-encoding'] || '';
  let body = asset.body;

  if (asset.br && /\bbr\b/.test(accepted)) {
    body = asset.br;
    res.setHeader('Content-Encoding', 'br');
  } else if (asset.gzip && /\bgzip\b/.test(accepted)) {
    body = asset.gzip;
    res.setHeader('Content-Encoding', 'gzip');
  }

  res.statusCode = 200;
  res.setHeader('Content-Length', body.length);
  res.end(req.method === 'HEAD' ? undefined : body);
}

function pathnameOf(url) {
  const raw = url.split('?')[0].split('#')[0];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const server = createServer((req, res) => {
  setSecurityHeaders(res);

  const pathname = pathnameOf(req.url);

  if (pathname === '/api/contact') {
    handleContact(req, res, { to: email });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }

  if (pathname === '/_healthz') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ status: 'ok', uptime: Math.round(process.uptime()) }));
    return;
  }

  if (pathname === '/api/email') {
    handleEmail(email, res);
    return;
  }

  if (pathname === '/upwork') {
    res.statusCode = 302;
    res.setHeader('Location', upwork);
    res.end();
    return;
  }

  sendAsset(req, res, assets.get(pathname) || indexHtml);
});

// Hardening against slow-client / slowloris-style connection abuse.
server.requestTimeout = 30_000;
server.headersTimeout = 20_000;
server.keepAliveTimeout = 5_000;

server.listen(PORT, HOST, () => {
  console.log(`Production server listening on http://${HOST}:${PORT}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
