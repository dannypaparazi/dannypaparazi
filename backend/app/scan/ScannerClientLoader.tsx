'use client';

import dynamic from 'next/dynamic';

// Camera and OCR/QR libraries touch browser-only APIs, so this must never
// run during server-side rendering.
const ScannerScreen = dynamic(() => import('@/components/ScannerScreen'), { ssr: false });

export default function ScannerClientLoader() {
  return <ScannerScreen />;
}
