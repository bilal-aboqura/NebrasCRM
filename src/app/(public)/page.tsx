import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseMedical,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  HandCoins,
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Star,
  Stethoscope,
  TimerReset,
  Users,
} from "lucide-react";
import { HomepageMotion } from "@/components/public/HomepageMotion";
import { LeadCaptureForm } from "@/components/public/LeadCaptureForm";
import { PublicSiteFooter } from "@/components/public/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/public/PublicSiteHeader";
import { publicEmail, publicPhone, publicWhatsapp } from "@/components/public/site-data";

export const metadata: Metadata = {
  title: "نبراس الجودة | تجهيز المنشآت لاعتماد سباهي",
  description:
    "حلول اعتماد متكاملة للمجمعات الطبية والمستشفيات مع سرعة إنجاز، تقليل للتكاليف، وضمان نجاح.",
};

const images = {
  hero: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_4d874db6c0_dcc041bb3d62fd2c.png",
  consultant: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_115dd73367_e14f400058aca523.png",
  checklist: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_388caa4262_dc0361b22a99e250.png",
  audit: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_df0f996cd9_802c93ccf8935e0a.png",
  facility: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_ee69a768aa_c04cb3e7b438a695.png",
  certificate: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_9cf34b29ab_f479d2392e32d795.png",
  city: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_53700853d2_bb3e2cff7fa3e587.png",
  avatar1: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg",
  avatar2: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg",
  avatar3: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg",
} as const;

const stats = [
  { value: "+120", label: "منشأة مدعومة", icon: BriefcaseMedical },
  { value: "+35", label: "مشروع اعتماد", icon: BadgeCheck },
  { value: "+12", label: "سنة خبرة", icon: TimerReset },
  { value: "100%", label: "نسبة نجاح", icon: ShieldCheck },
] as const;

const advantages = [
  {
    icon: TimerReset,
    title: "سرعة الإنجاز",
    body: "خطة مكثفة تساعد المجمع أو المستشفى على رفع الجاهزية خلال مدة قصيرة.",
  },
  {
    icon: HandCoins,
    title: "تقليل التكاليف",
    body: "ترتيب الأولويات يقلل الهدر وإعادة العمل ويجعل التنفيذ أكثر كفاءة.",
  },
  {
    icon: ShieldCheck,
    title: "ضمان النجاح",
    body: "متابعة دقيقة وخبرة عملية تعطي الإدارة ثقة أكبر قبل الزيارة.",
  },
] as const;

const process = [
  {
    icon: Search,
    title: "التقييم والتشخيص",
    body: "نحدد الفجوات ونقيس جاهزية المنشأة مقارنة بمتطلبات CBAHI.",
  },
  {
    icon: FileCheck2,
    title: "التخطيط والتنظيم",
    body: "نرتب الأولويات ونوزع المهام ونجهز مسار التنفيذ المناسب.",
  },
  {
    icon: ClipboardCheck,
    title: "التنفيذ والمتابعة",
    body: "نجهز السياسات والملفات ونتابع الإنجاز مع الفريق خطوة بخطوة.",
  },
  {
    icon: CheckCircle2,
    title: "الاعتماد والجاهزية",
    body: "نرفع الاستعداد ونمنح الفريق ثقة أعلى قبل الزيارة.",
  },
] as const;

