# ScannerApp

Device-registration system with two parts.

## 1. Admin panel (web)

- Web-based.
- Shows scanned items: **brand, model no., serial no., and timestamp**.
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
- `backend/schema.sql` — `scans` table, including `brand` (nullable). The
  `ALTER TABLE ... ADD COLUMN IF NOT EXISTS brand` line makes `npm run
  db:init` safe to re-run against a database created before this column
  existed.
- Dev server runs on port **3006** (`npm run dev` → `next dev -p 3006`,
  also set in `.claude/launch.json`). Camera access needs HTTPS or
  `localhost`; testing from a phone needs a tunnel or the deployed Vercel URL.
- PWA/install pieces: `backend/app/manifest.ts` (web app manifest, name/
  icons/`start_url: /scan`/`display: standalone`), `backend/app/icon.svg` +
  `backend/app/apple-icon.png` (Next's icon file conventions — auto-linked
  in `<head>`), `backend/public/icons/icon-{192,512}.png` (manifest icons),
  `backend/public/sw.js` + `backend/components/RegisterServiceWorker.tsx`
  (minimal service worker: stale-while-revalidate for the app shell, always
  network-first for `/api/*`), and `backend/app/install/page.tsx` (renders a
  QR code, via the `qrcode` package, encoding the request's own host + `/scan`
  — so it's correct on localhost, preview deployments, and production alike).
