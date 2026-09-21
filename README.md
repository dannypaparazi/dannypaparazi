# ScannerApp

A device-registration app: scan a QR code or barcode on a piece of equipment with
your phone's camera, confirm the model no. / serial no., and save it to a cloud
database.

## Structure

```
ScannerApp/
├── mobile/    Expo (React Native) app — runs on Android and iOS
└── backend/   Next.js app (API + dashboard) — deployed to Vercel, backed by Vercel Postgres (Neon)
```

The mobile app is a native app (installed via Expo Go for dev, or a built binary
for production) — it is not deployed to Vercel. Only `backend/` is deployed to
Vercel; it exposes the API the mobile app talks to, and a small web dashboard for
browsing saved scans.

## How scanning works

The camera reads any QR code or barcode (QR, Code128, EAN-13, PDF417, Data Matrix,
etc. — see `mobile/src/screens/ScannerScreen.tsx`) and treats its payload as plain
text. That text is run through `mobile/src/lib/parseScan.ts`, which tries, in order:

1. JSON payloads with a `model`/`serial` field (any common key spelling)
2. Labeled text like `MODEL: ABC-123 S/N: XYZ-789` or `M/N ABC-123, SN XYZ-789`
3. Two values separated by a comma, pipe, semicolon, or newline
4. Falls back to putting the raw text in the model field for manual correction

The confirm screen always shows editable fields pre-filled with the parsed guess,
plus the raw scanned text, so a bad guess is a quick edit rather than a dead end.

> If your devices actually need OCR of printed text with **no** barcode present
> (rather than any barcode/QR whose payload is plain text), say so — that needs a
> different, heavier native module (on-device text recognition) and isn't what's
> scaffolded here.

## Backend setup

```bash
cd backend
npm install
```

1. Create a Postgres database from the Vercel dashboard (Storage → Postgres, which
   runs on Neon) and link it to this project, or run `vercel link` then
   `vercel env pull .env.local` to pull the connection string down locally.
2. Initialize the schema (creates the `scans` table):
   ```bash
   npm run db:init
   ```
3. Run it locally:
   ```bash
   npm run dev
   ```
   The dashboard is at `http://localhost:3000`, the API at `http://localhost:3000/api/scans`.

### Deploying

In the Vercel project settings, set **Root Directory** to `backend` (this repo is
a monorepo — Vercel needs to know which subfolder to build). Push to your Git
remote and import the repo in Vercel, or run `vercel --cwd backend`.

## Mobile app setup

```bash
cd mobile
npm install
npx expo install   # aligns native dependency versions with your Expo SDK
```

Point the app at your backend (defaults to `http://localhost:3000` for the
simulator):

```bash
EXPO_PUBLIC_API_URL=https://your-backend.vercel.app npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS) to run it on a
physical device, or press `a` / `i` for an emulator/simulator.

> Note: iOS Simulator and Android Emulator cameras only show a black screen or a
> test pattern — to actually test scanning, use a physical device with Expo Go,
> or a photo of a QR code held up to a webcam-backed simulator camera.

## API

- `POST /api/scans` — body `{ modelNo, serialNo, rawScan, scanType }` → creates a
  scan record, returns it with `id` and `createdAt`.
- `GET /api/scans?limit=50` — returns the most recent scans, newest first.