const services = [
  {
    image: images.consultant,
    title: "استشارة شاملة لاعتماد CBAHI",
    body: "منهجية واضحة لتجهيز المنشأة من التقييم إلى الجاهزية.",
    large: true,
  },
  {
    image: images.checklist,
    title: "تحليل الفجوات Gap Analysis",
    body: "قراءة دقيقة للنواقص والأولويات قبل بدء التنفيذ.",
  },
  {
    image: images.audit,
    title: "التدقيق الداخلي",
    body: "محاكاة عملية لمتطلبات الزيارة وقياس الجاهزية.",
  },
  {
    title: "إعداد الوثائق والسياسات",
    body: "سياسات، نماذج، أدلة، وملفات مرتبة وسهلة المراجعة.",
    icon: FileCheck2,
  },
  {
    title: "التدريب والتطوير",
    body: "تدريب الفريق على المتطلبات والممارسات اليومية.",
    icon: Users,
  },
  {
    title: "للمجمعات والمستشفيات",
    body: "خارطة جاهزية عملية تساعدك على الاعتماد بوتيرة أسرع وتكلفة أذكى ونتيجة أكثر ثباتًا.",
    icon: Stethoscope,
    tall: true,
    points: ["سرعة الإنجاز", "تقليل التكاليف", "ضمان النجاح"],
  },
  {
    image: images.facility,
    title: "تجديد الاعتماد",
    body: "تحضير مبكر ومنظم لدورات الاعتماد والتجديد.",
    wide: true,
  },
] as const;

const testimonials = [
  {
    name: "د. فهد العتيبي",
    role: "مدير مجمع طبي",
    avatar: images.avatar2,
    quote: "فريق نبراس اختصر علينا الطريق، ورتب المتطلبات بطريقة واضحة وسهلة التطبيق.",
  },
  {
    name: "أ. نورة الزهراني",
    role: "مديرة تشغيل",
    avatar: images.avatar1,
    quote: "أكثر ما ميز التجربة هو سرعة الإنجاز والمتابعة المستمرة حتى اكتمال الجاهزية.",
  },
  {
    name: "د. خالد المالكي",
    role: "مدير مستشفى",
    avatar: images.avatar3,
    quote: "التخطيط الدقيق والدعم العملي جعل رحلة الاعتماد أكثر وضوحًا وثقة.",
  },
] as const;

function Wave({ fill, background = "transparent", flip = false }: { fill: string; background?: string; flip?: boolean }) {
  return (
    <div aria-hidden className="relative z-10 -mt-px" style={{ background }}>
      <svg
        viewBox="0 0 1440 110"
        className={`block w-full ${flip ? "rotate-180" : ""}`}
        preserveAspectRatio="none"
      >
        <path d="M0 20C240 80 480 108 720 88C960 68 1200 10 1440 48V110H0V20Z" fill={fill} />
      </svg>
    </div>
  );
}

