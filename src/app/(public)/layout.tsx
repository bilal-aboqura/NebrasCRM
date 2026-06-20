import GtmPlaceholder from "@/components/GtmPlaceholder";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white font-tajawal text-nebras-ink">
      <GtmPlaceholder />
      {children}
    </div>
  );
}
