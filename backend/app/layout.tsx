import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scanner App Dashboard',
  description: 'Devices scanned by the ScannerApp mobile app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
