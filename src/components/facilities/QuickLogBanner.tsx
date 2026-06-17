"use client";

import { useEffect, useState } from "react";

export default function QuickLogBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onFocus = () => setVisible(Boolean(localStorage.getItem("nebras_pending_log")));
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed bottom-4 left-4 z-40 rounded-lg border border-nebras-line bg-white p-4 shadow-lg">
      <p className="font-semibold text-nebras-green">هل تريد تسجيل نتيجة التواصل؟</p>
      <div className="mt-3 flex gap-2">
        <button className="rounded-md bg-nebras-green px-3 py-2 text-sm text-white">حفظ</button>
        <button className="rounded-md border border-nebras-line px-3 py-2 text-sm" onClick={() => setVisible(false)}>تجاهل</button>
      </div>
    </div>
  );
}
