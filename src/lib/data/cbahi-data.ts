export interface AssessmentItem {
  code: string;
  question: string;
  suggestedEvidence: string;
}

export interface Chapter {
  code: string;
  title: string;
  items: AssessmentItem[];
}

export interface FacilityTypeConfig {
  id: "general" | "dental";
  title: string;
  description: string;
  chapters: Chapter[];
}

const generalChapters: Chapter[] = [
  {
    code: "LD",
    title: "القيادة والإدارة",
    items: [
      { code: "LD-01", question: "هل يوجد ترخيص ساري وهيكل تنظيمي معتمد؟", suggestedEvidence: "الترخيص، الهيكل التنظيمي، الوصف الوظيفي، التفويضات." },
      { code: "LD-02", question: "هل توجد لجان فعالة ومحاضر اجتماعات موثقة؟", suggestedEvidence: "محاضر اللجان، خطط العمل، متابعة التوصيات." },
      { code: "LD-03", question: "هل يوجد برنامج مؤشرات أداء ومشاريع تحسين؟", suggestedEvidence: "KPI، خطط تحسين، تحليل نتائج، FOCUS-PDCA." },
    ],
  },
  {
    code: "PC",
    title: "تقديم الرعاية",
    items: [
      { code: "PC-01", question: "هل يتم تقييم المريض وتوثيق خطة الرعاية؟", suggestedEvidence: "السجل الطبي، التقييم، خطة العلاج." },
      { code: "PC-02", question: "هل يتم تطبيق حقوق المرضى والموافقة المستنيرة؟", suggestedEvidence: "نموذج موافقة، تثقيف المريض، حقوق المرضى." },
      { code: "PC-03", question: "هل توجد آلية للتعامل مع الحالات الطارئة والإحالة؟", suggestedEvidence: "سياسة طوارئ، سجل إحالات، تدريب." },
    ],
  },
  {
    code: "LB",
    title: "خدمات المختبر",
    items: [
      { code: "LB-01", question: "هل يتم ضبط جودة الفحوصات المخبرية؟", suggestedEvidence: "IQC/EQA، سجلات معايرة، نتائج ضبط الجودة." },
      { code: "LB-02", question: "هل يتم تعريف العينات ونقلها وحفظها بطريقة آمنة؟", suggestedEvidence: "سياسة عينات، سجلات نقل، نتائج حرجة." },
      { code: "LB-03", question: "هل تتوفر إجراءات سلامة العاملين في المختبر؟", suggestedEvidence: "PPE، SDS، سجلات مخاطر ونفايات." },
    ],
  },
  {
    code: "RD",
    title: "خدمات الأشعة",
    items: [
      { code: "RD-01", question: "هل توجد متطلبات السلامة الإشعاعية والتراخيص؟", suggestedEvidence: "رخصة، قياسات إشعاع، صيانة ومعايرة." },
      { code: "RD-02", question: "هل يتم توثيق طلبات وتقارير الأشعة؟", suggestedEvidence: "طلبات أشعة، تقارير، تعريف المريض." },
      { code: "RD-03", question: "هل توجد إجراءات حماية للمرضى والعاملين؟", suggestedEvidence: "لوحات تحذير، وسائل حماية، سجلات تدريب." },
    ],
  },
  {
    code: "DN",
    title: "خدمات الأسنان",
    items: [
      { code: "DN-01", question: "هل يتم تطبيق مكافحة العدوى في عيادات الأسنان؟", suggestedEvidence: "سجلات تعقيم، تدقيق، مؤشرات." },
      { code: "DN-02", question: "هل يتم توثيق خطة علاج الأسنان والموافقة؟", suggestedEvidence: "Dental chart، treatment plan، consent." },
      { code: "DN-03", question: "هل تتم صيانة كراسي الأسنان والأجهزة؟", suggestedEvidence: "سجلات صيانة، عقود، تقارير أعطال." },
    ],
  },
  {
    code: "MM",
    title: "إدارة الأدوية",
    items: [
      { code: "MM-01", question: "هل توجد سياسة شراء وتخزين وصرف الأدوية؟", suggestedEvidence: "سياسات، سجل مخزون، درجات حرارة." },
      { code: "MM-02", question: "هل يتم تمييز الأدوية عالية الخطورة والمتشابهة؟", suggestedEvidence: "High alert، LASA، ملصقات." },
      { code: "MM-03", question: "هل يتم التعامل مع التحسس وانتهاء الصلاحية؟", suggestedEvidence: "Allergy documentation، سجل إتلاف." },
    ],
  },
  {
    code: "MOI",
    title: "إدارة المعلومات",
    items: [
      { code: "MOI-01", question: "هل توجد سياسة حفظ وسرية السجلات الطبية؟", suggestedEvidence: "سياسة خصوصية، صلاحيات، سجلات." },
      { code: "MOI-02", question: "هل توجد قائمة اختصارات معتمدة؟", suggestedEvidence: "قائمة اختصارات، تدقيق ملفات." },
      { code: "MOI-03", question: "هل توجد خطة تعطل النظام الإلكتروني؟", suggestedEvidence: "Downtime policy، نماذج ورقية، تجربة." },
    ],
  },
  {
    code: "IPC",
    title: "مكافحة العدوى",
    items: [
      { code: "IPC-01", question: "هل يوجد برنامج مكافحة عدوى وخطة سنوية؟", suggestedEvidence: "برنامج IPC، خطة، مسؤوليات." },
      { code: "IPC-02", question: "هل يتم رصد نظافة اليدين والتطهير البيئي؟", suggestedEvidence: "Hand hygiene audit، checklist." },
      { code: "IPC-03", question: "هل تدار النفايات الطبية بطريقة آمنة؟", suggestedEvidence: "حاويات، عقود، سجلات نفايات." },
    ],
  },
  {
    code: "FMS",
    title: "إدارة المرافق والسلامة",
    items: [
      { code: "FMS-01", question: "هل توجد خطة سلامة ومخاطر وإخلاء؟", suggestedEvidence: "FMS plan، risk register، fire drill." },
      { code: "FMS-02", question: "هل تتم صيانة المعدات وأنظمة الحريق؟", suggestedEvidence: "PPM، عقود، شهادات، تقارير." },
      { code: "FMS-03", question: "هل مخارج الطوارئ والطفايات جاهزة؟", suggestedEvidence: "تفتيش، لوحات، طفايات، تدريب." },
    ],
  },
  {
    code: "DPU",
    title: "وحدة إجراءات اليوم الواحد",
    items: [
      { code: "DPU-01", question: "هل توجد سياسات قبول وخروج لإجراءات اليوم الواحد؟", suggestedEvidence: "سياسات، نماذج قبول وخروج." },
      { code: "DPU-02", question: "هل يتم تقييم ما قبل وبعد الإجراء؟", suggestedEvidence: "Pre/post assessment، recovery record." },
      { code: "DPU-03", question: "هل توجد خطة تحويل للحالات الطارئة؟", suggestedEvidence: "اتفاقيات إحالة، سياسة طوارئ." },
    ],
  },
  {
    code: "DA",
    title: "الجلدية والطب التجميلي",
    items: [
      { code: "DA-01", question: "هل توجد موافقات مستنيرة للإجراءات التجميلية؟", suggestedEvidence: "Consent، assessment، صور قبل/بعد." },
      { code: "DA-02", question: "هل يتم ضمان سلامة الليزر والأجهزة؟", suggestedEvidence: "Laser safety، صيانة، نظارات حماية." },
      { code: "DA-03", question: "هل تدار المواد والأدوية التجميلية بأمان؟", suggestedEvidence: "مخزون، صلاحية، تعليمات استخدام." },
    ],
  },
];

