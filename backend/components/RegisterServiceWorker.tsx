'use client';

import { useEffect } from 'react';

// Registering a service worker (even a minimal one) is what lets Chrome on
// Android offer the automatic "Install app" prompt — iOS Safari's manual
// "Add to Home Screen" doesn't need it, but this doesn't hurt there either.
export default function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Non-fatal: the app still works fully without the install/offline
        // benefits this enables.
      });
    }
  }, []);

  return null;
}
