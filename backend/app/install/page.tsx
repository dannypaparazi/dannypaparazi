import { headers } from 'next/headers';
import Link from 'next/link';
import QRCode from 'qrcode';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Get the Scanner App',
};

async function getScannerUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3006';
  const isLocal = host.includes('localhost') || host.startsWith('127.0.0.1');
  const proto = headersList.get('x-forwarded-proto') ?? (isLocal ? 'http' : 'https');
  return `${proto}://${host}/scan`;
}

export default async function InstallPage() {
  const scannerUrl = await getScannerUrl();
  const qrDataUrl = await QRCode.toDataURL(scannerUrl, {
    width: 320,
    margin: 1,
    color: { dark: '#0d6efd', light: '#ffffff' },
  });

  return (
    <main className="container install-page">
      <div className="header-row">
        <h1>Get the Scanner App</h1>
        <Link className="button secondary" href="/">
          Admin panel
        </Link>
      </div>

      <p>
        Scan this with your phone&apos;s camera to open the scanner, then add it to your home
        screen — it then opens and behaves like an installed app, on both iPhone and Android.
      </p>

      {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL, no remote image to optimize */}
      <img
        className="install-qr"
        src={qrDataUrl}
        alt={`QR code linking to ${scannerUrl}`}
        width={320}
        height={320}
      />

      <p className="raw-box">{scannerUrl}</p>

      <h2>iPhone (Safari)</h2>
      <ol>
        <li>Open the link above (scan the QR code, or open it directly in Safari).</li>
        <li>
          Tap the <strong>Share</strong> icon (square with an arrow).
        </li>
        <li>
          Tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
        </li>
      </ol>

      <h2>Android (Chrome)</h2>
      <ol>
        <li>Open the link above (scan the QR code, or open it directly in Chrome).</li>
        <li>
          If you see an <strong>Install app</strong> banner, tap it — otherwise, open the{' '}
          <strong>⋮</strong> menu.
        </li>
        <li>
          Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>).
        </li>
      </ol>

      <p className="status-text">
        This installs a home-screen icon that opens the scanner directly — no app store required.
      </p>
    </main>
  );
}
