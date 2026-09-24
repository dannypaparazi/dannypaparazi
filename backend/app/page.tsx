import Link from 'next/link';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ScanRow {
  id: number;
  brand: string | null;
  model_no: string;
  serial_no: string;
  scan_type: string;
  created_at: string;
}

async function getScans(): Promise<ScanRow[]> {
  try {
    const rows = await sql`
      SELECT id, brand, model_no, serial_no, scan_type, created_at
      FROM scans
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return rows as ScanRow[];
  } catch (err) {
    throw new Error(
      'Could not read the "scans" table. Has "npm run db:init" been run against this database yet? ' +
        `(${err instanceof Error ? err.message : String(err)})`
    );
  }
}

export default async function DashboardPage() {
  const scans = await getScans();

  return (
    <main className="container">
      <div className="header-row">
        <h1>Scanned Devices</h1>
        <div className="header-actions">
          <Link className="button secondary" href="/install">
            Get the app
          </Link>
          <Link className="scan-link" href="/scan">
            + Scan a device
          </Link>
        </div>
      </div>
      <p>
        {scans.length} most recent scan{scans.length === 1 ? '' : 's'}
      </p>
      <table>
        <thead>
          <tr>
            <th>Brand</th>
            <th>Model No.</th>
            <th>Serial No.</th>
            <th>Type</th>
            <th>Scanned At</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((scan) => (
            <tr key={scan.id}>
              <td>{scan.brand ?? '—'}</td>
              <td>{scan.model_no}</td>
              <td>{scan.serial_no}</td>
              <td>{scan.scan_type}</td>
              <td>{new Date(scan.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
