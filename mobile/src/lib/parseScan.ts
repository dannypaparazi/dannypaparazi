export interface ParsedScan {
  modelNo: string;
  serialNo: string;
}

const MODEL_KEYS = ['model', 'modelno', 'modelnumber', 'mn', 'model_no', 'model_number'];
const SERIAL_KEYS = ['serial', 'serialno', 'serialnumber', 'sn', 'serial_no', 'serial_number'];

const MODEL_LABEL_PATTERNS = [
  /\bM\/?N\.?\s*[:\-]?\s*([A-Za-z0-9\-./]+)/i,
  /\bMODEL(?:\s*(?:NO|NUMBER))?\.?\s*[:\-]?\s*([A-Za-z0-9\-./]+)/i,
];

const SERIAL_LABEL_PATTERNS = [
  /\bS\/?N\.?\s*[:\-]?\s*([A-Za-z0-9\-./]+)/i,
  /\bSERIAL(?:\s*(?:NO|NUMBER))?\.?\s*[:\-]?\s*([A-Za-z0-9\-./]+)/i,
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
 * Turns raw scanned text (from a QR code or barcode) into a best-effort
 * model no. / serial no. guess. Whatever it can't confidently identify is
 * left blank so the confirm screen's editable fields catch it.
 */
export function parseScan(raw: string): ParsedScan {
  const trimmed = raw.trim();

  try {
    const json = JSON.parse(trimmed);
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      const modelNo = firstMatchingKey(json as Record<string, unknown>, MODEL_KEYS);
      const serialNo = firstMatchingKey(json as Record<string, unknown>, SERIAL_KEYS);
      if (modelNo || serialNo) {
        return { modelNo: modelNo ?? '', serialNo: serialNo ?? '' };
      }
    }
  } catch {
    // not JSON — fall through to text-based parsing
  }

  const labeledModel = extractLabeled(trimmed, MODEL_LABEL_PATTERNS);
  const labeledSerial = extractLabeled(trimmed, SERIAL_LABEL_PATTERNS);
  if (labeledModel || labeledSerial) {
    return { modelNo: labeledModel ?? '', serialNo: labeledSerial ?? '' };
  }

  const parts = trimmed
    .split(/[\n,|;\t]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { modelNo: parts[0], serialNo: parts[1] };
  }

  return { modelNo: trimmed, serialNo: '' };
}
