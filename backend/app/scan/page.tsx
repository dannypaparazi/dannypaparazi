import type { Metadata } from 'next';
import ScannerClientLoader from './ScannerClientLoader';

export const metadata: Metadata = {
  title: 'Scan a Device — ScannerApp',
};

export default function ScanPage() {
  return <ScannerClientLoader />;
}
