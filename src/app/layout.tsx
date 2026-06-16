import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'نبراس الجودة',
  description: 'منصة نبراس الجودة لإدارة علاقات العملاء',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-tajawal">{children}</body>
    </html>
  )
}
