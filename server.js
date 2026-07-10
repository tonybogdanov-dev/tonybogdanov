import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sirv from 'sirv';
import { parse as parseYaml } from 'yaml';
import { handleEmail } from './src/api/email.js';
import { handleContact } from './src/api/contact.js';
import { requireEnv } from './check-env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '.dist');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const indexHtml = readFileSync(path.join(DIST_DIR, 'index.html'));

// Loads .env when present, then exits rather than serving a half-configured site. The email is
// kept out of the client bundle entirely (see useRevealableEmail) and handed over only on an
// explicit runtime request, so harvesting it requires an actual JS-executing client.
const { CONTACT_EMAIL: email } = requireEnv('start the server');

const { profile } = parseYaml(readFileSync(path.join(__dirname, 'config/content.yaml'), 'utf8'));

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

function sendIndexHtml(res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.end(indexHtml);
}

const serveAssets = sirv(DIST_DIR, {
  etag: true,
  gzip: true,
  brotli: true,
  dotfiles: false,
  setHeaders(res, pathname) {
    res.setHeader(
      'Cache-Control',
      pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'
    );
  },
});

const server = createServer((req, res) => {
  setSecurityHeaders(res);

  if (req.url === '/api/contact') {
    handleContact(req, res, { to: email });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }

  if (req.url === '/_healthz') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ status: 'ok', uptime: Math.round(process.uptime()) }));
    return;
  }

  if (req.url === '/api/email') {
    handleEmail(email, res);
    return;
  }

  if (req.url === '/upwork') {
    res.statusCode = 302;
    res.setHeader('Location', profile.upwork);
    res.end();
    return;
  }

  serveAssets(req, res, () => sendIndexHtml(res));
});

// Hardening against slow-client / slowloris-style connection abuse.
server.requestTimeout = 30_000;
server.headersTimeout = 20_000;
server.keepAliveTimeout = 5_000;

server.listen(PORT, HOST, () => {
  console.log(`Production server listening on http://${HOST}:${PORT}`);
});
