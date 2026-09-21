import { API_BASE_URL } from '../config';

export interface ScanRecord {
  id: number;
  modelNo: string;
  serialNo: string;
  rawScan: string | null;
  scanType: string;
  createdAt: string;
}

export interface CreateScanInput {
  modelNo: string;
  serialNo: string;
  rawScan: string;
  scanType: string;
}

export async function createScan(input: CreateScanInput): Promise<ScanRecord> {
  const res = await fetch(`${API_BASE_URL}/api/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to save scan (${res.status}): ${body}`);
  }
  return res.json();
}

export async function listScans(limit = 50): Promise<ScanRecord[]> {
  const res = await fetch(`${API_BASE_URL}/api/scans?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to load scans (${res.status})`);
  }
  return res.json();
}
