/**
 * Module-level store shared by every `useRevealableEmail` instance, so that if e.g. both the
 * footer and the contact section become visible around the same time, only one `/api/email`
 * request is ever issued; the rest just await that same in-flight request.
 */
let email: string | null = null;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

const INITIAL_RETRY_DELAY_MS = 100;
const MAX_RETRY_DELAY_MS = 51200; // INITIAL_RETRY_DELAY_MS * 2^9

function notify() {
  listeners.forEach((listener) => listener());
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// On failure, retries indefinitely with exponential backoff (100ms, 200ms, 400ms, ... capped at
// 51.2s), since the whole point of this endpoint is for a real client to eventually get through.
async function attempt(delay: number): Promise<void> {
  try {
    const response = await fetch('/api/email');
    if (!response.ok) {
      throw new Error(`Unexpected status ${response.status}`);
    }
    const data: { email: string } = await response.json();
    email = data.email;
    notify();
  } catch {
    await sleep(delay);
    await attempt(Math.min(delay * 2, MAX_RETRY_DELAY_MS));
  }
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getEmail() {
  return email;
}

export function requestEmail(): Promise<void> {
  if (email !== null) {
    return Promise.resolve();
  }

  if (!pending) {
    pending = attempt(INITIAL_RETRY_DELAY_MS).finally(() => {
      pending = null;
    });
  }

  return pending;
}
