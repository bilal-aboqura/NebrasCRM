import type { Metadata } from "next";
import Link from "next/link";
import { LeadCaptureForm } from "@/components/public/LeadCaptureForm";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Headphones,
  HeartHandshake,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
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
  { value: "+65", label: "منشأة طبية تم دعمها" },
  { value: "+15", label: "عاماً من الخبرة" },
  { value: "+2", label: "مستشفى تحت الدعم" },
  { value: "+100", label: "مشروع مكتمل بنجاح" },
] as const;

const services = [
  {
    icon: "🏥",
    title: "التأهيل لاعتماد سباهي",
    description: "نجهّز منشأتك لمتطلبات الاعتماد بخطة واضحة تبدأ من تحليل الفجوات وحتى الزيارة النهائية.",
  },
  {
    icon: "📋",
    title: "تقييم الجاهزية",
    description: "تقييم شامل يكشف مستوى الامتثال وفرص التحسين، مع تقرير تنفيذي قابل للقياس.",
  },
  {
    icon: "🧭",
    title: "بناء الأنظمة والسياسات",
    description: "تصميم وتطوير السياسات والإجراءات بما يلائم طبيعة منشأتك ومتطلبات الجودة الصحية.",
  },
  {
    icon: "🎓",
    title: "التدريب وبناء القدرات",
    description: "برامج تدريب تطبيقية ترفع وعي الفريق وتحوّل معايير الجودة إلى ممارسة يومية.",
  },
  {
    icon: "📊",
    title: "مؤشرات الأداء والجودة",
    description: "تطوير مؤشرات عملية ولوحات متابعة تساعد القيادات على اتخاذ قرارات أكثر دقة.",
  },
  {
    icon: "🛡️",
    title: "إدارة المخاطر وسلامة المرضى",
    description: "منهجيات استباقية للحد من المخاطر وتعزيز ثقافة السلامة داخل المنشأة الصحية.",
  },
  {
    icon: "🤝",
    title: "الدعم والاستشارات المستمرة",
    description: "مستشارون بجانب فريقك للإجابة والمتابعة وضمان استدامة التحسين بعد الاعتماد.",
  },
] as const;

