export type FarmerDocumentStatus = {
  updateNeeded: string;
  available: string;
  notAvailable: string;
};

export type FarmerDocumentMap = Record<string, FarmerDocumentStatus>;

/**
 * Parse the documents column value.
 * Example segment: "1--No-Yes-No"
 * Split by "|", then each segment by "--" for id, then "-" for status flags:
 * index 2 = updation needed, index 3 = available, index 4 = not available
 */
export function parseFarmerDocuments(docString: string | undefined): FarmerDocumentMap {
  const result: FarmerDocumentMap = {};
  if (!docString) return result;

  docString.split('|').forEach((segment) => {
    const [id, rest] = segment.split('--');
    if (!id || !rest) return;

    const [updateNeeded, available, notAvailable] = rest.split('-');
    if (updateNeeded !== undefined && available !== undefined && notAvailable !== undefined) {
      result[id.trim()] = {
        updateNeeded: updateNeeded.trim(),
        available: available.trim(),
        notAvailable: notAvailable.trim(),
      };
    }
  });

  return result;
}
