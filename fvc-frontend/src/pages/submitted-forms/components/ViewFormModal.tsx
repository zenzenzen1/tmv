import React from "react";
import type { SubmittedRow } from "../types";
import { extractApplicantInfo, extractFormDataFields, getFieldDisplayName } from "../utils/formDataUtils";

interface ViewFormModalProps {
  row: SubmittedRow;
  onClose: () => void;
}

export default function ViewFormModal({ row, onClose }: ViewFormModalProps) {
  const formatDate = (v?: string) => {
    if (!v) return "-";
    try {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return v;
      // Format: dd/MM/yyyy HH:mm
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return v;
    }
  };

  const infoFields = extractApplicantInfo(row.formData);
  const formFields = extractFormDataFields(row.formData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Chi tiết form đăng ký #{row.id}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{row.formName || "Không xác định"}</p>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="max-h-[75vh] overflow-y-auto p-6">
          {/* Basic Information */}
          <div className="mb-6">
            <h4 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
              Thông tin cơ bản
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Họ và tên</div>
                <div className="text-sm font-semibold text-gray-900">{row.fullName || "-"}</div>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Email</div>
                <div className="text-sm text-gray-900 break-all">{row.email || "-"}</div>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">MSSV</div>
                <div className="text-sm font-medium text-gray-900">{row.studentCode || "-"}</div>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Thời gian nộp</div>
                <div className="text-sm text-gray-900">{formatDate(row.submittedAt)}</div>
              </div>
            </div>
          </div>

          {/* Note/Mô tả */}
          {row.note && (
            <div className="mb-6">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
                Mô tả ngắn về bản thân
              </h4>
              <div className="rounded-lg bg-amber-50 p-4 border border-amber-100">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{row.note}</p>
              </div>
            </div>
          )}

          {/* Form Data - Thông tin người đăng ký */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
              Thông tin bổ sung từ form
            </h4>
            {infoFields.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-6 text-center border border-gray-200">
                <p className="text-sm text-gray-500">Không có thông tin bổ sung</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {infoFields.map((field) => (
                  <div key={field.key} className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      {field.label}
                    </div>
                    <div className="text-sm text-gray-900 break-words">{field.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Form Fields (nếu có thêm fields khác) */}
          {Object.keys(formFields).length > infoFields.length && (
            <div className="mt-6">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
                Các trường khác
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(formFields)
                  .filter(([key]) => !infoFields.some(f => f.key === key))
                  .map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                        {getFieldDisplayName(key)}
                      </div>
                      <div className="text-sm text-gray-900 break-words">{String(value)}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4 bg-gray-50">
          <button 
            onClick={onClose} 
            className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

