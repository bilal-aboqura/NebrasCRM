import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileCheck2,
  HandCoins,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Users,
} from "lucide-react";
import { HomepageMotion } from "@/components/public/HomepageMotion";
import { PublicSiteFooter } from "@/components/public/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/public/PublicSiteHeader";

export const metadata: Metadata = {
  title: "قصص النجاح | نبراس الجودة",
  description:
    "رحلات نجاح حقيقية مع المجمعات الطبية والمستشفيات في تجهيز اعتماد سباهي، مع سرعة الإنجاز وتقليل التكاليف وضمان النجاح.",
};

const images = {
  hero: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_115dd73367_e14f400058aca523.png",
  one: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_388caa4262_dc0361b22a99e250.png",
  two: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_df0f996cd9_802c93ccf8935e0a.png",
  three: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_ee69a768aa_c04cb3e7b438a695.png",
} as const;

const strengths = [
  { icon: TimerReset, title: "سرعة الإنجاز", description: "نرفع جاهزية المنشأة خلال مدة قصيرة بخطة عملية واضحة." },
  { icon: HandCoins, title: "تقليل التكاليف", description: "نقلل الهدر وإعادة العمل عبر ترتيب الأولويات من البداية." },
  { icon: ShieldCheck, title: "ضمان النجاح", description: "متابعة دقيقة تعكس ثقتنا في جودة التنفيذ والنتيجة." },
] as const;

const journey = [
  { icon: Building2, title: "التحدي", description: "نواقص في الملفات، ضغط وقت، واحتياج لتدريب الفريق." },
  { icon: FileCheck2, title: "الخطة", description: "تقييم شامل، تحديد أولويات، وجدولة مراحل التنفيذ." },
  { icon: Users, title: "التنفيذ", description: "تجهيز السياسات والملفات والتدريب والمتابعة اليومية." },
  { icon: CheckCircle2, title: "النتيجة", description: "جاهزية أعلى، تنظيم أفضل، وفريق أكثر ثقة." },
] as const;

const stories = [
  {
    image: images.one,
    title: "من التحدي إلى الجاهزية",
    city: "الرياض",
    duration: "خلال شهر",
    challenge: "كان المجمع بحاجة إلى ترتيب الملفات واستكمال السياسات ورفع جاهزية الفريق قبل موعد الزيارة.",
    solution: "وضع فريق نبراس خطة واضحة شملت التقييم وتجهيز الملفات ومراجعة الأدلة وتدريب الفريق.",
    result: "جاهزية أعلى، تنظيم أفضل، وفريق أكثر فهمًا للمعايير واستعدادًا للزيارة.",
  },
  {
    image: images.two,
    title: "إنجاز خلال مدة قياسية",
    city: "جدة",
    duration: "فترة قياسية",
    challenge: "موعد زيارة قريب مع حاجة لتدخل سريع ومنظم لاستكمال المتطلبات ورفع الجاهزية.",
    solution: "تنفيذ مكثف شمل توزيع المهام وتجهيز الأدلة ومراجعة السياسات وترتيب الملفات.",
    result: "إنجاز سريع، متابعة دقيقة، واستعداد أعلى خلال مدة قصيرة دون ارتباك تشغيلي.",
  },
  {
    image: images.three,
    title: "شراكة صنعت الفرق",
    city: "الدمام",
    duration: "مراحل قصيرة",
    challenge: "تباين في فهم الفريق للمتطلبات مع حاجة إلى تنظيم داخلي أوضح وتقسيم مسؤوليات أفضل.",
    solution: "ورش تدريبية، تنظيم الأدلة، وتثبيت آلية متابعة يومية حتى اكتمال المتطلبات.",
    result: "فريق أكثر ثقة، ملفات أكثر ترتيبًا، ورحلة جاهزية أكثر وضوحًا وهدوءًا.",
  },
] as const;