export default function MarketingLandingPage() {
  return (
    <main className="bg-[#f5f0e0]">
      <HomepageMotion />
      <PublicSiteHeader />

      <section id="hero" className="relative min-h-[690px] scroll-mt-24 overflow-hidden bg-nebras-green text-white">
        <Image src={images.hero} alt="ممر مستشفى حديث" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[rgba(0,77,60,0.58)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,61,47,0.15),rgba(0,61,47,0.78)_58%,rgba(0,61,47,0.95))]" />

        <div className="relative mx-auto grid min-h-[650px] max-w-7xl items-center gap-8 px-5 pb-24 pt-16 lg:grid-cols-12 lg:px-8">
          <div className="order-2 lg:order-1 lg:col-span-5">
            <div data-reveal="scale" className="relative mx-auto max-w-md">
              <div className="rounded-2xl border border-nebras-gold/30 bg-white/15 p-4 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 place-items-center rounded-xl bg-nebras-gold/20 text-nebras-gold">
                    <ShieldCheck aria-hidden size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold">شريك استراتيجي معتمد</p>
                    <p className="text-xs text-white/70">CBAHI Accreditation Partner</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-nebras-gold/35 bg-nebras-green/75 p-6 shadow-2xl backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-nebras-gold">آخر 12 شهرًا</span>
                  <BadgeCheck aria-hidden className="text-nebras-gold" size={18} />
                </div>
                <div className="grid grid-cols-2 gap-5 text-center">
                  <div>
                    <p className="text-4xl font-black text-nebras-gold">100%</p>
                    <p className="mt-1 text-xs text-white/70">نسبة النجاح</p>
                  </div>
                  <div>
                    <p className="text-4xl font-black text-nebras-gold">+120</p>
                    <p className="mt-1 text-xs text-white/70">منشأة معتمدة</p>
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[97%] rounded-full bg-nebras-gold" />
                </div>
              </div>

              <div className="mt-5 flex max-w-xs items-center gap-3 rounded-2xl border border-white/15 bg-white/15 p-4 shadow-xl backdrop-blur-md">
                <Image src={images.avatar1} alt="مستشارة جودة" width={42} height={42} className="size-10 rounded-full object-cover ring-2 ring-nebras-gold" />
                <div>
                  <p className="text-xs font-extrabold">استشارة متاحة الآن</p>
                  <p className="text-xs text-white/65">متخصصو جاهزية سباهي</p>
                </div>
                <span className="mr-auto rounded-full bg-emerald-400/20 px-3 py-1 text-xs text-emerald-200">متصل</span>
              </div>
            </div>
          </div>

          <div className="order-1 text-right lg:order-2 lg:col-span-7">
            <div data-reveal="start" className="mb-6 inline-flex items-center gap-3">
              <span className="h-px w-12 bg-nebras-gold" />
              <span className="text-xs font-bold tracking-[0.25em] text-nebras-gold">الشريك الاستراتيجي لاعتماد CBAHI</span>
            </div>
            <h1 data-reveal="start" data-reveal-delay="100" className="max-w-3xl text-5xl font-black leading-[1.18] sm:text-6xl lg:text-7xl">
              ارتقِ بمنشأتك
              <span className="block text-nebras-gold">نحو الاعتماد</span>
              <span className="block text-4xl text-white/85 sm:text-5xl lg:text-6xl">بثقة واحترافية</span>
            </h1>
            <p data-reveal="start" data-reveal-delay="180" className="mt-6 max-w-2xl text-lg leading-9 text-white/75">
              نبراس الجودة تقود منشأتك الصحية نحو اعتماد CBAHI بمنهجية عملية متكاملة، من
              تحليل الفجوات وتنظيم الملفات إلى التدريب والمتابعة حتى الجاهزية.
            </p>
            <div data-reveal="start" data-reveal-delay="260" className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#lead-capture" className="inline-flex items-center justify-center gap-2 rounded-full bg-nebras-gold px-7 py-4 font-extrabold text-nebras-green shadow-xl shadow-nebras-gold/25 transition hover:-translate-y-0.5">
                احجز تقييم جاهزية مجاني <ArrowLeft aria-hidden size={18} />
              </a>
              <a href="#services" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-4 font-bold text-white backdrop-blur transition hover:border-nebras-gold hover:text-nebras-gold">
                اكتشف خدماتنا
              </a>
            </div>
            <div data-reveal="start" data-reveal-delay="340" className="mt-8 flex flex-wrap gap-4 text-xs font-bold text-white/75">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-nebras-gold" /> ضمان ذهبي</span>
              <span className="inline-flex items-center gap-2"><TimerReset size={16} className="text-nebras-gold" /> سرعة إنجاز</span>
              <span className="inline-flex items-center gap-2"><HandCoins size={16} className="text-nebras-gold" /> تقليل التكاليف</span>
            </div>
          </div>
        </div>
      </section>

      <Wave fill="#f5f0e0" background="#003d2f" />

      <section className="relative z-20 -mt-20 px-5 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-full border border-nebras-gold/35 bg-nebras-green px-5 py-4 text-white shadow-2xl shadow-nebras-green/35">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center justify-center gap-3 text-center">
                <span className="grid size-9 place-items-center rounded-full bg-nebras-gold/15 text-nebras-gold">
                  <Icon aria-hidden size={17} />
                </span>
                <div>
                  <p className="text-lg font-black text-nebras-gold">{value}</p>
                  <p className="text-xs text-white/70">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 bg-[#f5f0e0] px-5 pb-24 pt-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div data-reveal="scale" className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold tracking-[0.25em] text-nebras-gold">خدماتنا</p>
            <h2 className="mt-3 text-4xl font-extrabold text-nebras-green">حلول اعتماد متكاملة</h2>
            <p className="mt-4 leading-8 text-slate-600">
              نقدم باقة متكاملة من الخدمات الاستشارية والتأهيلية لمساعدة منشأتك على اعتماد CBAHI
              بسرعة وفعالية.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-6">
            {services.map((service, index) => {
              const Icon = "icon" in service ? service.icon : null;
              return (
                <article
                  key={service.title}
                  data-reveal="scale"
                  data-reveal-delay={(index % 3) * 80}
                  className={`group relative min-h-[170px] overflow-hidden rounded-2xl bg-nebras-green text-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                    "large" in service
                      ? "md:col-span-4 md:row-span-2 md:min-h-[280px]"
                      : "tall" in service
                        ? "md:col-span-2 md:row-span-2 md:min-h-[280px]"
                        : "wide" in service
                          ? "md:col-span-4"
                          : "md:col-span-2"
                  }`}
                >
                  {"image" in service && (
                    <Image src={service.image} alt={service.title} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-nebras-green via-nebras-green/70 to-nebras-green/10" />
                  <div className="relative flex h-full min-h-[inherit] flex-col justify-end p-6">
                    <span className="mb-4 grid size-10 place-items-center rounded-xl bg-nebras-gold/20 text-nebras-gold">
                      {Icon ? <Icon aria-hidden size={20} /> : <ClipboardCheck aria-hidden size={20} />}
                    </span>
                    <h3 className="text-xl font-extrabold">{service.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-white/75">{service.body}</p>
                    {"points" in service && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {service.points.map((point) => (
                          <span key={point} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-nebras-gold">
                            {point}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <Wave fill="#003d2f" background="#f5f0e0" />

      <section id="about" className="scroll-mt-24 bg-nebras-green px-5 py-24 text-white lg:px-8">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div data-reveal="start">
            <p className="font-bold text-nebras-gold">من نحن</p>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight">
              نحن أكثر من مستشارين
              <span className="block text-nebras-gold">نحن شركاؤكم</span>
            </h2>
            <p className="mt-6 leading-9 text-white/70">
              تأسست Nebrasgo على يد خبراء في جودة الرعاية الصحية، لنساعد المجمعات الطبية
              والمستشفيات على فهم متطلبات الاعتماد وتطبيقها بطريقة عملية وواضحة.
            </p>

            <div className="mt-8 grid gap-4">
              {advantages.map(({ icon: Icon, title, body }, index) => (
                <div key={title} data-reveal="start" data-reveal-delay={index * 80} className="flex items-start gap-4 rounded-xl bg-white/10 p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-nebras-gold/20 text-nebras-gold">
                    <Icon aria-hidden size={20} />
                  </span>
                  <div>
                    <h3 className="font-extrabold">{title}</h3>
                    <p className="mt-1 text-sm leading-7 text-white/65">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal="end" className="relative">
            <Image src={images.certificate} alt="شهادة اعتماد CBAHI" width={760} height={620} className="h-[520px] w-full rounded-2xl object-cover shadow-2xl" />
            <div className="absolute -right-4 top-6 rounded-xl bg-nebras-gold px-4 py-3 text-nebras-green shadow-xl">
              <p className="text-2xl font-black">100%</p>
              <p className="text-xs font-bold">نسبة نجاح</p>
            </div>
            <div className="absolute -bottom-5 left-8 rounded-xl border border-nebras-gold/25 bg-nebras-green/85 px-5 py-4 shadow-xl backdrop-blur">
              <p className="text-xs text-white/65">سؤال شائع</p>
              <p className="mt-1 text-sm font-bold text-nebras-gold">هل نحتاج تجهيزًا كاملًا؟</p>
            </div>
          </div>
        </div>
      </section>

      <Wave fill="#f5f0e0" background="#003d2f" />

      <section className="bg-[#f5f0e0] px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div data-reveal="scale" className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold tracking-[0.25em] text-nebras-gold">منهجيتنا</p>
            <h2 className="mt-3 text-4xl font-extrabold text-nebras-green">رحلة الاعتماد بخطوات واضحة</h2>
            <p className="mt-4 leading-8 text-slate-600">
              منهجية عملية تقود منشأتك نحو الجاهزية الكاملة قبل زيارة الاعتماد.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {process.map(({ icon: Icon, title, body }, index) => (
              <article key={title} data-reveal="scale" data-reveal-delay={index * 80} className="text-center">
                <span className="relative mx-auto grid size-14 place-items-center rounded-xl bg-nebras-green text-nebras-gold shadow-lg">
                  <Icon aria-hidden size={22} />
                  <span className="absolute -left-2 -top-2 grid size-6 place-items-center rounded-full bg-nebras-gold text-xs font-black text-nebras-green">
                    {index + 1}
                  </span>
                </span>
                <h3 className="mt-5 font-extrabold text-nebras-green">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f0e0] px-5 pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div data-reveal="scale" className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold tracking-[0.25em] text-nebras-gold">عملاؤنا</p>
            <h2 className="mt-3 text-4xl font-extrabold text-nebras-green">يتحدثون عن تجربتهم</h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <article key={item.name} data-reveal="scale" data-reveal-delay={index * 80} className="rounded-xl border border-nebras-gold/20 bg-white p-6 shadow-sm">
                <div className="flex gap-1 text-nebras-gold">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} aria-hidden size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-5 min-h-24 text-sm leading-8 text-slate-600">&quot;{item.quote}&quot;</p>
                <div className="mt-5 flex items-center gap-3">
                  <Image src={item.avatar} alt={item.name} width={48} height={48} className="size-12 rounded-full object-cover" />
                  <div>
                    <p className="font-extrabold text-nebras-green">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Wave fill="#003d2f" background="#f5f0e0" />

      <section id="lead-capture" className="relative scroll-mt-24 overflow-hidden bg-nebras-green px-5 py-24 text-white lg:px-8">
        <Image src={images.city} alt="مدينة سعودية ومنشآت صحية" fill sizes="100vw" className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-nebras-green/80" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div data-reveal="start">
            <p className="font-bold text-nebras-gold">ابدأ رحلتك</p>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight">
              احجز تقييم
              <span className="block text-nebras-gold">جاهزية مجاني</span>
              اليوم
            </h2>
            <p className="mt-5 leading-8 text-white/70">
              دعنا نقيم وضع منشأتك مجانًا ونضع بين يديك خارطة طريق واضحة للحصول على اعتماد CBAHI.
            </p>

            <div className="mt-8 grid gap-4">
              <a href={publicWhatsapp.href} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <MessageCircle aria-hidden className="text-nebras-gold" size={21} />
                <div>
                  <p className="text-xs text-white/50">تواصل عبر واتساب</p>
                  <p className="font-bold" dir="ltr">{publicWhatsapp.display}</p>
                </div>
              </a>
              <a href={publicPhone.href} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <Phone aria-hidden className="text-nebras-gold" size={21} />
                <div>
                  <p className="text-xs text-white/50">الخط المباشر</p>
                  <p className="font-bold" dir="ltr">{publicPhone.display}</p>
                </div>
              </a>
              <a href={publicEmail.href} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <Mail aria-hidden className="text-nebras-gold" size={21} />
                <div>
                  <p className="text-xs text-white/50">البريد الإلكتروني</p>
                  <p className="font-bold" dir="ltr">{publicEmail.display}</p>
                </div>
              </a>
            </div>
          </div>

          <div data-reveal="end" className="rounded-2xl border border-nebras-gold/25 bg-nebras-green/70 p-4 shadow-2xl backdrop-blur">
            <LeadCaptureForm />
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
