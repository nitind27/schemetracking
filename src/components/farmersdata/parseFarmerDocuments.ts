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

export function isDocumentAvailable(farmer: FarmerLike, docId: number | string): boolean {
  const entry = getParsedFarmerDocuments(farmer)[String(docId)];
  return entry?.available === 'Yes';
}

export function isDocumentNotAvailable(farmer: FarmerLike, docId: number | string): boolean {
  const entry = getParsedFarmerDocuments(farmer)[String(docId)];
  return !entry || entry.notAvailable === 'Yes';
}

export function isDocumentUpdationNeeded(farmer: FarmerLike, docId: number | string): boolean {
  const entry = getParsedFarmerDocuments(farmer)[String(docId)];
  return entry?.updateNeeded === 'Yes';
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

export type DocumentCountRow = {
  id: number;
  document: string;
  has: number;
  not: number;
};

/** Single-pass document availability counts for a farmer list. */
export function buildDocumentAvailabilityCounts(
  farmers: FarmerLike[],
  documents: { id: number; document_name: string }[]
): DocumentCountRow[] {
  const counts = new Map<number, { has: number; not: number }>();
  for (let d = 0; d < documents.length; d++) {
    counts.set(documents[d].id, { has: 0, not: 0 });
  }

  for (let i = 0; i < farmers.length; i++) {
    const docMap = getParsedFarmerDocuments(farmers[i]);
    for (let d = 0; d < documents.length; d++) {
      const doc = documents[d];
      const bucket = counts.get(doc.id)!;
      const entry = docMap[String(doc.id)];
      if (entry?.available === 'Yes') {
        bucket.has++;
      } else if (!entry || entry.notAvailable === 'Yes') {
        bucket.not++;
      }
    }
  }

  return documents.map((doc) => {
    const c = counts.get(doc.id)!;
    return {
      id: doc.id,
      document: doc.document_name,
      has: c.has,
      not: c.not,
    };
  });
}
