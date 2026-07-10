/**
 * Shared handler for the `/api/contact` route, used by both the Vite dev middleware and
 * server.js. Delivers contact-form submissions via the Resend API (https://resend.com).
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstile(token) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error('TURNSTILE_SECRET_KEY is not set');
    return false;
  }

  if (!token) {
    return false;
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token }),
  });

  const data = await response.json();
  return data.success === true;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export async function handleContact(req, res, { to }) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end();
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    sendJson(res, 500, { success: false });
    return;
  }

  try {
    const { email, subject, message, turnstileToken } = await readJsonBody(req);

    if (!(await verifyTurnstile(turnstileToken))) {
      sendJson(res, 403, { success: false });
      return;
    }

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'tonybogdanov.com <onboarding@resend.dev>',
        to,
        reply_to: email,
        subject,
        text: `From: ${email}\n---\n${message}`,
      }),
    });

    sendJson(res, response.ok ? 200 : 502, { success: response.ok });
  } catch (err) {
    console.error('Failed to send contact form email', err);
    sendJson(res, 500, { success: false });
  }
}
