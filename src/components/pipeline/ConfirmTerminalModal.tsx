'use client';

import { useState } from 'react';

const LOST_REASONS = [
  { value: 'price', label: 'السعر' },
  { value: 'competitor', label: 'المنافس' },
  { value: 'no_response', label: 'عدم الرد' },
  { value: 'not_interested', label: 'غير مهتم' },
  { value: 'other', label: 'أخرى' },
];

interface ConfirmTerminalModalProps {
  newStatus: string;
  onConfirm: (lostReason?: string) => void;
  onCancel: () => void;
}

export function ConfirmTerminalModal({ newStatus, onConfirm, onCancel }: ConfirmTerminalModalProps) {
  const [lostReason, setLostReason] = useState('');
  const [error, setError] = useState('');

  const isLost = newStatus === 'lost';

  const handleConfirm = () => {
    if (isLost && !lostReason) {
      setError('يرجى اختيار سبب الاستبعاد');
      return;
    }
    onConfirm(isLost ? lostReason : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {isLost ? 'تأكيد استبعاد المنشأة' : 'تأكيد التعاقد'}
        </h2>

        <p className="mb-4 text-sm text-gray-600">
          {isLost
            ? 'هل أنت متأكد من نقل المنشأة إلى مرحلة خاسرة؟'
            : 'هل أنت متأكد من نقل المنشأة إلى مرحلة تعاقد؟'}
        </p>

        {isLost && (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">سبب الاستبعاد *</label>
            <div className="space-y-2">
              {LOST_REASONS.map((reason) => (
                <label key={reason.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="lostReason"
                    value={reason.value}
                    checked={lostReason === reason.value}
                    onChange={(e) => setLostReason(e.target.value)}
                    className="text-emerald-600"
                  />
                  <span className="text-sm text-gray-700">{reason.label}</span>
                </label>
              ))}
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            تأكيد
          </button>
          <button
            onClick={onCancel}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
