import CommonTable from "@/components/common/CommonTable";
import type { TableColumn } from "@/components/common/CommonTable";
// Note: This page is rendered inside the management layout, so no standalone Footer here
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import Pagination from "@/components/common/Pagination";
import { useEffect, useMemo, useMemo as useReactMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

// Hàm để extract tất cả các trường từ form data
function extractFormDataFields(formData: any): Record<string, string> {
  if (!formData) return {};
  try {
    const obj = typeof formData === "string" ? JSON.parse(formData) : formData;
    const fields: Record<string, string> = {};
    
    function walk(o: any, path: string[] = []) {
      if (o == null) return;
      if (typeof o !== "object") {
        const key = path.join(".");
        const value = String(o);
        if (value.trim()) {
          fields[key] = value;
        }
        return;
      }
      if (Array.isArray(o)) {
        o.forEach((v, i) => walk(v, [...path, String(i)]));
        return;
      }
      Object.entries(o).forEach(([kk, vv]) => walk(vv, [...path, kk]));
    }
    
    walk(obj);
    return fields;
  } catch {
    return {};
  }
}

// Mapping các trường phổ biến sang tên hiển thị tiếng Việt
const fieldDisplayNames: Record<string, string> = {
  // Số điện thoại
  "phone": "Số điện thoại",
  "sdt": "Số điện thoại", 
  "mobile": "Số điện thoại",
  "phoneNumber": "Số điện thoại",
  "contactPhone": "Số điện thoại liên lạc",
  "emergencyPhone": "Số điện thoại khẩn cấp",
  
  // Lý do tham gia
  "reason": "Lý do tham gia",
  "lydo": "Lý do tham gia",
  "motivation": "Động lực tham gia",
  
  // Tên (để hiển thị khi không có user_id)
  "ten": "Tên",
  "name": "Tên",
  "fullName": "Họ và tên",
  "hovaten": "Họ và tên",
  
  // Các trường khác sẽ tự động xuất hiện khi người dùng thay đổi form
  // Không cần định nghĩa trước để tránh hiển thị các cột không cần thiết
};

// Hàm để extract tên từ form data một cách chính xác
function extractNameFromFormData(formData: any): string {
  if (!formData) return "";
  try {
    const obj = typeof formData === "string" ? JSON.parse(formData) : formData;
    
    // Danh sách các trường có thể chứa tên (ưu tiên cao đến thấp)
    const nameFields = ["fullName", "name", "hovaten", "ten", "hoTen", "full_name"];
    
    // Tìm exact match trước
    for (const field of nameFields) {
      if (obj[field] && typeof obj[field] === "string" && obj[field].trim()) {
        return obj[field].trim();
      }
    }
    
    // Tìm case-insensitive match
    for (const field of nameFields) {
      const foundKey = Object.keys(obj).find(key => 
        key.toLowerCase() === field.toLowerCase()
      );
      if (foundKey && obj[foundKey] && typeof obj[foundKey] === "string" && obj[foundKey].trim()) {
        return obj[foundKey].trim();
      }
    }
    
    // Loại bỏ các trường không phải tên
    const excludeFields = ["club", "clb", "team", "competition", "reason", "lydo", "phone", "sdt", "mobile", "email", "mail", "studentCode", "mssv", "msv"];
    
    // Tìm trường có vẻ giống tên (có khoảng trắng, độ dài hợp lý, không phải email/phone)
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" && value.trim()) {
        const lowerKey = key.toLowerCase();
        const lowerValue = value.trim().toLowerCase();
        
        // Loại bỏ các trường không phải tên
        if (excludeFields.some(exclude => lowerKey.includes(exclude) || lowerValue.includes(exclude))) {
          continue;
        }
        
        // Kiểm tra nếu có vẻ giống tên (có khoảng trắng, độ dài 5-50 ký tự, không phải email/phone)
        if (/\s/.test(value.trim()) && 
            value.trim().length >= 5 && 
            value.trim().length <= 50 &&
            !/\b[\w.+-]+@\w+\.[\w.-]+\b/.test(value.trim()) &&
            !/\b(0|\+84)?[\d\s.-]{8,14}\b/.test(value.trim())) {
          return value.trim();
        }
      }
    }
    
    return "";
  } catch {
    return "";
  }
}

