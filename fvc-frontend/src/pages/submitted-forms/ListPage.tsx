import CommonTable from "@/components/common/CommonTable";
import type { TableColumn } from "@/components/common/CommonTable";
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
  
  // Địa chỉ
  "address": "Địa chỉ",
  "diachi": "Địa chỉ",
  "homeAddress": "Địa chỉ nhà",
  "currentAddress": "Địa chỉ hiện tại",
  
  // Ngày sinh
  "birthday": "Ngày sinh",
  "dateOfBirth": "Ngày sinh",
  "ngaysinh": "Ngày sinh",
  
  // Giới tính
  "gender": "Giới tính",
  "gioitinh": "Giới tính",
  
  // Lớp/Khoa
  "class": "Lớp",
  "lop": "Lớp",
  "major": "Chuyên ngành",
  "chuyennganh": "Chuyên ngành",
  "faculty": "Khoa",
  "khoa": "Khoa",
  
  // Kinh nghiệm
  "experience": "Kinh nghiệm",
  "kinhnghiem": "Kinh nghiệm",
  "vovinamExperience": "Kinh nghiệm Vovinam",
  
  // Lý do tham gia
  "reason": "Lý do tham gia",
  "lydo": "Lý do tham gia",
  "motivation": "Động lực tham gia",
  
  // Mục tiêu
  "goal": "Mục tiêu",
  "muctieu": "Mục tiêu",
  "objectives": "Mục tiêu",
  
  // Thời gian rảnh
  "freeTime": "Thời gian rảnh",
  "thoigianranh": "Thời gian rảnh",
  "availableTime": "Thời gian có thể tham gia",
  
  // Sở thích
  "hobby": "Sở thích",
  "sothich": "Sở thích",
  "interests": "Sở thích",
  
  // Thông tin khác
  "other": "Thông tin khác",
  "khac": "Thông tin khác",
  "additional": "Thông tin bổ sung",
  "note": "Ghi chú",
  "ghichu": "Ghi chú",
};

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
        }>("/submitted-forms", {
          type: "CLUB_REGISTRATION",
          page: page - 1,
          size: pageSize,
          sortBy: "createdAt",
          ascending: false,
        });
        if (!ignore) {
          const mapped: SubmittedRow[] = (res.data?.content ?? []).map((s: any, idx: number) => {
            const emailFromUser = s.userPersonalMail || s.userEduMail || "";
            const codeFromUser = s.userStudentCode || "";
            const nameFromUser = s.userFullName || "";
            const phoneFromForm = s.formData ? safePick(s.formData, ["phone", "sdt", "mobile"]) : "";
            
            // Extract tất cả các trường từ form data
            const formFields = extractFormDataFields(s.formData);
            
            return {
              id: String(s.id ?? idx),
              submittedAt: s.createdAt ?? "",
              fullName: nameFromUser || (s.formData ? safePick(s.formData, ["fullName", "name", "hovaten"]) : ""),
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
  }, [page, pageSize]);

  function safePick(jsonString: string, keys: string[]): string {
    try {
      const obj = typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
      for (const k of keys) {
        // try exact
        if (obj && obj[k] != null) return String(obj[k]);
        // try case-insensitive
        const found = Object.keys(obj ?? {}).find((kk) => kk.toLowerCase() === k.toLowerCase());
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
      const phone = findBy((s) => phoneRegex.test(s), /(phone|sdt|mobile|contact)/i);
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

    // Lấy tất cả các trường form data từ dữ liệu hiện tại
    const allFormFields = new Set<string>();
    rows.forEach(row => {
      const formFields = extractFormDataFields(row.formData);
      Object.keys(formFields).forEach(key => {
        // Loại bỏ các trường đã có cột riêng
        if (!["fullName", "name", "hovaten", "email", "mail", "studentCode", "mssv", "msv", "phone", "sdt", "mobile"].includes(key.toLowerCase())) {
          allFormFields.add(key);
        }
      });
    });

    // Tạo cột cho các trường form data phổ biến
    const formDataColumns: TableColumn<SubmittedRow>[] = Array.from(allFormFields)
      .slice(0, 5) // Chỉ hiển thị tối đa 5 cột form data để tránh bảng quá rộng
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
      { key: "submittedAt", title: "Thời gian nộp", sortable: true, render: (r) => formatDate(r.submittedAt) },
      { key: "fullName", title: "Họ và tên", sortable: true },
      { key: "email", title: "Email", sortable: true },
      { key: "studentCode", title: "MSSV", sortable: true },
      { key: "phone", title: "SDT liên lạc", sortable: true },
      { key: "note", title: "Mô tả ngắn về bản thân" },
      ...formDataColumns, // Thêm các cột form data động
    ];
  }, [rows]);

  // Search
  const [query, setQuery] = useState<string>("");
  const filtered = useReactMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => {
      // Lấy tất cả các giá trị từ row để search
      const searchableValues = [
        r.fullName, 
        r.email, 
        r.studentCode, 
        r.phone, 
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

      <div>
        <h2 className="mb-1 text-xl font-semibold">Kết quả</h2>
        <p className="mb-4 text-sm text-gray-600">
          Đăng kí tham gia FPTU Vovinam Club FALL 2025
        </p>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">Lượt điền: {totalElements}</div>
          <input
            placeholder="Tìm kiếm..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <CommonTable
        data={filtered.map((r, idx) => ({ ...r, stt: (page - 1) * pageSize + idx + 1 })) as any}
        columns={columns as any}
        page={page}
        pageSize={pageSize}
        total={totalElements}
        onPageChange={(p) => setPage(p)}
        className={loading ? "opacity-60" : undefined}
      />
    </div>
  );
}

function exportCsv(rows: SubmittedRow[]) {
  if (!rows || rows.length === 0) {
    alert("Không có dữ liệu để xuất");
    return;
  }
  
  // Lấy tất cả các trường form data từ dữ liệu
  const allFormFields = new Set<string>();
  rows.forEach(row => {
    const formFields = extractFormDataFields(row.formData);
    Object.keys(formFields).forEach(key => {
      if (!["fullName", "name", "hovaten", "email", "mail", "studentCode", "mssv", "msv", "phone", "sdt", "mobile"].includes(key.toLowerCase())) {
        allFormFields.add(key);
      }
    });
  });

  const headers = [
    "STT",
    "Thời gian nộp",
    "Họ và tên",
    "Email",
    "MSSV",
    "SDT liên lạc",
    "Mô tả ngắn về bản thân",
    ...Array.from(allFormFields).map(fieldKey => getFieldDisplayName(fieldKey)),
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
    escapeCsv(r.phone),
    escapeCsv(r.note),
    ...Array.from(allFormFields).map(fieldKey => escapeCsv(r[fieldKey] || "")),
  ]);

  const csv = [headers.join(","), ...csvRows.map((line) => line.join(","))].join("\r\n");

  // Add BOM for UTF-8 to display Vietnamese correctly in Excel
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `submitted-forms-${new Date().toISOString().slice(0,10)}.csv`;
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


