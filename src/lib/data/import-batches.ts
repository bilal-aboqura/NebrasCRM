/**
 * import-batches.ts - In-memory store for import batches (mock layer)
 *
 * Mirrors the import_batches table structure for the mock data tier.
 * Used by route handlers and tests that operate against the mock store.
 */

export type ImportBatchStatus = "preview" | "confirmed" | "failed";

export interface ImportBatch {
  id: string;
  companyId: string;
  uploadedBy: string;
  filename: string;
  totalRows: number;
  validRows: number;
  skippedRows: number;
  errorRows: number;
  status: ImportBatchStatus;
  createdAt: string;
  /** Validated rows are stored in memory (not persisted to DB in mock tier) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _rows?: any[];
}

/** In-memory store – reset between tests by clearing this array */
export const importBatches: ImportBatch[] = [];

export function nextBatchId(): string {
  return `batch-${importBatches.length + 1}-${Date.now().toString(36)}`;
}

/** System settings: max_import_rows (mirrors system_settings table) */
export const systemSettings: Record<string, string> = {
  max_import_rows: "1000"
};

export function getMaxImportRows(): number {
  return parseInt(systemSettings["max_import_rows"] ?? "1000", 10);
}
