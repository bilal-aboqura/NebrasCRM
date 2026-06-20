import type { Metadata } from "next";
import Link from "next/link";
import { PhoneCall, Mail, MessageCircle, Menu, X, ArrowLeft, CheckCircle2, Building2, UserPlus, FileCheck } from "lucide-react";
import LeadCaptureForm from "@/components/public/LeadCaptureForm";

export const metadata: Metadata = {
  title: "نيبراسكو | نظام إدارة علاقات العملاء الطبي",
  description: "نظام نيبراسكو (NEBRASGOO) يسهل إدارة المبيعات وتأهيل المنشآت الطبية للحصول على الاعتمادات.",
  openGraph: {
    title: "نيبراسكو | نظام إدارة علاقات العملاء الطبي",
    description: "نظام نيبراسكو (NEBRASGOO) يسهل إدارة المبيعات وتأهيل المنشآت الطبية للحصول على الاعتمادات.",
    locale: "ar_SA",
    type: "website",
  },
};

const stats = [
  { value: "+65", label: "مجمع طبي ومنشأة تم دعمها" },
  { value: "100%", label: "نسبة نجاح الاعتمادات" },
  { value: "+10", label: "سنوات من الخبرة" },
];

const services = [
  { id: "serv1", emoji: "🏥", title: "ترخيص المنشآت", description: "استخراج جميع التراخيص المطلوبة لتشغيل المجمعات الطبية بسرعة وكفاءة." },
  { id: "serv2", emoji: "📋", title: "اعتماد سباهي", description: "تأهيل المنشآت لاجتياز معايير المركز السعودي لاعتماد المنشآت الصحية (CBAHI)." },
  { id: "serv3", emoji: "🛡️", title: "مكافحة العدوى", description: "تصميم وتطبيق برامج مكافحة العدوى المتوافقة مع متطلبات وزارة الصحة." },
  { id: "serv4", emoji: "💼", title: "التوظيف الطبي", description: "استقطاب الكفاءات الطبية والإدارية المرخصة والمؤهلة." },
  { id: "serv5", emoji: "💻", title: "الأنظمة الصحية", description: "تركيب وإدارة أنظمة المعلومات الصحية الإلكترونية (HIS)." },
  { id: "serv6", emoji: "📊", title: "الجودة وتطوير الأداء", description: "بناء مؤشرات قياس الأداء للارتقاء بخدمات المجمع الطبي." },
  { id: "serv7", emoji: "🛠️", title: "التجهيزات الطبية", description: "توفير أحدث الأجهزة والمعدات الطبية بأفضل المواصفات." },
];

const features = [
  { title: "خبراء معتمدون", description: "فريق من الخبراء بمؤهلات صحية وإدارية عليا.", icon: UserPlus },
  { title: "دعم مستمر", description: "متابعة دورية وتحديثات مستمرة للأنظمة والمعايير.", icon: PhoneCall },
  { title: "حلول شاملة", description: "من التأسيس حتى التشغيل والاعتماد النهائي.", icon: Building2 },
  { title: "جودة مضمونة", description: "نضمن التوافق التام مع المعايير الوطنية والدولية.", icon: FileCheck },
];

export default function MarketingLandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-tajawal scroll-smooth">
      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden bg-nebras-cream py-20 lg:py-32">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col justify-center space-y-6">
            <h1 className="text-4xl font-black leading-tight text-nebras-green md:text-5xl lg:text-6xl">
              شريكك الموثوق في <br/><span className="text-nebras-gold">التأهيل الطبي</span>
            </h1>
            <p className="text-lg text-gray-700 max-w-lg">
              نساعد المجمعات والمنشآت الطبية في الحصول على الاعتمادات وتجهيز بيئة عمل مطابقة لمعايير الجودة العالمية بكفاءة واحترافية.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="#lead-capture" className="flex items-center gap-2 rounded-lg bg-nebras-green px-6 py-3 font-bold text-white transition-all hover:-translate-y-1 hover:shadow-lg">
                احجز تقييم جاهزية مجاني
                <ArrowLeft size={18} />
              </Link>
              <a href="https://wa.me/966535370955" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border-2 border-nebras-green bg-white px-6 py-3 font-bold text-nebras-green transition-all hover:bg-green-50">
                <MessageCircle size={18} />
                واتساب
              </a>
            </div>
          </div>
          
          <div className="relative mx-auto w-full max-w-md lg:max-w-full flex items-center justify-center">
            {/* Custom CSS Reception Desk Card */}
            <div className="relative h-80 w-full rounded-2xl bg-gradient-to-tr from-nebras-green to-teal-800 p-8 shadow-2xl overflow-hidden transform lg:rotate-3 transition-transform hover:rotate-0 duration-500">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
              <div className="relative z-10 flex h-full flex-col justify-between text-white">
                <div>
                  <div className="inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                    إدارة المنشآت الطبية
                  </div>
                  <h3 className="mt-4 text-2xl font-bold">بناء وتجهيز مجمعك الطبي بسهولة</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-md">
                    <CheckCircle2 className="text-nebras-gold" />
                    <span>تراخيص وزارة الصحة</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-md">
                    <CheckCircle2 className="text-nebras-gold" />
                    <span>اعتماد سباهي (CBAHI)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Bar */}
      <section className="bg-nebras-ink py-12 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-gray-700">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col pt-4 md:pt-0">
                <span className="text-4xl font-black text-nebras-gold">{stat.value}</span>
                <span className="mt-2 text-sm text-gray-300">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Features Section */}
      <section id="about" className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-nebras-green">لماذا نبراسكو؟</h2>
            <p className="mt-4 text-gray-600">نلتزم بتقديم أعلى مستويات الجودة والاحترافية</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="rounded-xl border border-gray-100 bg-slate-50 p-6 text-center shadow-sm transition-shadow hover:shadow-md">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-nebras-green">
                    <Icon size={28} />
                  </div>
                  <h3 className="mb-2 font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section id="services" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-nebras-green">خدماتنا المتميزة</h2>
            <p className="mt-4 text-gray-600">نغطي كافة احتياجات مجمعك الطبي للوصول إلى التميز</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div key={service.id} id={service.id} className="group flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                <div>
                  <div className="mb-4 text-4xl">{service.emoji}</div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{service.description}</p>
                </div>
                <div className="mt-6">
                  <Link href="#lead-capture" className="inline-flex items-center gap-1 font-bold text-nebras-green transition-colors group-hover:text-nebras-gold">
                    المزيد <ArrowLeft size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Capture Placeholder Section */}
      <section id="lead-capture" className="bg-nebras-green py-24 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold lg:text-4xl">ابدأ رحلة التميز الطبي اليوم</h2>
          <p className="mb-10 text-lg text-green-100">احجز تقييم جاهزية مجاني مع خبرائنا لاكتشاف فرص تحسين مجمعك الطبي ومطابقته للمعايير.</p>
          
          <div className="mx-auto max-w-md text-right text-gray-900">
            <LeadCaptureForm />
          </div>
        </div>
      </section>

    </div>
  );
}
