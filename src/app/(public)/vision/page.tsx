import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  HandCoins,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TimerReset,
  Users,
} from "lucide-react";
import { HomepageMotion } from "@/components/public/HomepageMotion";
import { PublicSiteFooter } from "@/components/public/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/public/PublicSiteHeader";

export const metadata: Metadata = {
  title: "رؤية ورسالة وقيم نبراس الجودة | نبراس الجودة",
  description:
    "رؤية ورسالة وقيم نبراس الجودة في دعم المنشآت الصحية داخل المملكة العربية السعودية لتحقيق الاعتماد والجودة والتميز المؤسسي.",
};

const images = {
  hero: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_115dd73367_e14f400058aca523.png",
  vision: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_388caa4262_dc0361b22a99e250.png",
  mission: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_df0f996cd9_802c93ccf8935e0a.png",
  values: "/images/healthcare-facility-no-signage.png",
} as const;

const pillars = [
  {
    icon: BadgeCheck,
    title: "الاعتماد والجودة",
    description: "حلول احترافية ترفع جاهزية المنشآت الصحية وتدعم متطلبات الاعتماد بثقة.",
  },
  {
    icon: ShieldCheck,
    title: "سلامة المرضى",
    description: "ثقافة جودة عملية تجعل السلامة معياراً حاضراً في السياسات والتدريب والمتابعة.",
  },
  {
    icon: Sparkles,
    title: "التميز المؤسسي",
    description: "تحسين مستمر ومنهجية واضحة تساعد المنشأة على استدامة النجاح بعد الاعتماد.",
  },
] as const;

const values = [
  {
    icon: BadgeCheck,
    title: "الجودة أولاً",
    description: "نؤمن أن الجودة ليست إجراءً مؤقتاً، بل ثقافة عمل مستمرة تنعكس على كل خدمة نقدمها.",
  },
  {
    icon: ShieldCheck,
    title: "المصداقية والشفافية",
    description: "نعمل بوضوح مع شركائنا، ونقدم لهم تقييماً واقعياً وخططاً عملية قابلة للتنفيذ.",
  },
  {
    icon: FileCheck2,
    title: "الاحترافية",
    description: "نلتزم بأعلى معايير الأداء المهني في إعداد السياسات، التدريب، المتابعة، وتجهيز متطلبات الاعتماد.",
  },
  {
    icon: TimerReset,
    title: "سرعة الإنجاز",
    description: "نتميز بالعمل المنظم والسريع دون الإخلال بجودة العمل أو دقة المتطلبات.",
  },
  {
    icon: Users,
    title: "الشراكة الفعالة",
    description: "نعتبر نجاح المنشأة الصحية نجاحاً لنا، ونعمل بروح الفريق الواحد مع الإدارة والموظفين حتى تحقيق الهدف.",
  },
  {
    icon: CheckCircle2,
    title: "الاستدامة والتحسين المستمر",
    description: "لا يقتصر دورنا على الحصول على الاعتماد، بل نحرص على بناء نظام جودة مستدام يساعد المنشأة على التطوير المستمر.",
  },
  {
    icon: Stethoscope,
    title: "سلامة المرضى",
    description: "نضع سلامة المرضى في مقدمة أولوياتنا، ونعمل على تعزيز بيئة صحية آمنة وملتزمة بالمعايير.",
  },
  {
    icon: Sparkles,
    title: "التميز والابتكار",
    description: "نسعى دائماً لتقديم حلول مبتكرة ومبسطة تجعل رحلة الاعتماد أكثر وضوحاً وسهولة وفاعلية.",
  },
] as const;

const commitments = [
  { icon: ClipboardCheck, label: "تأهيل المنشآت للحصول على الاعتماد الصحي" },
  { icon: FileCheck2, label: "تطوير الأنظمة والسياسات والإجراءات" },
  { icon: Users, label: "تعزيز ثقافة الجودة وسلامة المرضى" },
  { icon: HandCoins, label: "منهجية عملية تضمن سرعة الإنجاز وجودة المخرجات" },
] as const;

