export type FarmerDocumentStatus = {
  updateNeeded: string;
  available: string;
  notAvailable: string;
};

export type FarmerDocumentMap = Record<string, FarmerDocumentStatus>;

type FarmerLike = {
  farmer_id: number;
  documents?: string;
  farmer_record?: string;
  update_record?: string;
  taluka_id?: string | number;
  village_id?: string | number;
};

/** Cache parses per farmer object identity (cleared when GC collects farmer). */
const parseCache = new WeakMap<object, FarmerDocumentMap>();

/**
 * Parse the documents column value.
 * Example segment: "1--No-Yes-No"
 * Split by "|", then each segment by "--" for id, then "-" for status flags:
 * index 2 = updation needed, index 3 = available, index 4 = not available
 */
export function parseFarmerDocuments(docString: string | undefined): FarmerDocumentMap {
  const result: FarmerDocumentMap = {};
  if (!docString) return result;

  const segments = docString.split('|');
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const sep = segment.indexOf('--');
    if (sep <= 0) continue;
    const id = segment.slice(0, sep).trim();
    const rest = segment.slice(sep + 2);
    if (!id || !rest) continue;

    const parts = rest.split('-');
    const updateNeeded = parts[0];
    const available = parts[1];
    const notAvailable = parts[2];
    if (updateNeeded === undefined || available === undefined || notAvailable === undefined) continue;

    result[id] = {
      updateNeeded: updateNeeded.trim(),
      available: available.trim(),
      notAvailable: notAvailable.trim(),
    };
  }

  return result;
}

/** Cached parse — prefer this over parseFarmerDocuments when looping farmers. */
export function getParsedFarmerDocuments(farmer: FarmerLike): FarmerDocumentMap {
  const cached = parseCache.get(farmer as object);
  if (cached) return cached;
  const parsed = parseFarmerDocuments(
    typeof farmer.documents === 'string' ? farmer.documents : ''
  );
  parseCache.set(farmer as object, parsed);
  return parsed;
}

export type DocumentCountRow = {
  id: number;
  document: string;
  has: number;
  not: number;
};

/**
 * Fast availability counts — avoids allocating a status map object per farmer.
 * Matches: available=Yes → has; missing or notAvailable=Yes → not; else neither.
 */
export function buildDocumentAvailabilityCounts(
  farmers: FarmerLike[],
  documents: { id: number; document_name: string }[]
): DocumentCountRow[] {
  const n = documents.length;
  if (!n) return [];

  const has = new Int32Array(n);
  const not = new Int32Array(n);
  const idIndex = new Map<string, number>();
  for (let d = 0; d < n; d++) {
    idIndex.set(String(documents[d].id), d);
  }

  const farmerCount = farmers.length;
  const seen = new Uint8Array(n);
  for (let i = 0; i < farmerCount; i++) {
    const docString = farmers[i].documents;
    seen.fill(0);

    if (typeof docString === 'string' && docString.length > 0) {
      let start = 0;
      const len = docString.length;
      while (start < len) {
        let end = docString.indexOf('|', start);
        if (end < 0) end = len;

        const sep = docString.indexOf('--', start);
        if (sep > start && sep < end) {
          const id = docString.slice(start, sep).trim();
          const idx = idIndex.get(id);
          if (idx !== undefined) {
            const rest = docString.slice(sep + 2, end);
            const p1 = rest.indexOf('-');
            if (p1 >= 0) {
              const p2 = rest.indexOf('-', p1 + 1);
              if (p2 >= 0) {
                const available = rest.slice(p1 + 1, p2).trim();
                const notAvailable = rest.slice(p2 + 1).trim();
                if (available === 'Yes') {
                  has[idx]++;
                  seen[idx] = 1;
                } else if (notAvailable === 'Yes') {
                  not[idx]++;
                  seen[idx] = 2;
                } else {
                  seen[idx] = 3; // present but neither (e.g. updation only)
                }
              }
            }
          }
        }
        start = end + 1;
      }
    }

    for (let d = 0; d < n; d++) {
      if (seen[d] === 0) not[d]++;
    }
  }

  const rows: DocumentCountRow[] = new Array(n);
  for (let d = 0; d < n; d++) {
    rows[d] = {
      id: documents[d].id,
      document: documents[d].document_name,
      has: has[d],
      not: not[d],
    };
  }
  return rows;
}

/** Single-document flag lookup without parsing the whole map. */
export function getDocumentFlags(
  docString: string | undefined,
  docId: number | string
): FarmerDocumentStatus | null {
  if (!docString) return null;
  const id = String(docId);
  let start = 0;
  const len = docString.length;
  while (start < len) {
    let end = docString.indexOf('|', start);
    if (end < 0) end = len;
    const sep = docString.indexOf('--', start);
    if (sep > start && sep < end) {
      if (docString.slice(start, sep).trim() === id) {
        const rest = docString.slice(sep + 2, end);
        const [updateNeeded = '', available = '', notAvailable = ''] = rest.split('-');
        return {
          updateNeeded: updateNeeded.trim(),
          available: available.trim(),
          notAvailable: notAvailable.trim(),
        };
      }
    }
    start = end + 1;
  }
  return null;
}

export function isDocumentAvailable(farmer: FarmerLike, docId: number | string): boolean {
  return getDocumentFlags(
    typeof farmer.documents === 'string' ? farmer.documents : undefined,
    docId
  )?.available === 'Yes';
}

export function isDocumentNotAvailable(farmer: FarmerLike, docId: number | string): boolean {
  const flags = getDocumentFlags(
    typeof farmer.documents === 'string' ? farmer.documents : undefined,
    docId
  );
  return !flags || flags.notAvailable === 'Yes';
}

export function isDocumentUpdationNeeded(farmer: FarmerLike, docId: number | string): boolean {
  return getDocumentFlags(
    typeof farmer.documents === 'string' ? farmer.documents : undefined,
    docId
  )?.updateNeeded === 'Yes';
}

/** Parse farmer_record once for Aadhaar (index 5). */
export function hasAadhaarFromRecord(farmerRecord: string | undefined): boolean {
  if (!farmerRecord) return false;
  const aadhaar = farmerRecord.split('|')[5];
  return !!(aadhaar && aadhaar.trim() !== '');
}

export function isSurveyedFarmer(farmer: FarmerLike): boolean {
  return !!(farmer.update_record && farmer.update_record.trim() !== '');
}