const trustFeatures = [
  {
    icon: Award,
    title: "خبراء معتمدون",
    description: "خبرات متخصصة في الجودة والاعتماد الصحي.",
  },
  {
    icon: Target,
    title: "حلول مخصصة",
    description: "خطط مبنية حول احتياج منشأتك وواقعها.",
  },
  {
    icon: Headphones,
    title: "دعم متواصل",
    description: "متابعة قريبة من البداية حتى تحقيق الهدف.",
  },
  {
    icon: ShieldCheck,
    title: "سرية مهنية",
    description: "تعامل مسؤول يحفظ بيانات منشأتك وخصوصيتها.",
  },
] as const;

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className={`${compact ? "size-11 text-xl" : "size-14 text-2xl"} grid shrink-0 place-items-center rounded-full border-2 border-nebras-gold bg-nebras-green font-extrabold text-nebras-gold shadow-sm`}>
        N
      </span>
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
      <div className="bg-nebras-green text-white">
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

      <header className="sticky top-0 z-40 border-b border-nebras-green/10 bg-nebras-cream/95 shadow-sm backdrop-blur-xl">
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

      <section id="hero" className="relative scroll-mt-28 overflow-hidden bg-nebras-cream">
        <div aria-hidden className="absolute -left-32 top-0 size-96 rounded-full bg-nebras-gold/10 blur-3xl" />
        <div aria-hidden className="absolute -right-32 bottom-0 size-96 rounded-full bg-nebras-green/10 blur-3xl" />
        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-14 px-5 py-16 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-nebras-gold/30 bg-white px-4 py-2 text-sm font-bold text-nebras-green shadow-sm">
              <CheckCircle2 aria-hidden size={18} className="text-nebras-gold" />
              شريكك الموثوق في الجودة والاعتماد
            </span>
            <h1 className="mt-7 max-w-3xl text-4xl font-extrabold leading-[1.25] text-nebras-green sm:text-5xl lg:text-6xl">
              شريككم نحو اعتماد سباهي
              <span className="block text-nebras-gold">والتميز في الجودة الصحية</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-9 text-slate-600">
              نرافق منشأتكم الصحية بخبرة عملية وحلول مصممة بعناية، من تقييم الجاهزية وبناء الأنظمة إلى التدريب والدعم المستمر حتى تحقيق الاعتماد بثقة.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/assessment" className="inline-flex items-center gap-2 rounded-full bg-nebras-gold px-7 py-3.5 font-bold text-nebras-green shadow-lg shadow-nebras-gold/20 transition hover:-translate-y-1 hover:shadow-xl">
                ابدأ تقييم سباهي <ArrowLeft aria-hidden size={19} />
              </Link>
              <a href="#lead-capture" className="inline-flex items-center gap-2 rounded-full bg-nebras-green px-7 py-3.5 font-bold text-white shadow-lg shadow-nebras-green/20 transition hover:-translate-y-1 hover:shadow-xl">
                احجز تقييم جاهزية مجاني <ArrowLeft aria-hidden size={19} />
              </a>
              <a href="#contact" className="inline-flex items-center gap-2 rounded-full border border-nebras-green/20 bg-white px-7 py-3.5 font-bold text-nebras-green shadow-sm transition hover:border-nebras-gold hover:text-nebras-gold">
                تواصل مع مستشار
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm font-medium text-slate-600">
              <span className="inline-flex items-center gap-2"><Clock3 aria-hidden size={18} className="text-nebras-gold" /> استجابة سريعة</span>
              <span className="inline-flex items-center gap-2"><UsersRound aria-hidden size={18} className="text-nebras-gold" /> فريق متخصص</span>
              <span className="inline-flex items-center gap-2"><HeartHandshake aria-hidden size={18} className="text-nebras-gold" /> شراكة مستدامة</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg" aria-label="تصميم مكتب استقبال نبراسقو">
            <div className="absolute -inset-5 rotate-3 rounded-[2.5rem] border border-nebras-gold/30" />
            <div className="relative overflow-hidden rounded-[2.25rem] bg-nebras-green px-8 pb-9 pt-12 shadow-2xl shadow-nebras-green/25">
              <div className="absolute inset-x-0 top-0 h-2 bg-nebras-gold" />
              <div className="mx-auto mb-10 flex max-w-xs flex-col items-center text-center text-white">
                <div className="grid size-24 place-items-center rounded-full border-2 border-nebras-gold text-4xl font-extrabold text-nebras-gold">N</div>
                <p className="mt-4 text-2xl font-extrabold tracking-wider">NEBRASGOO</p>
                <p className="mt-1 text-sm text-white/70">QUALITY • EXCELLENCE • ACCREDITATION</p>
              </div>
              <div className="relative h-44 rounded-t-[5rem] border-x-8 border-t-8 border-nebras-gold bg-[#f3efe6] shadow-inner">
                <div className="absolute inset-x-8 bottom-0 h-24 rounded-t-3xl bg-white shadow-lg" />
                <div className="absolute bottom-8 left-1/2 h-2 w-24 -translate-x-1/2 rounded-full bg-nebras-gold/60" />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs font-bold text-white/75">
                <span>خبرة</span><span>ثقة</span><span>نتائج</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="إحصاءات نبراسقو" className="bg-nebras-green text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-x-reverse divide-white/10 px-5 py-9 lg:grid-cols-4 lg:px-8">
          {statistics.map((stat) => (
            <div key={stat.label} className="px-3 py-5 text-center">
              <strong className="block text-4xl font-extrabold text-nebras-gold">{stat.value}</strong>
              <span className="mt-2 block text-sm text-white/75">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="scroll-mt-24 bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="font-bold text-nebras-gold">عن نبراسقو</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-nebras-green sm:text-4xl">نحوّل معايير الجودة إلى أثر يلمسه المريض والفريق</h2>
          </div>
          <div className="border-r-4 border-nebras-gold pr-6 text-lg leading-9 text-slate-600">
            <p>نؤمن أن الاعتماد ليس ملفاً يُغلق بعد الزيارة، بل ثقافة عمل مستدامة. لذلك نعمل مع القيادات والفرق جنباً إلى جنب لنصنع أنظمة أبسط، وممارسة أكثر أماناً، ونتائج تستمر.</p>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 bg-nebras-cream py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-bold text-nebras-gold">خدماتنا</p>
            <h2 className="mt-3 text-3xl font-extrabold text-nebras-green sm:text-4xl">دعم متكامل لرحلة الجودة والاعتماد</h2>
            <p className="mt-4 leading-8 text-slate-600">حلول عملية تغطي احتياج منشأتك من التشخيص الأول وحتى استدامة التميز.</p>
          </div>
          <div className="mt-12 grid gap-5 min-[700px]:grid-cols-2 min-[1050px]:grid-cols-3">
            {services.map((service, index) => (
              <article key={service.title} className={`${index === services.length - 1 ? "min-[700px]:col-span-2 min-[1050px]:col-span-1" : ""} group rounded-3xl border border-nebras-green/10 bg-white p-7 shadow-sm transition hover:-translate-y-1.5 hover:border-nebras-gold/60 hover:shadow-xl`}>
                <span aria-hidden className="grid size-14 place-items-center rounded-2xl bg-nebras-green/5 text-3xl transition group-hover:bg-nebras-gold/15">{service.icon}</span>
                <h3 className="mt-6 text-xl font-extrabold text-nebras-green">{service.title}</h3>
                <p className="mt-3 min-h-24 leading-7 text-slate-600">{service.description}</p>
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
          <div className="text-center">
            <Sparkles aria-hidden className="mx-auto text-nebras-gold" />
            <h2 id="trust-title" className="mt-3 text-3xl font-extrabold text-nebras-green">لماذا تختار نبراسقو؟</h2>
          </div>
          <div className="mt-12 grid gap-5 min-[700px]:grid-cols-2 min-[1050px]:grid-cols-4">
            {trustFeatures.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-3xl bg-nebras-cream p-6 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-nebras-green text-nebras-gold"><Icon aria-hidden size={26} /></span>
                <h3 className="mt-5 text-lg font-extrabold text-nebras-green">{title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="lead-capture" className="scroll-mt-24 bg-nebras-gold/10 py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
          <div>
            <p className="font-bold text-nebras-gold">ابدأ بخطوة واضحة</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-nebras-green sm:text-4xl">احجز تقييم جاهزية مجاني</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">دعنا نتعرّف إلى منشأتك ونحدد معاً نقطة البداية الأنسب لرحلة الاعتماد والتحسين.</p>
            <a href={whatsapp.href} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 font-bold text-nebras-green hover:text-nebras-gold">
              أو تحدّث مباشرة مع مستشار <MessageCircle aria-hidden size={20} />
            </a>
          </div>
          <LeadCaptureForm />
        </div>
      </section>

      <footer id="contact" className="scroll-mt-24 bg-[#002b22] text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 min-[700px]:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_.8fr] lg:px-8">
          <div>
            <a href="#hero" className="inline-flex"><Brand /></a>
            <p className="mt-6 max-w-md leading-8 text-white/65">نرافق المنشآت الصحية نحو اعتماد سباهي والتميز المستدام عبر الاستشارات والتأهيل والتدريب وحلول الجودة المتخصصة.</p>
          </div>
          <div>
            <h2 className="font-extrabold text-nebras-gold">روابط سريعة</h2>
            <nav className="mt-5 grid gap-3 text-white/70" aria-label="روابط التذييل">
              {navItems.map((item) => <a key={item.href} href={item.href} className="transition hover:text-white">{item.label}</a>)}
            </nav>
          </div>
          <div>
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