export default function VisionPage() {
  return (
    <main>
      <HomepageMotion />
      <PublicSiteHeader />

      <section className="relative overflow-hidden bg-nebras-green py-20 text-white lg:py-28">
        <Image
          src={images.hero}
          alt="فريق استشاري يناقش جودة الرعاية الصحية"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-nebras-green/85" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-4xl">
            <div data-reveal="start" className="inline-flex items-center gap-2 rounded-full border border-nebras-gold/35 bg-white/10 px-4 py-2 text-sm font-bold text-nebras-gold backdrop-blur">
              <Sparkles aria-hidden size={16} />
              رؤية نبراس الجودة
            </div>
            <h1 data-reveal="start" data-reveal-delay="100" className="mt-6 text-4xl font-extrabold leading-[1.25] sm:text-5xl lg:text-6xl">
              شريك موثوق للاعتماد والجودة والتميز المؤسسي
            </h1>
            <p data-reveal="start" data-reveal-delay="180" className="mt-6 max-w-3xl text-lg leading-9 text-white/80">
              أن نكون الشريك الأول والأكثر ثقة للمنشآت الصحية في المملكة العربية السعودية في تحقيق الاعتماد والجودة والتميز المؤسسي، من خلال
              حلول احترافية ترفع كفاءة الأداء وتدعم سلامة المرضى واستدامة النجاح.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 lg:grid-cols-3 lg:px-8">
          {pillars.map(({ icon: Icon, title, description }, index) => (
            <article key={title} data-reveal="scale" data-reveal-delay={index * 80} className="rounded-2xl border border-nebras-green/10 bg-nebras-cream p-6">
              <Icon className="text-nebras-green" aria-hidden size={28} />
              <h2 className="mt-5 text-2xl font-extrabold text-nebras-green">{title}</h2>
              <p className="mt-3 leading-8 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-nebras-cream py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 lg:grid-cols-[.95fr_1.05fr] lg:px-8">
          <div data-reveal="start" className="relative min-h-[360px] overflow-hidden rounded-[2rem] shadow-xl">
            <Image src={images.vision} alt="مراجعة ملفات اعتماد وجودة داخل منشأة صحية" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-nebras-green/80 via-nebras-green/20 to-transparent" />
            <div className="absolute bottom-0 p-7 text-white">
              <p className="text-sm font-bold text-nebras-gold">الهدف الأكبر</p>
              <h2 className="mt-2 text-3xl font-extrabold">استدامة النجاح بعد الاعتماد</h2>
            </div>
          </div>

          <div data-reveal="end">
            <p className="font-bold text-nebras-gold">رسالة نبراس الجودة</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-nebras-green sm:text-4xl">
              خدمات استشارية وتدريبية متخصصة للمنشآت الصحية
            </h2>
            <p className="mt-6 leading-9 text-slate-600">
              نلتزم في نبراس الجودة بتقديم خدمات استشارية وتدريبية متخصصة للمنشآت الصحية، تهدف إلى تأهيلها للحصول على الاعتماد الصحي،
              وتطوير أنظمتها وسياساتها وإجراءاتها، وتعزيز ثقافة الجودة وسلامة المرضى، من خلال فريق خبير ومنهجية عملية تضمن سرعة الإنجاز
              وجودة المخرجات.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {commitments.map(({ icon: Icon, label }, index) => (
                <div key={label} data-reveal="scale" data-reveal-delay={index * 70} className="rounded-2xl bg-white p-5 shadow-sm">
                  <Icon className="text-nebras-gold" aria-hidden size={24} />
                  <p className="mt-4 font-bold leading-7 text-nebras-green">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div data-reveal="scale" className="mx-auto max-w-3xl text-center">
            <p className="font-bold text-nebras-gold">قيم نبراس الجودة</p>
            <h2 className="mt-3 text-3xl font-extrabold text-nebras-green sm:text-4xl">
              مبادئ تقود كل مشروع اعتماد
            </h2>
            <p className="mt-4 leading-8 text-slate-600">
              نعمل بهذه القيم في التشخيص، التخطيط، التدريب، المتابعة، وتسليم المخرجات للمنشآت الصحية.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {values.map(({ icon: Icon, title, description }, index) => (
              <article key={title} data-reveal="scale" data-reveal-delay={(index % 4) * 70} className="rounded-2xl border border-nebras-green/10 bg-nebras-cream p-6 shadow-sm">
                <span className="grid size-12 place-items-center rounded-xl bg-nebras-green text-nebras-gold">
                  <Icon aria-hidden size={23} />
                </span>
                <h3 className="mt-5 text-xl font-extrabold text-nebras-green">{title}</h3>
                <p className="mt-3 leading-8 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-nebras-green text-white">
        <div className="mx-auto grid max-w-7xl items-center lg:grid-cols-2">
          <div data-reveal="start" className="px-5 py-20 lg:px-8">
            <p className="font-bold text-nebras-gold">منهجيتنا العملية</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
              جودة واضحة، إنجاز سريع، ومخرجات قابلة للتطبيق
            </h2>
            <p className="mt-5 leading-8 text-white/75">
              نترجم الرؤية والرسالة إلى خطوات عملية تساعد الإدارة والموظفين على فهم المتطلبات، ترتيب الأولويات، وتنفيذ التحسينات بطريقة
              منظمة ترفع كفاءة الأداء وتحافظ على سلامة المرضى.
            </p>
            <Link href="/success-stories" className="mt-8 inline-flex items-center gap-2 rounded-full bg-nebras-gold px-7 py-4 font-extrabold text-nebras-green">
              شاهد قصص النجاح <ArrowLeft aria-hidden size={18} />
            </Link>
          </div>
          <div data-reveal="end" className="relative min-h-[420px] lg:min-h-[560px]">
            <Image src={images.values} alt="منشأة صحية حديثة تدعم الجودة وسلامة المرضى" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-nebras-green/60 to-transparent lg:bg-gradient-to-r" />
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-center">
        <div className="mx-auto max-w-4xl px-5 lg:px-8">
          <h2 data-reveal="scale" className="text-3xl font-extrabold text-nebras-green sm:text-4xl">
            ابدأ رحلة جودة أكثر وضوحاً
          </h2>
          <p data-reveal="scale" data-reveal-delay="80" className="mt-5 leading-8 text-slate-600">
            احصل على تقييم أولي يوضح جاهزية منشأتك والخطوة التالية نحو الاعتماد والتميز المستدام.
          </p>
          <a data-reveal="scale" data-reveal-delay="160" href="/#lead-capture" className="mt-8 inline-flex items-center gap-2 rounded-full bg-nebras-green px-7 py-4 font-extrabold text-white">
            احجز تقييم جاهزية مجاني <ArrowLeft aria-hidden size={18} />
          </a>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
