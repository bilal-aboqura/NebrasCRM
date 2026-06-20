/**
 * ExportButton.tsx - Generic export button component (Feature 011)
 * Triggers a GET request to a given export URL and initiates a file download.
 */
"use client";

import { useState } from "react";

interface ExportButtonProps {
  /** The API endpoint URL to call for export (e.g. /api/facilities/export) */
  exportUrl: string;
  /** Query params to append to the export URL (e.g. from active filters) */
  queryParams?: Record<string, string>;
  /** Button label (Arabic) */
  label?: string;
}

export default function ExportButton({
  exportUrl,
  queryParams = {},
  label = "تصدير Excel"
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(exportUrl, window.location.origin);
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });

      const response = await fetch(url.toString());
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error ?? "فشل التصدير");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Extract filename from Content-Disposition or use default
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] ?? "export.xlsx";

      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير معروف");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        id="export-button"
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 rounded-md border border-nebras-line bg-white px-4 py-2 text-sm font-medium text-nebras-green transition-colors hover:bg-nebras-cream disabled:opacity-60"
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-nebras-green border-t-transparent" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
