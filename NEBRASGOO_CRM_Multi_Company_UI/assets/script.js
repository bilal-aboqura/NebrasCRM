document.querySelectorAll('.nav a').forEach((a)=>{
  a.addEventListener('click',()=>{
    document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
  });
});

document.querySelectorAll('button').forEach((btn)=>{
  btn.addEventListener('click',()=>{
    const text = btn.textContent.trim();
    if(text.includes('إضافة') || text.includes('سجل جديد')){
      alert('سيظهر هنا نموذج إضافة مجمع طبي جديد في النسخة البرمجية.');
    }
    if(text.includes('استيراد')){
      alert('سيتم ربط هذه الخاصية باستيراد ملفات Excel.');
    }
    if(text.includes('تصدير')){
      alert('سيتم تصدير التقرير بصيغة Excel أو PDF.');
    }
  });
});

const companySelect = document.getElementById('companySelect');
if(companySelect){
  companySelect.addEventListener('change', function(){
    const name = this.value === 'nebras' ? 'شركة نبراس الجودة' : 'شركة تقنية الارتقاء';
    alert('تم اختيار: ' + name + '\nفي النسخة البرمجية سيتم عرض العملاء والعروض الخاصة بهذه الشركة فقط.');
  });
}
