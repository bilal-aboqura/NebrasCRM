"use client";
import { useMemo, useState } from "react";
import { sortTeamRows, type TeamRepRow } from "@/lib/reports/team";
import { sar } from "@/lib/reports/filters";

type SortKey = keyof TeamRepRow;
const columns: Array<[SortKey, string]> = [["repName", "المندوب"], ["facilitiesAssigned", "المنشآت"], ["followupsCompleted", "المتابعات"], ["callsLogged", "الاتصالات"], ["offersSent", "العروض"], ["contractsWon", "العقود"], ["totalRevenue", "الإيراد"]];

export function TeamComparisonTable({ rows }: { rows: TeamRepRow[] }) {
  const [sort, setSort] = useState<SortKey>("totalRevenue"); const [ascending, setAscending] = useState(false);
  const sorted = useMemo(() => sortTeamRows(rows, sort, ascending), [rows, sort, ascending]);
  const best = Math.max(...rows.map((row) => row.totalRevenue), 0); const worst = Math.min(...rows.map((row) => row.totalRevenue), 0);
  return <div className="overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="w-full min-w-[850px] text-right"><thead className="bg-nebras-green text-white"><tr>{columns.map(([key, label]) => <th className="p-4" key={key}><button onClick={() => { if (sort === key) setAscending((value) => !value); else { setSort(key); setAscending(false); } }} className="font-bold">{label}{sort === key ? (ascending ? " ↑" : " ↓") : ""}</button></th>)}</tr></thead><tbody>{sorted.map((row) => <tr key={row.repId} className={`border-b last:border-0 ${row.totalRevenue === best && best > 0 ? "bg-emerald-50" : row.totalRevenue === worst && rows.length > 1 ? "bg-amber-50" : ""}`}><td className="p-4 font-bold">{row.repName}{!row.isActive && <small className="mr-2 text-slate-500">(غير نشط)</small>}</td><td className="p-4">{row.facilitiesAssigned}</td><td className="p-4">{row.followupsCompleted}</td><td className="p-4">{row.callsLogged}</td><td className="p-4">{row.offersSent}</td><td className="p-4">{row.contractsWon}</td><td className="p-4 font-bold">{sar(row.totalRevenue)}</td></tr>)}</tbody></table></div>;
}
