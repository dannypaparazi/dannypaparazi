# ScannerApp

Device-registration system with two parts.

## 1. Admin panel (web)

- Web-based.
- Shows scanned items: **brand, model no., serial no., which device/phone
  scanned it, where it was scanned, and timestamp**.
- Reads from the same database the scanner app writes to.

## 2. Scanner app (web)

- **Web-based** — runs in a mobile browser (not a native/installed app).
- Uses the phone's camera through the browser.
- Identifies items via:
  - **QR code recognition** (decoding QR/barcode payloads), and
  - **Image/character recognition (OCR)** of plain printed text on a
    device label, for items that aren't QR-coded.
- Extracts **brand, model no., serial no., and timestamp** from whichever
  method matched, then sends that info to the admin panel's backend to be
  saved.
- **Downloadable/installable** as a PWA on both iPhone and Android (Add to
  Home Screen / Install app) — no app store. A `/install` page shows a QR
  code pointing at the scanner (`/scan`) to get it onto a phone quickly.
- **Per-device attribution**: each phone/browser install gets a random UUID
  on first use, persisted in `localStorage` (`backend/lib/deviceId.ts`), sent
  with every scan so the admin panel can tell which device scanned what.
  There's no login — this identifies the browser install, not a person; it
  resets if site data is cleared or the PWA is reinstalled.
- **Location capture**: a fresh geolocation reading (`navigator.geolocation`)
  is requested each time a code is recognized, and saved with the scan if the
  user grants permission — never blocks saving if denied/unavailable.

## Current implementation status (2026-09-24)

Both parts live in one Next.js app, `backend/`, deployed to Vercel with Neon
Postgres — no separate mobile app. (An earlier native Expo/React Native
scanner under `mobile/` was removed once the spec above called for a
web-based scanner instead.)

- `backend/app/page.tsx` — admin panel (`/`): table of brand, model no.,
  serial no., scan type, timestamp.
- `backend/app/scan/` — scanner (`/scan`): browser camera via
  `getUserMedia`, QR decoding via `jsqr`, OCR via `tesseract.js`
  (`backend/components/ScannerScreen.tsx`, loaded client-only through
  `next/dynamic({ ssr: false })` since camera/OCR are browser-only APIs).
- `backend/lib/parseScan.ts` — shared brand/model/serial parser used by the
  scanner's confirm form.
- `backend/schema.sql` — `scans` table, including `brand`, `device_id`,
  `latitude`, `longitude` (all nullable). The `ALTER TABLE ... ADD COLUMN IF
  NOT EXISTS` lines make `npm run db:init` safe to re-run against a database
  created before these columns existed — run it again after pulling schema
  changes.
- Dev server runs on port **3006** (`npm run dev` → `next dev -p 3006`,
  also set in `.claude/launch.json`). Camera access needs HTTPS or
  `localhost`; testing from a phone needs a tunnel or the deployed Vercel URL.
- PWA/install pieces: `backend/app/manifest.ts` (web app manifest, name/
  icons/`start_url: /scan`/`display: standalone`), `backend/app/icon.svg` +
  `backend/app/apple-icon.png` (Next's icon file conventions — auto-linked
  in `<head>`), `backend/public/icons/icon-{192,512}.png` (manifest icons),
  `backend/public/sw.js` + `backend/components/RegisterServiceWorker.tsx`
  (minimal service worker: stale-while-revalidate, but **only** for `/scan`
  and static assets — the admin dashboard (`/`) and `/install` are
  deliberately excluded since they render live DB data and must never be
  served stale; caching them earlier was a real bug, caught by seeing the
  dashboard show 0 scans after live data existed), and
  `backend/app/install/page.tsx` (renders a QR code, via the `qrcode`
  package, encoding the request's own host + `/scan` — so it's correct on
  localhost, preview deployments, and production alike).
- When changing the service worker's cache list or fetch logic, bump
  `CACHE_NAME` in `backend/public/sw.js` — otherwise already-installed
  clients keep serving whatever they cached under the old version.
