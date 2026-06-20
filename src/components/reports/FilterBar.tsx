import type { ReactNode } from "react";
import DateRangePicker from "./DateRangePicker";
export default function FilterBar({ startDate, endDate, children }: { startDate: string; endDate: string; children?: ReactNode }) { return <form className="flex flex-wrap items-end gap-3 rounded-xl border border-nebras-line bg-white p-4 shadow-sm"><DateRangePicker startDate={startDate} endDate={endDate} />{children}<button className="rounded-md bg-nebras-green px-4 py-2 font-bold text-white">تطبيق</button></form> }
