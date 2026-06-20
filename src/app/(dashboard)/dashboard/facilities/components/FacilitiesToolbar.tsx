/**
 * FacilitiesToolbar.tsx - Client toolbar with Import and Export controls (Feature 011)
 */
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import ExportButton from "./ExportButton";

// Lazy-load ImportModal to keep the initial bundle small
const ImportModal = dynamic(() => import("./ImportModal"), { ssr: false });

interface FacilitiesToolbarProps {
  /** Whether the current user role can import (super_admin, company_admin, supervisor) */
  canImport: boolean;
}

export default function FacilitiesToolbar({ canImport }: FacilitiesToolbarProps) {
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <ExportButton
          exportUrl="/api/facilities/export"
          label="تصدير Excel"
        />
        {canImport && (
          <button
            id="import-modal-trigger"
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-md bg-nebras-green px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            استيراد من Excel
          </button>
        )}
      </div>

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} />
      )}
    </>
  );
}
