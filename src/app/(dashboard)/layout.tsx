import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-nebras-cream text-nebras-ink">
      <Sidebar />
      <div className="shell:mr-72">
        <Header />
        <main className="px-4 py-5 shell:px-8">{children}</main>
      </div>
    </div>
  );
}
