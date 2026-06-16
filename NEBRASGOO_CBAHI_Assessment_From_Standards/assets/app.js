const DATA = {"general": {"title": "تقييم المجمعات الطبية العامة", "desc": "الفصول حسب دليل المراكز والمجمعات الطبية الخارجية: LD, PC, LB, RD, DN, MM, MOI, IPC, FMS, DPU, DA.", "chapters": [["LD", "القيادة والإدارة", [["LD-01", "هل يوجد ترخيص ساري وهيكل تنظيمي معتمد؟", "الترخيص، الهيكل التنظيمي، الوصف الوظيفي، التفويضات."], ["LD-02", "هل توجد لجان فعالة ومحاضر اجتماعات موثقة؟", "محاضر اللجان، خطط العمل، متابعة التوصيات."], ["LD-03", "هل يوجد برنامج مؤشرات أداء ومشاريع تحسين؟", "KPI، خطط تحسين، تحليل نتائج، FOCUS-PDCA."]]], ["PC", "تقديم الرعاية", [["PC-01", "هل يتم تقييم المريض وتوثيق خطة الرعاية؟", "السجل الطبي، التقييم، خطة العلاج."], ["PC-02", "هل يتم تطبيق حقوق المرضى والموافقة المستنيرة؟", "نموذج موافقة، تثقيف المريض، حقوق المرضى."], ["PC-03", "هل توجد آلية للتعامل مع الحالات الطارئة والإحالة؟", "سياسة طوارئ، سجل إحالات، تدريب."]]], ["LB", "خدمات المختبر", [["LB-01", "هل يتم ضبط جودة الفحوصات المخبرية؟", "IQC/EQA، سجلات معايرة، نتائج ضبط الجودة."], ["LB-02", "هل يتم تعريف العينات ونقلها وحفظها بطريقة آمنة؟", "سياسة عينات، سجلات نقل، نتائج حرجة."], ["LB-03", "هل تتوفر إجراءات سلامة العاملين في المختبر؟", "PPE، SDS، سجلات مخاطر ونفايات."]]], ["RD", "خدمات الأشعة", [["RD-01", "هل توجد متطلبات السلامة الإشعاعية والتراخيص؟", "رخصة، قياسات إشعاع، صيانة ومعايرة."], ["RD-02", "هل يتم توثيق طلبات وتقارير الأشعة؟", "طلبات أشعة، تقارير، تعريف المريض."], ["RD-03", "هل توجد إجراءات حماية للمرضى والعاملين؟", "لوحات تحذير، وسائل حماية، سجلات تدريب."]]], ["DN", "خدمات الأسنان", [["DN-01", "هل يتم تطبيق مكافحة العدوى في عيادات الأسنان؟", "سجلات تعقيم، تدقيق، مؤشرات."], ["DN-02", "هل يتم توثيق خطة علاج الأسنان والموافقة؟", "Dental chart، treatment plan، consent."], ["DN-03", "هل تتم صيانة كراسي الأسنان والأجهزة؟", "سجلات صيانة، عقود، تقارير أعطال."]]], ["MM", "إدارة الأدوية", [["MM-01", "هل توجد سياسة شراء وتخزين وصرف الأدوية؟", "سياسات، سجل مخزون، درجات حرارة."], ["MM-02", "هل يتم تمييز الأدوية عالية الخطورة والمتشابهة؟", "High alert، LASA، ملصقات."], ["MM-03", "هل يتم التعامل مع التحسس وانتهاء الصلاحية؟", "Allergy documentation، سجل إتلاف."]]], ["MOI", "إدارة المعلومات", [["MOI-01", "هل توجد سياسة حفظ وسرية السجلات الطبية؟", "سياسة خصوصية، صلاحيات، سجلات."], ["MOI-02", "هل توجد قائمة اختصارات معتمدة؟", "قائمة اختصارات، تدقيق ملفات."], ["MOI-03", "هل توجد خطة تعطل النظام الإلكتروني؟", "Downtime policy، نماذج ورقية، تجربة."]]], ["IPC", "مكافحة العدوى", [["IPC-01", "هل يوجد برنامج مكافحة عدوى وخطة سنوية؟", "برنامج IPC، خطة، مسؤوليات."], ["IPC-02", "هل يتم رصد نظافة اليدين والتطهير البيئي؟", "Hand hygiene audit، checklist."], ["IPC-03", "هل تدار النفايات الطبية بطريقة آمنة؟", "حاويات، عقود، سجلات نفايات."]]], ["FMS", "إدارة المرافق والسلامة", [["FMS-01", "هل توجد خطة سلامة ومخاطر وإخلاء؟", "FMS plan، risk register، fire drill."], ["FMS-02", "هل تتم صيانة المعدات وأنظمة الحريق؟", "PPM، عقود، شهادات، تقارير."], ["FMS-03", "هل مخارج الطوارئ والطفايات جاهزة؟", "تفتيش، لوحات، طفايات، تدريب."]]], ["DPU", "وحدة إجراءات اليوم الواحد", [["DPU-01", "هل توجد سياسات قبول وخروج لإجراءات اليوم الواحد؟", "سياسات، نماذج قبول وخروج."], ["DPU-02", "هل يتم تقييم ما قبل وبعد الإجراء؟", "Pre/post assessment، recovery record."], ["DPU-03", "هل توجد خطة تحويل للحالات الطارئة؟", "اتفاقيات إحالة، سياسة طوارئ."]]], ["DA", "الجلدية والطب التجميلي", [["DA-01", "هل توجد موافقات مستنيرة للإجراءات التجميلية؟", "Consent، assessment، صور قبل/بعد."], ["DA-02", "هل يتم ضمان سلامة الليزر والأجهزة؟", "Laser safety، صيانة، نظارات حماية."], ["DA-03", "هل تدار المواد والأدوية التجميلية بأمان؟", "مخزون، صلاحية، تعليمات استخدام."]]]]}, "dental": {"title": "تقييم مراكز ومجمعات الأسنان", "desc": "الفصول حسب دليل مراكز الأسنان: LD, PC, DL, MOI, IPC, FMS.", "chapters": [["LD", "القيادة والإدارة", [["LD-01", "هل توجد حوكمة وترخيص وهيكل تنظيمي؟", "ترخيص، هيكل، مسؤوليات."], ["LD-02", "هل يوجد برنامج جودة وسلامة مرضى للأسنان؟", "KPI، شكاوى، رضا مرضى، OVR."], ["LD-03", "هل ملفات العاملين والامتيازات السريرية مكتملة؟", "SCFHS، privileges، competencies."]]], ["PC", "تقديم الرعاية في الأسنان", [["PC-01", "هل يتم توثيق التاريخ المرضي والخطة العلاجية؟", "Dental record، charting، treatment plan."], ["PC-02", "هل يتم تعريف المريض بمعرفين قبل الإجراء؟", "سياسة تعريف، تدقيق، سجلات."], ["PC-03", "هل توجد تعليمات وتثقيف بعد الإجراءات؟", "Post-op instructions، patient education."], ["PC-04", "هل توجد آلية طوارئ داخل عيادة الأسنان؟", "Emergency kit، training، referral."]]], ["DL", "مختبر الأسنان", [["DL-01", "هل توجد إجراءات لاستقبال ونقل الانطباعات والأجهزة؟", "سجل مختبر، سياسة استلام وتسليم."], ["DL-02", "هل يتم تعريف الانطباعات والأجهزة بمعرفين؟", "Labels، two identifiers."], ["DL-03", "هل يطبق المختبر مكافحة العدوى وفصل مناطق الاستلام والإنتاج؟", "PPE، تطهير، منطقة استقبال."], ["DL-04", "هل بنية المختبر وتجهيزاته آمنة؟", "تهوية، إضاءة، غسيل عين، تخزين آمن."]]], ["MOI", "إدارة المعلومات", [["MOI-01", "هل تحفظ السجلات السنية بسرية وسهولة استرجاع؟", "Dental records، صلاحيات، سياسة خصوصية."], ["MOI-02", "هل يتم توثيق الخطة العلاجية والأشعة والموافقات؟", "Record audit، radiographs، consent."], ["MOI-03", "هل توجد سياسة توثيق واختصارات آمنة؟", "Abbreviations، correction policy."]]], ["IPC", "مكافحة العدوى في الأسنان", [["IPC-01", "هل يوجد برنامج مكافحة عدوى خاص بالأسنان؟", "IPC program، sterilization policy."], ["IPC-02", "هل يتم توثيق دورة التعقيم والمؤشرات؟", "Sterilization log، chemical/biological indicators."], ["IPC-03", "هل يتم استخدام PPE والتعامل الآمن مع الأدوات الحادة؟", "PPE، sharps safety، training."], ["IPC-04", "هل يتم تطهير الكراسي والأسطح بين المرضى؟", "Checklist، disinfectants، audit."]]], ["FMS", "إدارة المرافق والسلامة", [["FMS-01", "هل توجد خطة سلامة ومخاطر وإخلاء؟", "FMS plan، fire drill، risk register."], ["FMS-02", "هل تتم صيانة كراسي الأسنان والضواغط والشفط؟", "PPM، maintenance logs."], ["FMS-03", "هل تدار المواد الكيميائية والغازات بأمان؟", "SDS، storage، signage."], ["FMS-04", "هل توجد حقيبة طوارئ ومتابعة لصلاحيتها؟", "Emergency kit، checklist، expiry dates."]]]]}};
let currentType = "general";

