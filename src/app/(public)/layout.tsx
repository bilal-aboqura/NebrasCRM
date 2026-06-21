import { GtmPlaceholder } from "@/components/GtmPlaceholder";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-nebras-cream text-slate-800">
      <GtmPlaceholder />
      {children}
    </div>
  );
}
