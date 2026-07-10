import { useEffect, useRef, useSyncExternalStore } from 'react';
import { getEmail, requestEmail, subscribe } from '../stores/email';

/**
 * Keeps the real email address out of the shipped bundle entirely: it only ever exists in this
 * response, fetched from `/api/email` (served by the Vite dev middleware or `server.js`). By
 * default the fetch only fires once the returned `ref` element scrolls into the viewport, so a
 * bot that doesn't run JS (or doesn't scroll) never sees a request for it, let alone a real
 * address. Pass `lazy: false` to fetch immediately on mount instead (e.g. for the CV, where the
 * headless PDF render has no meaningful "viewport").
 *
 * The actual request is deduplicated in `stores/email`: whichever instance triggers first wins,
 * every other instance (mounted elsewhere on the page) just observes the same resolved value.
 */
export default function useRevealableEmail<T extends HTMLElement = HTMLElement>(lazy: boolean = true) {
  const email = useSyncExternalStore(subscribe, getEmail);
  const ref = useRef<T>(null);

  useEffect(() => {
    if (email) {
      return;
    }

    if (!lazy || typeof IntersectionObserver === 'undefined' || !ref.current) {
      requestEmail();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        requestEmail();
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [email, lazy]);

  return { email, ref };
}
