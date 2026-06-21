import * as XLSX from "xlsx";
import { FACILITY_IMPORT_HEADERS } from "@/lib/import-export/parser";

export const TEST_CONTEXT = {
  userId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  email: "supervisor@example.com",
  fullName: "مشرف الاختبار",
  role: "supervisor" as const,
  companyId: "11111111-1111-4111-8111-111111111111",
  activeCompanyId: "11111111-1111-4111-8111-111111111111",
  companyName: "شركة الاختبار",
  status: "active" as const,
};

export function facilitySpreadsheet(rows: unknown[][]) {
  const sheet = XLSX.utils.aoa_to_sheet([Array.from(FACILITY_IMPORT_HEADERS), ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "استيراد المنشآت");
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}

export function mockQueryBuilder(onCall: (method: string, args: unknown[]) => void, result: unknown) {
  const builder = new Proxy({}, {
    get(_target, property) {
      if (property === "then") return (resolve: (value: unknown) => void) => resolve(result);
      if (property === "single" || property === "maybeSingle") return () => Promise.resolve(result);
      return (...args: unknown[]) => {
        onCall(String(property), args);
        return builder;
      };
    },
  });
  return builder;
}