function statusLabel(value){
  if(value==="1") return "متوفر";
  if(value==="0.5") return "جزئي";
  if(value==="0") return "غير متوفر";
  if(value==="na") return "غير منطبق";
  return "لم يتم التقييم";
}

function render(){
  const cfg = DATA[currentType];
  document.getElementById("assessmentTitle").textContent = cfg.title;
  document.getElementById("assessmentDesc").textContent = cfg.desc;
  const filter = document.getElementById("chapterFilter");
  filter.innerHTML = '<option value="all">كل الفصول</option>' + cfg.chapters.map(ch=>`<option value="${ch[0]}">${ch[0]} - ${ch[1]}</option>`).join("");
  renderQuestions();
  calculate();
}

function renderQuestions(){
  const cfg = DATA[currentType];
  const selected = document.getElementById("chapterFilter").value || "all";
  const container = document.getElementById("questions");
  container.innerHTML = "";
  cfg.chapters.filter(ch => selected==="all" || ch[0]===selected).forEach(ch=>{
    const el = document.createElement("section");
    el.className = "chapter";
    el.innerHTML = `<div class="chapter-head"><h3>${ch[0]} - ${ch[1]}</h3><span>${ch[2].length} بنود تقييم</span></div>` +
      ch[2].map(item=>`<div class="item" data-code="${item[0]}" data-title="${item[1]}">
        <div class="item-title"><b>${item[0]}: ${item[1]}</b><small>الأدلة المقترحة: ${item[2]}</small></div>
        <div class="status"><select onchange="calculate()"><option value="">اختر الحالة</option><option value="1">متوفر</option><option value="0.5">جزئي</option><option value="0">غير متوفر</option><option value="na">غير منطبق</option></select></div>
        <div class="evidence"><textarea placeholder="اكتب الملاحظات أو الأدلة المتوفرة..."></textarea></div>
      </div>`).join("");
    container.appendChild(el);
  });
}

