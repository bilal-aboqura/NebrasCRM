"use client";

import { useState, useEffect } from "react";
import { getFacilitiesList } from "@/lib/actions/facilities";
import type { Facility } from "@/lib/types/domain";
import { Building2, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface FacilitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (facilityId: string) => Promise<void>;
  isSaving: boolean;
  error?: string | null;
}

export default function FacilitySelector({ isOpen, onClose, onSelect, isSaving, error }: FacilitySelectorProps) {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFacilities();
    }
  }, [isOpen]);

  const loadFacilities = async () => {
    setIsLoading(true);
    try {
      // Assuming context handles getting the right facilities
      const result = await getFacilitiesList({ pageSize: 100 });
      setFacilities(result.rows);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedId) return;
    await onSelect(selectedId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="text-nebras-green" />
            ربط التقييم بمنشأة
          </h2>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <p className="mb-4 text-sm text-gray-600">
            الرجاء اختيار المنشأة التي ترغب في حفظ التقييم الذاتي لها:
          </p>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-nebras-green" size={32} />
            </div>
          ) : facilities.length === 0 ? (
            <div className="rounded-lg border border-gray-200 border-dashed p-8 text-center text-gray-500">
              <p>لا توجد منشآت متاحة.</p>
              <p className="text-xs mt-2">يرجى إضافة منشأة أولاً قبل حفظ التقييم.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {facilities.map((fac) => (
                <button
                  key={fac.id}
                  onClick={() => setSelectedId(fac.id)}
                  disabled={isSaving}
                  className={`w-full flex items-center justify-between rounded-xl border p-4 transition-all text-right ${
                    selectedId === fac.id 
                      ? "border-nebras-green bg-green-50 shadow-sm" 
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div>
                    <h3 className={`font-bold ${selectedId === fac.id ? "text-nebras-green" : "text-gray-800"}`}>
                      {fac.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{fac.city} - {fac.type}</p>
                  </div>
                  {selectedId === fac.id && (
                    <CheckCircle className="text-nebras-green" size={24} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 bg-gray-50 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId || isSaving}
            className="px-6 py-2 rounded-lg font-bold bg-nebras-green text-white hover:bg-[#208f60] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            حفظ التقييم
          </button>
        </div>
      </div>
    </div>
  );
}
