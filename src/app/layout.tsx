import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEBRASGOO CRM",
  description: "Arabic-first CRM for accreditation sales operations"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
