/** Shared handler for the `/api/email` route, used by both the Vite dev middleware and server.js. */
export function handleEmail(email, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ email }));
}
