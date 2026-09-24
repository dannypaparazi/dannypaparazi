import type { Metadata, Viewport } from 'next';
import RegisterServiceWorker from '@/components/RegisterServiceWorker';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scanner App Dashboard',
  description: 'Devices scanned by the ScannerApp scanner',
  icons: {
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Scanner',
  },
  other: {
    // Older iOS (pre-16.4) only recognizes the vendor-prefixed tag; Next's
    // `appleWebApp.capable` only emits the newer standardized one.
    'apple-mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d6efd',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