// Hàm để lấy tên hiển thị cho một trường
function getFieldDisplayName(fieldKey: string): string {
  const lowerKey = fieldKey.toLowerCase();
  
  // Tìm exact match trước
  if (fieldDisplayNames[lowerKey]) {
    return fieldDisplayNames[lowerKey];
  }
  
  // Tìm partial match
  for (const [key, displayName] of Object.entries(fieldDisplayNames)) {
    if (lowerKey.includes(key) || key.includes(lowerKey)) {
      return displayName;
    }
  }
  
  // Nếu không tìm thấy, format key thành tên hiển thị
  return fieldKey
    .split(/[._-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type SubmittedRow = {
  id: string;
  submittedAt: string;
  fullName: string;
  email: string;
  studentCode: string;
  phone: string;
  note: string;
  stt?: number;
  formData?: any;
  [key: string]: any; // Cho phép các trường động từ form data
};

export default function SubmittedFormsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SubmittedRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState<number>(1); // CommonTable is 1-based
  const [pageSize] = useState<number>(10); // fixed page size
  const [totalElements, setTotalElements] = useState<number>(0);
  const [viewingRow, setViewingRow] = useState<SubmittedRow | null>(null);
  
  // Filters
  const [status, setStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  // Search
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get<{
          content: any[];
          page: number;
          size: number;
          totalElements: number;
        }>("/v1/submitted-forms", {
          // fixed form type: club registration
          type: "CLUB_REGISTRATION",
          page: page - 1,
          size: pageSize,
          sortBy: "createdAt",
          sortDirection: "desc",
          status: status || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          search: query || undefined,
        });
        if (!ignore) {
          const mapped: SubmittedRow[] = (res.data?.content ?? []).map((s: any, idx: number) => {
            const emailFromUser = s.userPersonalMail || s.userEduMail || "";
            const codeFromUser = s.userStudentCode || "";
            const nameFromUser = s.userFullName || "";
            const phoneFromForm = s.formData ? safePick(s.formData, ["phone", "sdt", "mobile"]) : "";
            
            // Extract tất cả các trường từ form data
            const formFields = extractFormDataFields(s.formData);
            
            // Logic ưu tiên tên: 1) Từ bảng user nếu có user_id, 2) Từ form_data nếu không có user_id
            let finalName = "";
            if (s.userId && nameFromUser) {
              // Có user_id và có tên từ bảng user
              finalName = nameFromUser;
            } else {
              // Không có user_id hoặc không có tên từ bảng user, lấy từ form_data
              finalName = s.formData ? extractNameFromFormData(s.formData) : "";
            }
            
            return {
              id: String(s.id ?? idx),
              submittedAt: s.createdAt ?? "",
              fullName: finalName,
              email: emailFromUser || (s.formData ? safePick(s.formData, ["email", "mail"]) : ""),
              studentCode: codeFromUser || (s.formData ? safePick(s.formData, ["studentCode", "mssv", "msv"]) : ""),
              phone: phoneFromForm,
              note: s.reviewerNote ?? "",
              formData: s.formData,
              ...formFields, // Spread tất cả các trường form data vào row
            } as SubmittedRow;
          });
          setRows(mapped);
          setTotalElements(res.data?.totalElements ?? mapped.length);
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || "Không tải được dữ liệu");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchData();
    return () => {
      ignore = true;
    };
  }, [page, pageSize, status, dateFrom, dateTo, query]);

  function safePick(jsonString: string, keys: string[]): string {
    try {
      const obj =
        typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
      for (const k of keys) {
        // try exact
        if (obj && obj[k] != null) return String(obj[k]);
        // try case-insensitive
        const found = Object.keys(obj ?? {}).find(
          (kk) => kk.toLowerCase() === k.toLowerCase()
        );
        if (found && obj[found] != null) return String(obj[found]);
      }
      // try deep/heuristic extraction
      const entries: Array<{ key: string; value: any }> = [];
      function walk(o: any, path: string[] = []) {
        if (o == null) return;
        if (typeof o !== "object") {
          entries.push({ key: path.join("."), value: o });
          return;
        }
        if (Array.isArray(o)) {
          o.forEach((v, i) => walk(v, [...path, String(i)]));
          return;
        }
        Object.entries(o).forEach(([kk, vv]) => walk(vv, [...path, kk]));
      }
      walk(obj);

      const emailRegex = /\b[\w.+-]+@\w+\.[\w.-]+\b/i;
      const phoneRegex = /\b(0|\+84)?[\d\s.-]{8,14}\b/;
      const mssvRegex = /\b(HE|SE|SS|SP)?\d{6,8}\b/i;

      const findBy = (pred: (s: string) => boolean, keyHint?: RegExp) => {
        // prioritize keys that hint
        const prioritized = keyHint
          ? entries.filter((e) => keyHint.test(e.key.toLowerCase()))
          : entries;
        const arr = [...prioritized, ...entries];
        for (const e of arr) {
          const s = String(e.value ?? "");
          if (pred(s)) return s;
        }
        return "";
      };

      const email = findBy((s) => emailRegex.test(s), /(email|mail)/i);
      const phone = findBy(
        (s) => phoneRegex.test(s),
        /(phone|sdt|mobile|contact)/i
      );
      const mssv = findBy((s) => mssvRegex.test(s), /(mssv|student|code|msv)/i);
      const name = findBy(
        (s) => /\s/.test(s) && s.length >= 5 && !emailRegex.test(s),
        /(name|hovaten|full|ho|ten)/i
      );

      const map: Record<string, string> = {
        fullName: name,
        email: email,
        studentCode: mssv,
        phone: phone,
      };

      for (const k of keys) {
        if (map[k] && map[k].length > 0) return map[k];
      }
    } catch (_) {}
    return "";
  }

  const columns: TableColumn<SubmittedRow>[] = useMemo(() => {
    const formatDate = (v?: string) => {
      if (!v) return "";
      try {
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return v;
        return d.toLocaleDateString("vi-VN");
      } catch {
        return v;
      }
    };

    // Lấy các trường form data được định nghĩa trong fieldDisplayNames
    const allowedFormFields = new Set<string>();
    rows.forEach(row => {
      const formFields = extractFormDataFields(row.formData);
      Object.keys(formFields).forEach(key => {
        const lowerKey = key.toLowerCase();
        // Loại bỏ các trường tên vì đã hiển thị trong cột "Họ và tên"
        const isNameField = ["fullName", "name", "hovaten", "ten"].includes(lowerKey);
        if (!isNameField) {
          // Chỉ hiển thị các trường được định nghĩa trong fieldDisplayNames
          if (Object.keys(fieldDisplayNames).some(definedKey => 
            definedKey.toLowerCase() === lowerKey || 
            lowerKey.includes(definedKey.toLowerCase()) ||
            definedKey.toLowerCase().includes(lowerKey)
          )) {
            allowedFormFields.add(key);
          }
        }
      });
    });

    // Tạo cột cho các trường form data được phép
    const formDataColumns: TableColumn<SubmittedRow>[] = Array.from(allowedFormFields)
      .map(fieldKey => ({
        key: fieldKey,
        title: getFieldDisplayName(fieldKey),
        render: (row: SubmittedRow) => row[fieldKey] || "",
        className: "max-w-xs",
      }));

    return [
      {
        key: "stt",
        title: "STT",
        render: (row: SubmittedRow) => row.stt,
        sortable: false,
        className: "w-16 text-center",
      },
      {
        key: "submittedAt",
        title: "Thời gian nộp",
        sortable: true,
        render: (r) => formatDate(r.submittedAt),
      },
      { key: "fullName", title: "Họ và tên", sortable: true },
      { key: "email", title: "Email", sortable: true },
      { key: "studentCode", title: "MSSV", sortable: true },
      { key: "note", title: "Mô tả ngắn về bản thân" },
      ...formDataColumns, // Thêm các cột form data động (bao gồm số điện thoại)
      {
        key: "actions",
        title: "Thao tác",
        sortable: false,
        className: "w-32",
        render: (row: SubmittedRow) => (
          <button
            type="button"
            aria-label={`Xem form #${row.id}`}
            onClick={() => setViewingRow(row)}
            className="inline-flex items-center gap-1 rounded-md bg-[#2563eb] px-3 py-1.5 text-[12px] font-medium text-white shadow hover:bg-[#1e4fd9] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 5c-5 0-9 5-9 7s4 7 9 7 9-5 9-7-4-7-9-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
            </svg>
            Xem form
          </button>
        ),
      },
    ];
  }, [rows]);

  const filtered = useReactMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => {
      // Lấy tất cả các giá trị từ row để search
      const searchableValues = [
        r.fullName, 
        r.email, 
        r.studentCode, 
        r.note,
        ...Object.values(r).filter(v => typeof v === 'string' && v.trim())
      ];
      
      return searchableValues
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, query]);

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            ⟵ Quay lại
          </button>
          <button
            onClick={() => exportCsv(filtered)}
            className="rounded-md bg-emerald-500 px-3 py-2 text-[13px] font-medium text-white shadow hover:bg-emerald-600"
          >
            Xuất Excel
          </button>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Kết quả đăng ký</h2>
          <p className="text-gray-600">Đăng kí tham gia FPTU Vovinam Club FALL 2025</p>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{totalElements}</div>
            <div className="text-sm text-gray-600">Tổng số đăng ký</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{filtered.length}</div>
            <div className="text-sm text-gray-600">Kết quả hiển thị</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{page}</div>
            <div className="text-sm text-gray-600">Trang hiện tại</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Bộ lọc</h3>
            <button
              onClick={() => { setStatus(""); setDateFrom(""); setDateTo(""); setQuery(""); setPage(1); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => { setPage(1); setStatus(e.target.value); }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Đang chờ</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setPage(1); setDateFrom(e.target.value); }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setPage(1); setDateTo(e.target.value); }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
              <input
                placeholder="Tên, email, MSSV..."
                value={query}
                onChange={(e) => { setPage(1); setQuery(e.target.value); }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
              />
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Hiển thị {filtered.length} trong {totalElements} kết quả
          </div>
        </div>

        {error && <ErrorMessage error={error} />}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <CommonTable
            data={
              filtered.map((r, idx) => ({
                ...r,
                stt: (page - 1) * pageSize + idx + 1,
              })) as any
            }
            columns={columns as any}
            page={page}
            pageSize={pageSize}
            total={totalElements}
            onPageChange={(p) => setPage(p)}
          />
        )}

      {/* View Form Modal */}
      {viewingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Chi tiết form đăng ký #{viewingRow.id}
              </h3>
              <button 
                onClick={() => setViewingRow(null)} 
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="max-h-[70vh] overflow-auto p-6">
              {/* Basic Information */}
              <div className="mb-6">
                <h4 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Thông tin cơ bản
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-md bg-gray-50 p-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Họ và tên</div>
                    <div className="mt-1 text-sm text-gray-900">{viewingRow.fullName || "-"}</div>
                  </div>
                  <div className="rounded-md bg-gray-50 p-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</div>
                    <div className="mt-1 text-sm text-gray-900">{viewingRow.email || "-"}</div>
                  </div>
                  <div className="rounded-md bg-gray-50 p-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">MSSV</div>
                    <div className="mt-1 text-sm text-gray-900">{viewingRow.studentCode || "-"}</div>
                  </div>
                  <div className="rounded-md bg-gray-50 p-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Thời gian nộp</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {new Date(viewingRow.submittedAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Data */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Dữ liệu form
                </h4>
                <div className="rounded-md bg-gray-50 p-4">
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-800">
{typeof viewingRow.formData === 'string' ? viewingRow.formData : JSON.stringify(viewingRow.formData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button 
                onClick={() => setViewingRow(null)} 
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function exportCsv(rows: SubmittedRow[]) {
  if (!rows || rows.length === 0) {
    alert("Không có dữ liệu để xuất");
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
        // Chỉ export các trường được định nghĩa trong fieldDisplayNames
        if (Object.keys(fieldDisplayNames).some(definedKey => 
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

  const formatDate = (v?: string) => {
    if (!v) return "";
    try {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return v;
      return d.toLocaleDateString("vi-VN");
    } catch {
      return v;
    }
  };

  const csvRows = rows.map((r, i) => [
    String(i + 1),
    formatDate(r.submittedAt),
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

function escapeCsv(value?: string) {
  const s = value ?? "";
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
