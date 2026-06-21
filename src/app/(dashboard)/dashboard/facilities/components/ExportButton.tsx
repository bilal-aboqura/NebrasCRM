import { Download } from "lucide-react";

export function ExportButton({ endpoint, params = {}, label = "تصدير Excel" }: {
  endpoint: string;
  params?: Record<string, string | string[] | undefined>;
  label?: string;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === "string" && value && key !== "page") query.set(key, value);
  });
  const href = query.size ? `${endpoint}?${query}` : endpoint;
  return <a href={href} className="inline-flex items-center gap-2 rounded-xl border border-nebras-green bg-white px-4 py-2 font-bold text-nebras-green"><Download size={18} />{label}</a>;
}