function allItems(){ return [...document.querySelectorAll(".item")]; }

function calculate(){
  let total=0, max=0, yes=0, partial=0, no=0, na=0, answered=0;
  allItems().forEach(item=>{
    const val = item.querySelector("select").value;
    if(val==="na"){na++; return;}
    if(val!==""){
      answered++; max += 1; total += Number(val);
      if(val==="1") yes++;
      if(val==="0.5") partial++;
      if(val==="0") no++;
    } else { max += 1; }
  });
  const score = max ? Math.round((total/max)*100) : 0;
  document.getElementById("score").textContent = score + "%";
  document.getElementById("heroScore").textContent = score + "%";
  document.getElementById("bar").style.width = score + "%";
  document.getElementById("ring").style.background = `radial-gradient(circle,#fff 58%,transparent 59%), conic-gradient(var(--gold) ${score*3.6}deg,#eee4d2 0deg)`;
  document.getElementById("yesCount").textContent = yes;
  document.getElementById("partialCount").textContent = partial;
  document.getElementById("noCount").textContent = no;
  document.getElementById("naCount").textContent = na;
  const text = document.getElementById("readinessText");
  if(answered===0) text.textContent = "اختر نوع المنشأة وابدأ الإجابة على البنود.";
  else if(score>=85) text.textContent = "جاهزية عالية: ينصح بتنفيذ زيارة محاكاة قبل التقديم.";
  else if(score>=65) text.textContent = "جاهزية متوسطة: توجد فجوات تحتاج خطة تحسين واضحة.";
  else text.textContent = "جاهزية منخفضة: يوصى بمشروع تجهيز شامل قبل التقديم للاعتماد.";
}

