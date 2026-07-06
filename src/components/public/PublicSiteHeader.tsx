"use client";

import Link from "next/link";
import { Mail, Menu, MessageCircle, Phone, X } from "lucide-react";
import { PublicBrand } from "@/components/public/PublicBrand";
import {
  publicEmail,
  publicNavItems,
  publicPhone,
  publicWhatsapp,
} from "@/components/public/site-data";

export function PublicSiteHeader() {
  return (
    <>
      <div className="motion-header bg-nebras-green text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-2.5 text-xs min-[700px]:justify-between min-[700px]:text-sm">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <a className="inline-flex items-center gap-1.5 transition hover:text-nebras-gold" href={publicPhone.href} dir="ltr">
              <Phone aria-hidden size={15} /> {publicPhone.display}
            </a>
            <a
              className="inline-flex items-center gap-1.5 transition hover:text-nebras-gold"
              href={publicWhatsapp.href}
              target="_blank"
              rel="noreferrer"
              dir="ltr"
            >
              <MessageCircle aria-hidden size={15} /> {publicWhatsapp.display}
            </a>
            <a
              className="hidden items-center gap-1.5 transition hover:text-nebras-gold sm:inline-flex"
              href={publicEmail.href}
              dir="ltr"
            >
              <Mail aria-hidden size={15} /> {publicEmail.display}
            </a>
          </div>
          <p className="font-bold text-nebras-gold">جودة اليوم .. اعتماد الغد</p>
        </div>
      </div>

      <header className="motion-header sticky top-0 z-40 border-b border-nebras-green/10 bg-nebras-cream/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-3 lg:px-8">
          <PublicBrand compact />

          <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-7 min-[850px]:flex">
            {publicNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-bold text-slate-700 transition hover:text-nebras-gold"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/login"
            className="hidden rounded-full bg-nebras-green px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-nebras-green/90 min-[850px]:inline-flex"
          >
            دخول CRM
          </Link>

          <details className="group relative min-[850px]:hidden">
            <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-full border border-nebras-green/15 bg-white text-nebras-green shadow-sm [&::-webkit-details-marker]:hidden">
              <Menu aria-label="فتح القائمة" className="group-open:hidden" />
              <X aria-label="إغلاق القائمة" className="hidden group-open:block" />
            </summary>
            <div className="absolute left-0 top-14 w-72 overflow-hidden rounded-2xl border border-nebras-green/10 bg-white p-3 shadow-2xl">
              <nav aria-label="التنقل عبر الجوال" className="grid gap-1">
                {publicNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-4 py-3 font-bold text-nebras-green transition hover:bg-nebras-cream"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link href="/login" className="mt-2 rounded-xl bg-nebras-green px-4 py-3 text-center font-bold text-white">
                  دخول CRM
                </Link>
              </nav>
            </div>
          </details>
        </div>
      </header>
    </>
  );
}
