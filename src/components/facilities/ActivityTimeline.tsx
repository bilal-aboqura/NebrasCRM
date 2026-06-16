interface Activity {
  id: string
  event_type: string
  old_value: string | null
  new_value: string | null
  created_at: string
  actor: { display_name: string; email: string } | null
}

const eventLabels: Record<string, string> = {
  created: 'تم الإنشاء',
  edited: 'تم التعديل',
  status_change: 'تغيير الحالة',
  owner_change: 'تغيير المسؤول',
  archived: 'تم الأرشفة',
  recovered: 'تم الاستعادة',
}

export default function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="rounded-card border border-line bg-surface p-6 text-center shadow-soft">
        <p className="font-tajawal text-sm text-muted">لا يوجد نشاط بعد</p>
      </div>
    )
  }

  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-soft">
      <h3 className="mb-4 font-tajawal text-lg font-700 text-green-900">سجل النشاط</h3>
      <div className="space-y-4">
        {activities.map(a => (
          <div key={a.id} className="flex gap-3">
            <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-gold-500" />
            <div>
              <p className="font-tajawal text-sm font-700 text-text">
                {eventLabels[a.event_type] || a.event_type}
              </p>
              <p className="font-tajawal text-xs text-muted">
                {a.actor?.display_name || a.actor?.email || 'غير معروف'}
                {' · '}
                {new Date(a.created_at).toLocaleDateString('ar-SA', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </p>
              {a.old_value && a.new_value && (
                <p className="mt-1 font-tajawal text-xs text-muted">
                  من: {a.old_value} ← إلى: {a.new_value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
