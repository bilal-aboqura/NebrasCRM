import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export function PublicBrand({
  compact = false,
  href = "/",
}: {
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <BrandLogo size={compact ? "md" : "lg"} />
      <span className="leading-tight">
        <strong className={`${compact ? "text-lg" : "text-xl"} block tracking-wide text-nebras-green`}>
          NEBRASGOO
        </strong>
        <span className="text-xs font-medium text-slate-500">
          نبراس الجودة للتميز والاعتماد الصحي
        </span>
      </span>
    </Link>
  );
}
