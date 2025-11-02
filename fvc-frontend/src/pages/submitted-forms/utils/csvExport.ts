import type { SubmittedRow } from "../types";
import { extractFormDataFields, getFieldDisplayName } from "./formDataUtils";
import { FIELD_DISPLAY_NAMES } from "../constants";

/**
 * Escape value cho CSV format
 */
function escapeCsv(value?: string): string {
  const s = value ?? "";
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * Format date cho CSV - dd/MM/yyyy
 */
function formatDateForCsv(v?: string): string {
  if (!v) return "";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return v;
  }
}

/**
 * Export submitted forms ra CSV
 */
export function exportSubmittedFormsToCsv(rows: SubmittedRow[]): void {
  if (!rows || rows.length === 0) {
    console.warn("Không có dữ liệu để xuất");
    return;
  }
  
  // Lấy các trường form data được phép từ dữ liệu
  const allowedFormFields = new Set<string>();
  rows.forEach(row => {
    const formFields = extractFormDataFields(row.formData);
    Object.keys(formFields).forEach(key => {
      const lowerKey = key.toLowerCase();
      // Loại bỏ các trường tên vì đã có trong cột "Họ và tên"
      const isNameField = ["fullName", "name", "hovaten", "ten"].includes(lowerKey);
      if (!isNameField) {
        // Chỉ export các trường được định nghĩa trong FIELD_DISPLAY_NAMES
        if (Object.keys(FIELD_DISPLAY_NAMES).some(definedKey => 
          definedKey.toLowerCase() === lowerKey || 
          lowerKey.includes(definedKey.toLowerCase()) ||
          definedKey.toLowerCase().includes(lowerKey)
        )) {
          allowedFormFields.add(key);
        }
      }
    });
  });

  const headers = [
    "STT",
    "Thời gian nộp",
    "Họ và tên",
    "Email",
    "MSSV",
    "Mô tả ngắn về bản thân",
    ...Array.from(allowedFormFields).map(fieldKey => getFieldDisplayName(fieldKey)),
  ];

  const csvRows = rows.map((r, i) => [
    String(i + 1),
    formatDateForCsv(r.submittedAt),
    escapeCsv(r.fullName),
    escapeCsv(r.email),
    escapeCsv(r.studentCode),
    escapeCsv(r.note),
    ...Array.from(allowedFormFields).map(fieldKey => escapeCsv(r[fieldKey] || "")),
  ]);

  const csv = [
    headers.join(","),
    ...csvRows.map((line) => line.join(",")),
  ].join("\r\n");

  // Add BOM for UTF-8 to display Vietnamese correctly in Excel
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `submitted-forms-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

