import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AnimatedCounter } from "@/components/public/AnimatedCounter";
import { BrandLogo } from "@/components/BrandLogo";
import { HomepageMotion } from "@/components/public/HomepageMotion";
import { LeadCaptureForm } from "@/components/public/LeadCaptureForm";
import heroImage from "../../../heroimage.webp";
import {
  ArrowLeft,
  BadgeCheck,
  ChartNoAxesCombined,
  ChevronLeft,
  ClipboardCheck,
  GraduationCap,
  Handshake,
  Headset,
  Hospital,
  LockKeyhole,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  ScrollText,
  ShieldPlus,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

export const metadata: Metadata = {
  title: "نبراسقو | شريكك نحو اعتماد سباهي والتميز الصحي",
  description:
    "نبراسقو للاستشارات الصحية وتأهيل المنشآت للحصول على اعتماد سباهي عبر حلول عملية وخبراء معتمدين ودعم مستمر.",
  openGraph: {
    title: "نبراسقو | الجودة اليوم، اعتماد الغد",
    description:
      "نرافق منشأتك الصحية في رحلة الجاهزية والاعتماد بخبرة تتجاوز 15 عاماً.",
    type: "website",
    locale: "ar_SA",
    siteName: "NEBRASGOO",
  },
};

const phone = { display: "+966 50 265 8846", href: "tel:+966502658846" };
const whatsapp = {
  display: "+966 53 537 0955",
  href: "https://wa.me/966535370955",
};
const email = {
  display: "NEBRASGOO@GMAIL.COM",
  href: "mailto:NEBRASGOO@GMAIL.COM",
};

const navItems = [
  { href: "#hero", label: "الرئيسية" },
  { href: "#about", label: "عن نبراسقو" },
  { href: "#services", label: "خدماتنا" },
  { href: "/assessment", label: "تقييم سباهي" },
  { href: "#contact", label: "تواصل معنا" },
] as const;

const statistics = [
  { value: 65, label: "منشأة طبية تم دعمها" },
  { value: 15, label: "عاماً من الخبرة" },
  { value: 2, label: "مستشفى تحت الدعم" },
  { value: 100, label: "مشروع مكتمل بنجاح" },
] as const;

const services = [
  {
    icon: Hospital,
    title: "التأهيل لاعتماد سباهي",
    description: "نجهّز منشأتك لمتطلبات الاعتماد بخطة واضحة تبدأ من تحليل الفجوات وحتى الزيارة النهائية.",
  },
  {
    icon: ClipboardCheck,
    title: "تقييم الجاهزية",
    description: "تقييم شامل يكشف مستوى الامتثال وفرص التحسين، مع تقرير تنفيذي قابل للقياس.",
  },
  {
    icon: ScrollText,
    title: "بناء الأنظمة والسياسات",
    description: "تصميم وتطوير السياسات والإجراءات بما يلائم طبيعة منشأتك ومتطلبات الجودة الصحية.",
  },
  {
    icon: GraduationCap,
    title: "التدريب وبناء القدرات",
    description: "برامج تدريب تطبيقية ترفع وعي الفريق وتحوّل معايير الجودة إلى ممارسة يومية.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "مؤشرات الأداء والجودة",
    description: "تطوير مؤشرات عملية ولوحات متابعة تساعد القيادات على اتخاذ قرارات أكثر دقة.",
  },
  {
    icon: ShieldPlus,
    title: "إدارة المخاطر وسلامة المرضى",
    description: "منهجيات استباقية للحد من المخاطر وتعزيز ثقافة السلامة داخل المنشأة الصحية.",
  },
  {
    icon: Handshake,
    title: "الدعم والاستشارات المستمرة",
    description: "مستشارون بجانب فريقك للإجابة والمتابعة وضمان استدامة التحسين بعد الاعتماد.",
  },
] as const;

const trustFeatures = [
  {
    icon: BadgeCheck,
    title: "خبراء معتمدون",
    description: "خبرات متخصصة في الجودة والاعتماد الصحي.",
  },
  {
    icon: SlidersHorizontal,
    title: "حلول مخصصة",
    description: "خطط مبنية حول احتياج منشأتك وواقعها.",
  },
  {
    icon: Headset,
    title: "دعم متواصل",
    description: "متابعة قريبة من البداية حتى تحقيق الهدف.",
  },
  {
    icon: LockKeyhole,
    title: "سرية مهنية",
    description: "تعامل مسؤول يحفظ بيانات منشأتك وخصوصيتها.",
  },
] as const;

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <BrandLogo size={compact ? "md" : "lg"} />
      <span className="leading-tight">
        <strong className={`${compact ? "text-lg" : "text-xl"} block tracking-wide text-nebras-green`}>
          NEBRASGOO
        </strong>
        <span className="text-xs font-medium text-slate-500">
          نبراس الجودة للتميز والاعتماد الصحي
        </span>
      </span>
    </span>
  );
}

