export interface ParsedScan {
  brand: string;
  modelNo: string;
  serialNo: string;
}

const BRAND_KEYS = ['brand', 'make', 'manufacturer'];
const MODEL_KEYS = ['model', 'modelno', 'modelnumber', 'mn', 'model_no', 'model_number'];
const SERIAL_KEYS = ['serial', 'serialno', 'serialnumber', 'sn', 'serial_no', 'serial_number'];

// Stops a label's captured value at the next known label, a delimiter, or end of string.
const NEXT_LABEL = '(?=\\s*(?:BRAND|MAKE|MODEL|M\\/?N|SERIAL|S\\/?N)\\b|[\\n,;|]|$)';

// A label must be followed by a colon or actual whitespace before its value —
// not just touch it (e.g. "SN-1" in a plain comma-separated list like
// "Acme, XY-9, SN-1" is a raw serial value, not a "SN:" label match).
const LABEL_SEP = '(?:\\s*:\\s*|\\s+)';

const BRAND_LABEL_PATTERNS = [
  new RegExp(`\\bBRAND\\.?${LABEL_SEP}([^\\n,;|]+?)${NEXT_LABEL}`, 'i'),
  new RegExp(`\\bMAKE\\.?${LABEL_SEP}([^\\n,;|]+?)${NEXT_LABEL}`, 'i'),
];

const MODEL_LABEL_PATTERNS = [
  new RegExp(`\\bM\\/?N\\.?${LABEL_SEP}([A-Za-z0-9\\-./]+)`, 'i'),
  new RegExp(`\\bMODEL(?:\\s*(?:NO|NUMBER))?\\.?${LABEL_SEP}([A-Za-z0-9\\-./]+)`, 'i'),
];

const SERIAL_LABEL_PATTERNS = [
  new RegExp(`\\bS\\/?N\\.?${LABEL_SEP}([A-Za-z0-9\\-./]+)`, 'i'),
  new RegExp(`\\bSERIAL(?:\\s*(?:NO|NUMBER))?\\.?${LABEL_SEP}([A-Za-z0-9\\-./]+)`, 'i'),
];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function firstMatchingKey(obj: Record<string, unknown>, candidates: string[]): string | undefined {
  const normalizedCandidates = new Set(candidates.map(normalizeKey));
  for (const [key, value] of Object.entries(obj)) {
    if (normalizedCandidates.has(normalizeKey(key)) && (typeof value === 'string' || typeof value === 'number')) {
      return String(value).trim();
    }
  }
  return undefined;
}

function extractLabeled(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return undefined;
}

/**
 * Turns raw scanned/recognized text (from a QR code or OCR) into a
 * best-effort brand / model no. / serial no. guess. Whatever it can't
 * confidently identify is left blank so the confirm screen's editable
 * fields catch it.
 */
export function parseScan(raw: string): ParsedScan {
  const trimmed = raw.trim();

  try {
    const json = JSON.parse(trimmed);
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      const record = json as Record<string, unknown>;
      const brand = firstMatchingKey(record, BRAND_KEYS);
      const modelNo = firstMatchingKey(record, MODEL_KEYS);
      const serialNo = firstMatchingKey(record, SERIAL_KEYS);
      if (brand || modelNo || serialNo) {
        return { brand: brand ?? '', modelNo: modelNo ?? '', serialNo: serialNo ?? '' };
      }
    }
  } catch {
    // not JSON — fall through to text-based parsing
  }

  const labeledBrand = extractLabeled(trimmed, BRAND_LABEL_PATTERNS);
  const labeledModel = extractLabeled(trimmed, MODEL_LABEL_PATTERNS);
  const labeledSerial = extractLabeled(trimmed, SERIAL_LABEL_PATTERNS);
  if (labeledBrand || labeledModel || labeledSerial) {
    return {
      brand: labeledBrand ?? '',
      modelNo: labeledModel ?? '',
      serialNo: labeledSerial ?? '',
    };
  }

  const parts = trimmed
    .split(/[\n,|;\t]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 3) {
    return { brand: parts[0], modelNo: parts[1], serialNo: parts[2] };
  }
  if (parts.length === 2) {
    return { brand: '', modelNo: parts[0], serialNo: parts[1] };
  }

  return { brand: '', modelNo: trimmed, serialNo: '' };
}
