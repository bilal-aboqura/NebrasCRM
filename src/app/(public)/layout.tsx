import GtmPlaceholder from "@/components/GtmPlaceholder";

import Link from "next/link";
import { PhoneCall, Mail, MessageCircle, Menu, X } from "lucide-react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-tajawal text-nebras-ink scroll-smooth">
      <GtmPlaceholder />

      {/* Top Contact Bar */}
      <div className="hidden bg-nebras-green py-2 text-white sm:block print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-sm">
          <div className="flex gap-6">
            <a href="tel:+966502658846" className="flex items-center gap-2 hover:text-nebras-gold transition-colors"><PhoneCall size={16}/> 966502658846+</a>
            <a href="mailto:info@nebrasgoo.com" className="flex items-center gap-2 hover:text-nebras-gold transition-colors"><Mail size={16}/> info@nebrasgoo.com</a>
          </div>
          <div className="flex items-center gap-2">
            <span>المملكة العربية السعودية، الرياض</span>
          </div>
        </div>
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/#hero" className="text-2xl font-bold text-nebras-green">NEBRAS<span className="text-nebras-gold">GOO</span></Link>
          
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/#hero" className="text-sm font-medium text-gray-700 hover:text-nebras-green">الرئيسية</Link>
            <Link href="/#about" className="text-sm font-medium text-gray-700 hover:text-nebras-green">عن نبراسكو</Link>
            <Link href="/#services" className="text-sm font-medium text-gray-700 hover:text-nebras-green">خدماتنا</Link>
            <Link href="/assessment" className="text-sm font-medium text-nebras-green hover:text-nebras-gold transition-colors">تقييم سباهي</Link>
            <Link href="/#contact" className="text-sm font-medium text-gray-700 hover:text-nebras-green">تواصل معنا</Link>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Link href="/login" className="rounded-md border border-nebras-green px-4 py-2 text-sm font-bold text-nebras-green transition-colors hover:bg-nebras-green hover:text-white">دخول CRM</Link>
            <Link href="/#lead-capture" className="rounded-md bg-nebras-gold px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-yellow-500">احجز تقييم مجاني</Link>
          </div>

          {/* Mobile menu hack using <details> */}
          <details className="group relative md:hidden">
            <summary className="list-none cursor-pointer p-2 text-nebras-green marker:hidden">
              <Menu size={24} className="group-open:hidden" />
              <X size={24} className="hidden group-open:block" />
            </summary>
            <div className="absolute left-0 right-0 top-full mt-2 w-screen bg-white px-4 py-4 shadow-xl border-t border-gray-100 flex flex-col gap-4">
              <Link href="/#hero" className="border-b pb-2 text-gray-700">الرئيسية</Link>
              <Link href="/#about" className="border-b pb-2 text-gray-700">عن نبراسكو</Link>
              <Link href="/#services" className="border-b pb-2 text-gray-700">خدماتنا</Link>
              <Link href="/assessment" className="border-b pb-2 font-bold text-nebras-green">التقييم الذاتي (CBAHI)</Link>
              <Link href="/#contact" className="border-b pb-2 text-gray-700">تواصل معنا</Link>
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/login" className="text-center rounded-md border border-nebras-green px-4 py-2 text-sm font-bold text-nebras-green">دخول CRM</Link>
                <Link href="/#lead-capture" className="text-center rounded-md bg-nebras-gold px-4 py-2 text-sm font-bold text-white">احجز تقييم مجاني</Link>
              </div>
            </div>
          </details>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* Footer Section */}
      <footer id="contact" className="bg-nebras-ink py-12 text-gray-400 print:hidden">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/#hero" className="text-2xl font-bold text-white mb-4 block">NEBRAS<span className="text-nebras-gold">GOO</span></Link>
            <p className="max-w-xs text-sm leading-relaxed text-gray-400">
              شريكك الموثوق في تقديم حلول متكاملة لبناء وتأهيل المجمعات الطبية في المملكة العربية السعودية.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-white">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#about" className="hover:text-white transition-colors">عن الشركة</Link></li>
              <li><Link href="/#services" className="hover:text-white transition-colors">الخدمات</Link></li>
              <li><Link href="/assessment" className="hover:text-white transition-colors">التقييم الذاتي</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">دخول النظام</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-white">تواصل معنا</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="tel:+966502658846" className="flex items-center gap-2 hover:text-white transition-colors"><PhoneCall size={16}/> 966502658846+</a></li>
              <li><a href="https://wa.me/966535370955" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors"><MessageCircle size={16}/> واتساب</a></li>
              <li><a href="mailto:info@nebrasgoo.com" className="flex items-center gap-2 hover:text-white transition-colors"><Mail size={16}/> info@nebrasgoo.com</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-6xl border-t border-gray-800 mt-12 pt-8 text-center text-sm px-4">
          <p>© {new Date().getFullYear()} نبراسكو (NEBRASGOO). جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
