const STORAGE_KEY = 'scannerapp_device_id';

/**
 * A stable per-browser-install identifier, used to tell which phone/device
 * submitted a scan. There's no login system, so this is a randomly
 * generated ID persisted in localStorage on first use — not a durable
 * hardware identifier (clearing site data or reinstalling as a PWA issues a
 * new one), but stable across sessions on the same device otherwise.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // Private browsing / storage blocked — fall back to a per-session id
    // rather than leaving every scan from this device unattributed.
    return crypto.randomUUID();
  }
}
