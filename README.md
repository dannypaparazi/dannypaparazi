# ScannerApp

A device-registration app with two parts, both web-based, in one Next.js app:

- **Admin panel** (`/`) — table of scanned items: brand, model no., serial no.,
  scan type, which device scanned it, where it was scanned, and timestamp.
- **Scanner** (`/scan`) — opens the phone's camera in the browser and identifies
  a device by either:
  - **QR code recognition** (decoded client-side with [jsQR](https://github.com/cozmo/jsQR)), or
  - **OCR of a printed label** (recognized client-side with [Tesseract.js](https://github.com/naptha/tesseract.js)), for devices with no QR code.

  Whichever matched, the recognized text is parsed for brand / model no. /
  serial no. (`lib/parseScan.ts`), shown in an editable confirm form (plus the
  raw recognized text for reference), and POSTed to the admin panel's API to
  be saved with a server-generated timestamp.
- **Install** (`/install`) — a QR code (pointing at `/scan`) plus iPhone/Android
  instructions for adding the scanner to the home screen as an installable app
  (a PWA — no app store). See "Installing on a phone" below.

Each scan also carries **who scanned it and where**: a random device ID is
generated per phone/browser on first use (no login), and a fresh GPS reading
is requested each time a code is recognized — see "Device ID and location"
below.

## Structure

```
ScannerApp/
└── backend/   Next.js app — admin panel + scanner + API, deployed to Vercel, backed by Neon Postgres
```

There's a single app because both parts are web pages sharing the same API and
database — no separate mobile build. (An earlier version of this project used
a native Expo/React Native app for the scanner; that's been replaced by the
in-browser scanner described above.)

## How recognition works

`lib/parseScan.ts` takes whatever text was recognized (QR payload or OCR
output) and tries, in order:

1. JSON payloads with `brand`/`model`/`serial` fields (any common key spelling)
2. Labeled text like `BRAND: Acme MODEL: ABC-123 S/N: XYZ-789` or `M/N ABC-123 SN XYZ-789`
3. Three (or two) values separated by a comma, pipe, semicolon, or newline —
   brand, model, serial in that order
4. Falls back to putting the raw text in the model field for manual correction

The confirm screen always shows editable brand/model/serial fields pre-filled
with the parsed guess, plus the raw recognized text, so a bad guess is a quick
edit rather than a dead end.

## Setup

```bash
cd backend
npm install
```

1. Create a Postgres database from the Vercel dashboard (Storage → Postgres,
   which runs on Neon) and link it to this project, or run `vercel link` then
   `vercel env pull .env.local` to pull the connection string down locally.
2. Initialize the schema (creates the `scans` table, and is safe to re-run —
   it adds any missing columns to an existing table):
   ```bash
   npm run db:init
   ```
3. Run it locally:
   ```bash
   npm run dev
   ```
   Dev server: `http://localhost:3006` (admin panel at `/`, scanner at `/scan`,
   API at `/api/scans`). Camera access needs HTTPS or `localhost` — on a phone,
   use a tunnel (e.g. `ngrok http 3006`) or the deployed Vercel URL, since a
   phone can't reach your laptop's `localhost`.

### Deploying (live = Vercel)

In the Vercel project settings, set **Root Directory** to `backend` (this repo
is a monorepo — Vercel needs to know which subfolder to build). Push to your
Git remote and import the repo in Vercel, or run `vercel --cwd backend`.

## Installing on a phone

Open `/install` (linked from the admin panel and the scanner). It shows a QR
code that points at `/scan` on whatever host served the page — localhost in
dev, the actual domain once deployed — plus steps for both platforms:

- **iPhone**: Safari → Share → **Add to Home Screen**.
- **Android**: Chrome → **Install app** banner or ⋮ menu → **Install app**.

This works via a standard [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest)
(`app/manifest.ts`) plus a minimal service worker (`public/sw.js`) that caches
only `/scan` and its static assets — **not** the admin dashboard or
`/install`, since those render live data and must always be fresh. The
result is a home-screen icon that opens full-screen (`display: standalone`),
no app store involved — same web app, just installed.

## Device ID and location

- **Device ID**: on first use, the scanner generates a random UUID and saves
  it in `localStorage` (`lib/deviceId.ts`). It's sent with every scan so the
  admin panel can group scans by device — there's no login, so this
  identifies a phone/browser install, not a person. Clearing site data or
  reinstalling the PWA issues a new one.
- **Location**: each time a code is recognized, the scanner requests a fresh
  reading via the browser's Geolocation API and shows it on the confirm
  screen (with a manual retry if it fails). If the user denies the
  permission or it's unavailable, the scan still saves — just without
  coordinates. The admin panel links any captured coordinates to Google Maps.

Both need HTTPS (or `localhost`), same as the camera.

## API

- `POST /api/scans` — body
  `{ brand, modelNo, serialNo, rawScan, scanType, deviceId, latitude, longitude }`
  (`brand`, `deviceId`, `latitude`, `longitude` all optional) → creates a scan
  record, returns it with `id` and `createdAt`.
- `GET /api/scans?limit=50` — returns the most recent scans, newest first.