const dentalChapters: Chapter[] = [
  {
    code: "LD",
    title: "القيادة والإدارة",
    items: [
      { code: "LD-01", question: "هل توجد حوكمة وترخيص وهيكل تنظيمي؟", suggestedEvidence: "ترخيص، هيكل، مسؤوليات." },
      { code: "LD-02", question: "هل يوجد برنامج جودة وسلامة مرضى للأسنان؟", suggestedEvidence: "KPI، شكاوى، رضا مرضى، OVR." },
      { code: "LD-03", question: "هل ملفات العاملين والامتيازات السريرية مكتملة؟", suggestedEvidence: "SCFHS، privileges، competencies." },
    ],
  },
  {
    code: "PC",
    title: "تقديم الرعاية في الأسنان",
    items: [
      { code: "PC-01", question: "هل يتم توثيق التاريخ المرضي والخطة العلاجية؟", suggestedEvidence: "Dental record، charting، treatment plan." },
      { code: "PC-02", question: "هل يتم تعريف المريض بمعرفين قبل الإجراء؟", suggestedEvidence: "سياسة تعريف، تدقيق، سجلات." },
      { code: "PC-03", question: "هل توجد تعليمات وتثقيف بعد الإجراءات؟", suggestedEvidence: "Post-op instructions، patient education." },
      { code: "PC-04", question: "هل توجد آلية طوارئ داخل عيادة الأسنان؟", suggestedEvidence: "Emergency kit، training، referral." },
    ],
  },
  {
    code: "DL",
    title: "مختبر الأسنان",
    items: [
      { code: "DL-01", question: "هل توجد إجراءات لاستقبال ونقل الانطباعات والأجهزة؟", suggestedEvidence: "سجل مختبر، سياسة استلام وتسليم." },
      { code: "DL-02", question: "هل يتم تعريف الانطباعات والأجهزة بمعرفين؟", suggestedEvidence: "Labels، two identifiers." },
      { code: "DL-03", question: "هل يطبق المختبر مكافحة العدوى وفصل مناطق الاستلام والإنتاج؟", suggestedEvidence: "PPE، تطهير، منطقة استقبال." },
      { code: "DL-04", question: "هل بنية المختبر وتجهيزاته آمنة؟", suggestedEvidence: "تهوية، إضاءة، غسيل عين، تخزين آمن." },
    ],
  },
  {
    code: "MOI",
    title: "إدارة المعلومات",
    items: [
      { code: "MOI-01", question: "هل تحفظ السجلات السنية بسرية وسهولة استرجاع؟", suggestedEvidence: "Dental records، صلاحيات، سياسة خصوصية." },
      { code: "MOI-02", question: "هل يتم توثيق الخطة العلاجية والأشعة والموافقات؟", suggestedEvidence: "Record audit، radiographs، consent." },
      { code: "MOI-03", question: "هل توجد سياسة توثيق واختصارات آمنة؟", suggestedEvidence: "Abbreviations، correction policy." },
    ],
  },
  {
    code: "IPC",
    title: "مكافحة العدوى في الأسنان",
    items: [
      { code: "IPC-01", question: "هل يوجد برنامج مكافحة عدوى خاص بالأسنان؟", suggestedEvidence: "IPC program، sterilization policy." },
      { code: "IPC-02", question: "هل يتم توثيق دورة التعقيم والمؤشرات؟", suggestedEvidence: "Sterilization log، chemical/biological indicators." },
      { code: "IPC-03", question: "هل يتم استخدام PPE والتعامل الآمن مع الأدوات الحادة؟", suggestedEvidence: "PPE، sharps safety، training." },
      { code: "IPC-04", question: "هل يتم تطهير الكراسي والأسطح بين المرضى؟", suggestedEvidence: "Checklist، disinfectants، audit." },
    ],
  },
  {
    code: "FMS",
    title: "إدارة المرافق والسلامة",
    items: [
      { code: "FMS-01", question: "هل توجد خطة سلامة ومخاطر وإخلاء؟", suggestedEvidence: "FMS plan، fire drill، risk register." },
      { code: "FMS-02", question: "هل تتم صيانة كراسي الأسنان والضواغط والشفط؟", suggestedEvidence: "PPM، maintenance logs." },
      { code: "FMS-03", question: "هل تدار المواد الكيميائية والغازات بأمان؟", suggestedEvidence: "SDS، storage، signage." },
      { code: "FMS-04", question: "هل توجد حقيبة طوارئ ومتابعة لصلاحيتها؟", suggestedEvidence: "Emergency kit، checklist، expiry dates." },
    ],
  },
];

export const CBAHI_DATA: Record<"general" | "dental", FacilityTypeConfig> = {
  general: {
    id: "general",
    title: "المجمعات الطبية العامة",
    description: "الفصول حسب دليل المراكز والمجمعات الطبية الخارجية: LD, PC, LB, RD, DN, MM, MOI, IPC, FMS, DPU, DA.",
    chapters: generalChapters,
  },
  dental: {
    id: "dental",
    title: "مراكز ومجمعات الأسنان",
    description: "الفصول حسب دليل مراكز الأسنان: LD, PC, DL, MOI, IPC, FMS.",
    chapters: dentalChapters,
  },
};
