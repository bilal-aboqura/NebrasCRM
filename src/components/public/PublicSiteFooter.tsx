import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { PublicBrand } from "@/components/public/PublicBrand";
import {
  publicEmail,
  publicNavItems,
  publicPhone,
  publicWhatsapp,
} from "@/components/public/site-data";

export function PublicSiteFooter() {
  return (
    <footer id="contact" className="scroll-mt-24 bg-[#002b22] text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 min-[700px]:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_.8fr] lg:px-8">
        <div data-reveal="start">
          <PublicBrand href="/#hero" />
          <p className="mt-6 max-w-md leading-8 text-white/65">
            نرافق المنشآت الصحية نحو اعتماد سباهي والتميز المستدام عبر الاستشارات والتأهيل
            والتدريب وحلول الجودة المتخصصة.
          </p>
        </div>
        <div data-reveal="scale" data-reveal-delay="80">
          <h2 className="font-extrabold text-nebras-gold">روابط سريعة</h2>
          <nav className="mt-5 grid gap-3 text-white/70" aria-label="روابط التذييل">
            {publicNavItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div data-reveal="end" data-reveal-delay="160">
          <h2 className="font-extrabold text-nebras-gold">تواصل معنا</h2>
          <div className="mt-5 grid gap-4 text-sm text-white/70">
            <a href={publicPhone.href} className="inline-flex items-center gap-2 transition hover:text-white" dir="ltr">
              <Phone aria-hidden size={17} /> {publicPhone.display}
            </a>
            <a
              href={publicWhatsapp.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 transition hover:text-white"
              dir="ltr"
            >
              <MessageCircle aria-hidden size={17} /> {publicWhatsapp.display}
            </a>
            <a href={publicEmail.href} className="inline-flex items-center gap-2 break-all transition hover:text-white" dir="ltr">
              <Mail aria-hidden size={17} /> {publicEmail.display}
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-sm text-white/45">
        © {new Date().getFullYear()} NEBRASGOO. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
