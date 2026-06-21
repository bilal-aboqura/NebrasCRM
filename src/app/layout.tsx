import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "@/styles/globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "نبراس CRM",
  description: "منصة إدارة علاقات العملاء",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}

