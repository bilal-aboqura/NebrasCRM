"use client";
export function PrintButton() { return <button type="button" onClick={() => window.print()} className="no-print rounded-xl bg-nebras-green px-5 py-2 font-bold text-white">طباعة أو حفظ PDF</button>; }