function generateReport(){
  calculate();
  const score = document.getElementById("score").textContent;
  const cfg = DATA[currentType];
  const gaps = allItems().filter(item=>{
    const val = item.querySelector("select").value;
    return val==="0" || val==="0.5" || val==="";
  }).slice(0,25);
  const rec = parseInt(score) >= 85 ? "المنشأة قريبة من الجاهزية، وينصح بمراجعة الأدلة وتنفيذ Mock Survey." :
              parseInt(score) >= 65 ? "المنشأة تحتاج خطة تحسين مركزة لمدة 4-8 أسابيع للفجوات الرئيسية." :
              "المنشأة تحتاج مشروع تجهيز شامل يشمل السياسات، الأدلة، التدريب، والتدقيق الداخلي.";
  document.getElementById("reportContent").innerHTML = `<h3>${cfg.title}</h3>
    <div class="report-grid"><div><b>${score}</b><span>نسبة الجاهزية</span></div><div><b>${document.getElementById("yesCount").textContent}</b><span>متوفر</span></div><div><b>${document.getElementById("partialCount").textContent}</b><span>جزئي</span></div><div><b>${document.getElementById("noCount").textContent}</b><span>غير متوفر</span></div></div>
    <p><strong>التوصية العامة:</strong> ${rec}</p><h4>أبرز الفجوات:</h4>
    <div class="gap-list">${gaps.length ? gaps.map(item=>`<div><strong>${item.dataset.code}</strong> - ${item.dataset.title}<br><small>الحالة: ${statusLabel(item.querySelector("select").value)}</small></div>`).join("") : "<div>لا توجد فجوات ظاهرة ضمن البنود المعبأة.</div>"}</div>`;
  document.getElementById("report").scrollIntoView({behavior:"smooth"});
}

function resetAssessment(){
  document.querySelectorAll("select").forEach(s=>{ if(s.id!=="chapterFilter") s.value=""; });
  document.querySelectorAll("textarea").forEach(t=>t.value="");
  document.getElementById("reportContent").textContent = "لم يتم إصدار التقرير بعد.";
  calculate();
}

document.querySelectorAll(".facility").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".facility").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    currentType = btn.dataset.type;
    render();
  });
});
document.getElementById("chapterFilter").addEventListener("change", renderQuestions);
render();
