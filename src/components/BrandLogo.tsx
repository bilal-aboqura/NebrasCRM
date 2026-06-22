import Image from "next/image";
import brandLogo from "../../WhatsApp Image 2026-06-13 at 1.39.04 AM.jpeg";

const logoSizes = {
  sm: { className: "size-10 rounded-xl", pixels: "40px" },
  md: { className: "size-14 rounded-2xl", pixels: "56px" },
  lg: { className: "size-20 rounded-2xl", pixels: "80px" },
} as const;

export function BrandLogo({ size = "md", className = "" }: { size?: keyof typeof logoSizes; className?: string }) {
  const config = logoSizes[size];

  return (
    <span className={`${config.className} relative block shrink-0 overflow-hidden border border-nebras-gold/50 bg-nebras-cream shadow-md ${className}`}>
      <Image src={brandLogo} alt="" fill sizes={config.pixels} className="object-cover" />
    </span>
  );
}