export default function SuccessStoriesPage() {
  return (
    <main>
      <HomepageMotion />
      <PublicSiteHeader />

      <section className="relative overflow-hidden bg-nebras-green py-20 text-white lg:py-28">
        <Image src={images.hero} alt="اجتماع استشاري داخل منشأة صحية" fill sizes="100vw" className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-nebras-green/85" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-4xl">
            <div data-reveal="start" className="inline-flex items-center gap-2 rounded-full border border-nebras-gold/35 bg-white/10 px-4 py-2 text-sm font-bold text-nebras-gold backdrop-blur">
              <Sparkles aria-hidden size={16} />
              قصص النجاح
            </div>
            <h1 data-reveal="start" data-reveal-delay="100" className="mt-6 text-4xl font-extrabold leading-[1.25] sm:text-5xl lg:text-6xl">
              من التحدي إلى الاعتماد
            </h1>
            <p data-reveal="start" data-reveal-delay="180" className="mt-6 max-w-3xl text-lg leading-9 text-white/80">
              نجاحات حقيقية صنعتها الخبرة والسرعة والمتابعة الدقيقة مع المجمعات الطبية
              والمستشفيات في رحلة تجهيز اعتماد سباهي.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 lg:grid-cols-3 lg:px-8">
          {strengths.map(({ icon: Icon, title, description }, index) => (
            <article key={title} data-reveal="scale" data-reveal-delay={index * 80} className="rounded-2xl border border-nebras-green/10 bg-nebras-cream p-6">
              <Icon className="text-nebras-green" aria-hidden size={28} />
              <h2 className="mt-5 text-2xl font-extrabold text-nebras-green">{title}</h2>
              <p className="mt-3 leading-8 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-nebras-cream py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div data-reveal="scale" className="mx-auto max-w-3xl text-center">
            <p className="font-bold text-nebras-gold">قالب النجاح</p>
            <h2 className="mt-3 text-3xl font-extrabold text-nebras-green sm:text-4xl">
              كل قصة نجاح تمر بأربع محطات
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {journey.map(({ icon: Icon, title, description }, index) => (
              <article key={title} data-reveal="scale" data-reveal-delay={index * 70} className="rounded-2xl bg-white p-6 shadow-sm">
                <Icon className="text-nebras-gold" aria-hidden size={26} />
                <h3 className="mt-5 text-xl font-extrabold text-nebras-green">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div data-reveal="scale" className="mx-auto max-w-3xl text-center">
            <p className="font-bold text-nebras-gold">نماذج من المشاريع</p>
            <h2 className="mt-3 text-3xl font-extrabold text-nebras-green sm:text-4xl">
              رحلات نجاح نفتخر بها
            </h2>
          </div>

          <div className="mt-12 space-y-8">
            {stories.map((story, index) => (
              <article key={story.title} data-reveal="scale" data-reveal-delay={index * 80} className="overflow-hidden rounded-[2rem] border border-nebras-green/10 bg-nebras-cream shadow-sm">
                <div className="grid lg:grid-cols-[.9fr_1.1fr]">
                  <div className="relative min-h-[320px]">
                    <Image src={story.image} alt={story.title} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
                  </div>
                  <div className="p-7 lg:p-9">
                    <div className="flex flex-wrap gap-3 text-sm font-bold">
                      <span className="rounded-full bg-white px-4 py-2 text-nebras-green">{story.city}</span>
                      <span className="rounded-full bg-nebras-green px-4 py-2 text-white">{story.duration}</span>
                    </div>
                    <h3 className="mt-5 text-2xl font-extrabold text-nebras-green">{story.title}</h3>
                    <div className="mt-6 grid gap-4">
                      <div className="rounded-2xl bg-white p-5">
                        <p className="text-sm font-bold text-nebras-gold">التحدي</p>
                        <p className="mt-2 leading-7 text-slate-600">{story.challenge}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-5">
                        <p className="text-sm font-bold text-nebras-gold">تدخل نبراس الجودة</p>
                        <p className="mt-2 leading-7 text-slate-600">{story.solution}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-5">
                        <p className="text-sm font-bold text-nebras-gold">النتيجة</p>
                        <p className="mt-2 leading-7 text-slate-600">{story.result}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-nebras-green py-20 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 lg:grid-cols-[1fr_.9fr] lg:px-8">
          <div data-reveal="start">
            <p className="font-bold text-nebras-gold">الضمان الذهبي</p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              نجاح شركائنا هو رسالتنا الأقوى
            </h2>
            <p className="mt-5 leading-8 text-white/75">
              نعمل بخطة واضحة وتنفيذ سريع ومتابعة دقيقة، ونبرز الضمان الذهبي لأنه يعكس ثقتنا في جودة العمل.
            </p>
          </div>
          <div data-reveal="end" className="rounded-2xl border border-white/10 bg-white/10 p-7 backdrop-blur">
            <BadgeCheck className="text-nebras-gold" aria-hidden size={32} />
            <h3 className="mt-4 text-2xl font-extrabold">لم يفشل أي مجمع قمنا بتجهيزه حتى الآن</h3>
            <p className="mt-3 leading-8 text-white/75">
              سجل نجاح قائم على التخطيط، تنظيم الملفات، تدريب الفريق، والمتابعة حتى الجاهزية.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 text-center">
        <div className="mx-auto max-w-4xl px-5 lg:px-8">
          <h2 data-reveal="scale" className="text-3xl font-extrabold text-nebras-green sm:text-4xl">
            جاهزية أعلى خلال وقت أقل
          </h2>
          <p data-reveal="scale" data-reveal-delay="80" className="mt-5 leading-8 text-slate-600">
            ابدأ بتقييم مجاني يوضح لك أين تقف منشأتك وما الخطوة التالية.
          </p>
          <a data-reveal="scale" data-reveal-delay="160" href="/#lead-capture" className="mt-8 inline-flex items-center gap-2 rounded-full bg-nebras-green px-7 py-4 font-extrabold text-white">
            احجز تقييم جاهزية مجاني <ArrowLeft aria-hidden size={18} />
          </a>
          <div className="mt-6">
            <Link href="/" className="font-bold text-nebras-gold hover:text-nebras-green">
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