export default function MarketingLandingPage() {
  return (
    <main>
      <HomepageMotion />
      <div className="motion-header bg-nebras-green text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-2.5 text-xs min-[700px]:justify-between min-[700px]:text-sm">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <a className="inline-flex items-center gap-1.5 transition hover:text-nebras-gold" href={phone.href} dir="ltr">
              <Phone aria-hidden size={15} /> {phone.display}
            </a>
            <a className="inline-flex items-center gap-1.5 transition hover:text-nebras-gold" href={whatsapp.href} target="_blank" rel="noreferrer" dir="ltr">
              <MessageCircle aria-hidden size={15} /> {whatsapp.display}
            </a>
            <a className="hidden items-center gap-1.5 transition hover:text-nebras-gold sm:inline-flex" href={email.href} dir="ltr">
              <Mail aria-hidden size={15} /> {email.display}
            </a>
          </div>
          <p className="font-bold text-nebras-gold">جودة اليوم .. اعتماد الغد</p>
        </div>
      </div>

      <header className="motion-header sticky top-0 z-40 border-b border-nebras-green/10 bg-nebras-cream/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-3 lg:px-8">
          <a href="#hero" aria-label="العودة إلى الرئيسية">
            <Brand compact />
          </a>

          <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-7 min-[700px]:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-bold text-slate-700 transition hover:text-nebras-gold">
                {item.label}
              </a>
            ))}
          </nav>

          <Link href="/login" className="hidden rounded-full bg-nebras-green px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-nebras-green/90 min-[700px]:inline-flex">
            دخول CRM
          </Link>

          <details className="group relative min-[700px]:hidden">
            <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-full border border-nebras-green/15 bg-white text-nebras-green shadow-sm [&::-webkit-details-marker]:hidden">
              <Menu aria-label="فتح القائمة" className="group-open:hidden" />
              <X aria-label="إغلاق القائمة" className="hidden group-open:block" />
            </summary>
            <div className="absolute left-0 top-14 w-72 overflow-hidden rounded-2xl border border-nebras-green/10 bg-white p-3 shadow-2xl">
              <nav aria-label="التنقل عبر الجوال" className="grid gap-1">
                {navItems.map((item) => (
                  <a key={item.href} href={item.href} className="rounded-xl px-4 py-3 font-bold text-nebras-green transition hover:bg-nebras-cream">
                    {item.label}
                  </a>
                ))}
                <Link href="/login" className="mt-2 rounded-xl bg-nebras-green px-4 py-3 text-center font-bold text-white">
                  دخول CRM
                </Link>
              </nav>
            </div>
          </details>
        </div>
      </header>

      <section id="hero" aria-labelledby="hero-title" className="relative min-h-[700px] scroll-mt-28 overflow-hidden bg-nebras-green">
        <Image
          src={heroImage}
          alt="منشأة صحية حديثة مجهزة لخدمة المرضى"
          fill
          priority
          sizes="100vw"
          className="motion-hero-image object-cover object-[center_52%]"
        />
        <div aria-hidden className="absolute inset-0 bg-nebras-green/30" />
        <div className="relative mx-auto flex min-h-[700px] max-w-7xl items-center px-4 py-10 sm:px-5 sm:py-14 lg:px-8 lg:py-20">
          <div data-reveal="scale" className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-nebras-cream/95 p-6 shadow-2xl shadow-nebras-green/30 backdrop-blur-xl sm:p-9 lg:p-11">
            <h1 id="hero-title" data-reveal="start" data-reveal-delay="100" className="text-4xl font-extrabold leading-[1.4] text-nebras-green sm:text-5xl lg:text-[3.5rem]">
              شريككم نحو اعتماد سباهي
              <span className="mt-3 block text-nebras-gold sm:mt-4">والتميز في الجودة الصحية</span>
            </h1>
            <p data-reveal="start" data-reveal-delay="220" className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg sm:leading-9">
              نرافق منشأتكم الصحية بخبرة عملية وحلول مصممة بعناية، من تقييم الجاهزية وبناء الأنظمة إلى التدريب والدعم المستمر حتى تحقيق الاعتماد بثقة.
            </p>
            <div data-reveal="start" data-reveal-delay="340" className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/assessment" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-nebras-gold px-7 py-3.5 font-bold text-nebras-green shadow-lg shadow-nebras-gold/20 transition hover:-translate-y-0.5 hover:shadow-xl sm:w-auto">
                ابدأ تقييم سباهي <ArrowLeft aria-hidden size={19} />
              </Link>
              <a href="#lead-capture" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-nebras-green px-7 py-3.5 font-bold text-white shadow-lg shadow-nebras-green/20 transition hover:-translate-y-0.5 hover:shadow-xl sm:w-auto">
                احجز تقييم جاهزية مجاني <ArrowLeft aria-hidden size={19} />
              </a>
              <a href="#contact" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-nebras-green/15 bg-white px-7 py-3.5 font-bold text-nebras-green shadow-sm transition hover:border-nebras-gold hover:text-nebras-gold sm:w-auto">
                تواصل مع مستشار
              </a>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="إحصاءات نبراسقو" className="bg-nebras-green text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-x-reverse divide-white/10 px-5 py-9 lg:grid-cols-4 lg:px-8">
          {statistics.map((stat, index) => (
            <div key={stat.label} data-reveal="scale" data-reveal-delay={index * 90} className="px-3 py-5 text-center">
              <AnimatedCounter value={stat.value} label={stat.label} />
              <span className="mt-2 block text-sm text-white/75">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="scroll-mt-24 bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
          <div data-reveal="start">
            <p className="font-bold text-nebras-gold">عن نبراسقو</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-nebras-green sm:text-4xl">نحوّل معايير الجودة إلى أثر يلمسه المريض والفريق</h2>
          </div>
          <div data-reveal="end" className="border-r-4 border-nebras-gold pr-6 text-lg leading-9 text-slate-600">
            <p>نؤمن أن الاعتماد ليس ملفاً يُغلق بعد الزيارة، بل ثقافة عمل مستدامة. لذلك نعمل مع القيادات والفرق جنباً إلى جنب لنصنع أنظمة أبسط، وممارسة أكثر أماناً، ونتائج تستمر.</p>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 bg-nebras-cream py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div data-reveal="scale" className="mx-auto max-w-2xl text-center">
            <p className="font-bold text-nebras-gold">خدماتنا</p>
            <h2 className="mt-3 text-3xl font-extrabold text-nebras-green sm:text-4xl">دعم متكامل لرحلة الجودة والاعتماد</h2>
            <p className="mt-4 leading-8 text-slate-600">حلول عملية تغطي احتياج منشأتك من التشخيص الأول وحتى استدامة التميز.</p>
          </div>
          <div className="mt-12 grid gap-5 min-[700px]:grid-cols-2 min-[1050px]:grid-cols-3">
            {services.map(({ icon: Icon, title, description }, index) => (
              <article key={title} data-reveal="scale" data-reveal-delay={(index % 3) * 80} className={`${index === services.length - 1 ? "min-[700px]:col-span-2 min-[1050px]:col-span-1" : ""} group rounded-3xl border border-nebras-green/10 bg-white p-7 shadow-sm transition hover:-translate-y-1.5 hover:border-nebras-gold/60 hover:shadow-xl`}>
                <span className="grid size-14 place-items-center rounded-2xl bg-nebras-green/5 text-nebras-green transition group-hover:bg-nebras-gold/15 group-hover:text-nebras-gold">
                  <Icon aria-hidden size={27} strokeWidth={1.8} />
                </span>
                <h3 className="mt-6 text-xl font-extrabold text-nebras-green">{title}</h3>
                <p className="mt-3 min-h-24 leading-7 text-slate-600">{description}</p>
                <a href="#lead-capture" className="mt-5 inline-flex items-center gap-1 font-bold text-nebras-gold transition group-hover:gap-2">
                  المزيد <ChevronLeft aria-hidden size={18} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-24" aria-labelledby="trust-title">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div data-reveal="scale" className="text-center">
            <Sparkles aria-hidden className="motion-float mx-auto text-nebras-gold" />
            <h2 id="trust-title" className="mt-3 text-3xl font-extrabold text-nebras-green">لماذا تختار نبراسقو؟</h2>
          </div>
          <div className="mt-12 grid gap-5 min-[700px]:grid-cols-2 min-[1050px]:grid-cols-4">
            {trustFeatures.map(({ icon: Icon, title, description }, index) => (
              <article key={title} data-reveal="scale" data-reveal-delay={index * 80} className="rounded-3xl bg-nebras-cream p-6 text-center transition hover:-translate-y-1 hover:shadow-lg">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-nebras-green/5 text-nebras-green">
                  <Icon aria-hidden size={27} strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 text-lg font-extrabold text-nebras-green">{title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="lead-capture" className="scroll-mt-24 bg-nebras-gold/10 py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
          <div data-reveal="start">
            <p className="font-bold text-nebras-gold">ابدأ بخطوة واضحة</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-nebras-green sm:text-4xl">احجز تقييم جاهزية مجاني</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">دعنا نتعرّف إلى منشأتك ونحدد معاً نقطة البداية الأنسب لرحلة الاعتماد والتحسين.</p>
            <a href={whatsapp.href} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 font-bold text-nebras-green hover:text-nebras-gold">
              أو تحدّث مباشرة مع مستشار <MessageCircle aria-hidden size={20} />
            </a>
          </div>
          <div data-reveal="end">
            <LeadCaptureForm />
          </div>
        </div>
      </section>

      <footer id="contact" className="scroll-mt-24 bg-[#002b22] text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 min-[700px]:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_.8fr] lg:px-8">
          <div data-reveal="start">
            <a href="#hero" className="inline-flex"><Brand /></a>
            <p className="mt-6 max-w-md leading-8 text-white/65">نرافق المنشآت الصحية نحو اعتماد سباهي والتميز المستدام عبر الاستشارات والتأهيل والتدريب وحلول الجودة المتخصصة.</p>
          </div>
          <div data-reveal="scale" data-reveal-delay="80">
            <h2 className="font-extrabold text-nebras-gold">روابط سريعة</h2>
            <nav className="mt-5 grid gap-3 text-white/70" aria-label="روابط التذييل">
              {navItems.map((item) => <a key={item.href} href={item.href} className="transition hover:text-white">{item.label}</a>)}
            </nav>
          </div>
          <div data-reveal="end" data-reveal-delay="160">
            <h2 className="font-extrabold text-nebras-gold">تواصل معنا</h2>
            <div className="mt-5 grid gap-4 text-sm text-white/70">
              <a href={phone.href} className="inline-flex items-center gap-2 transition hover:text-white" dir="ltr"><Phone aria-hidden size={17} /> {phone.display}</a>
              <a href={whatsapp.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-white" dir="ltr"><MessageCircle aria-hidden size={17} /> {whatsapp.display}</a>
              <a href={email.href} className="inline-flex items-center gap-2 break-all transition hover:text-white" dir="ltr"><Mail aria-hidden size={17} /> {email.display}</a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-5 py-5 text-center text-sm text-white/45">© {new Date().getFullYear()} NEBRASGOO. جميع الحقوق محفوظة.</div>
      </footer>
    </main>
  );
}
