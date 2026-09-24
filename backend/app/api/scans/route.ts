import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

interface ScanRow {
  id: number;
  brand: string | null;
  model_no: string;
  serial_no: string;
  raw_scan: string | null;
  scan_type: string;
  created_at: string;
}

function toScan(row: ScanRow) {
  return {
    id: row.id,
    brand: row.brand,
    modelNo: row.model_no,
    serialNo: row.serial_no,
    rawScan: row.raw_scan,
    scanType: row.scan_type,
    createdAt: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = Math.min(Math.max(Number(limitParam) || 50, 1), 200);

  const rows = (await sql`
    SELECT id, brand, model_no, serial_no, raw_scan, scan_type, created_at
    FROM scans
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as ScanRow[];

  return NextResponse.json(rows.map(toScan));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.modelNo !== 'string' || typeof body.serialNo !== 'string') {
    return NextResponse.json(
      { error: 'modelNo and serialNo are required strings' },
      { status: 400 }
    );
  }

  const brand = typeof body.brand === 'string' && body.brand.trim() ? body.brand.trim() : null;
  const modelNo = body.modelNo.trim();
  const serialNo = body.serialNo.trim();
  const rawScan = typeof body.rawScan === 'string' ? body.rawScan : null;
  const scanType = typeof body.scanType === 'string' && body.scanType ? body.scanType : 'unknown';

  if (!modelNo || !serialNo) {
    return NextResponse.json(
      { error: 'modelNo and serialNo cannot be empty' },
      { status: 400 }
    );
  }

  const rows = (await sql`
    INSERT INTO scans (brand, model_no, serial_no, raw_scan, scan_type)
    VALUES (${brand}, ${modelNo}, ${serialNo}, ${rawScan}, ${scanType})
    RETURNING id, brand, model_no, serial_no, raw_scan, scan_type, created_at
  `) as ScanRow[];

  return NextResponse.json(toScan(rows[0]), { status: 201 });
}
