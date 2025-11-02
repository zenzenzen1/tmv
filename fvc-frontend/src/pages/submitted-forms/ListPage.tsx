import CommonTable from "@/components/common/CommonTable";
import type { TableColumn } from "@/components/common/CommonTable";
// Note: This page is rendered inside the management layout, so no standalone Footer here
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ErrorMessage from "@/components/common/ErrorMessage";
import Pagination from "@/components/common/Pagination";
import { useEffect, useMemo, useMemo as useReactMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { API_ENDPOINTS } from "@/config/endpoints";
import { useToast } from "@/components/common/ToastContext";

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
  phone: "Số điện thoại",
  sdt: "Số điện thoại",
  mobile: "Số điện thoại",
  phoneNumber: "Số điện thoại",
  contactPhone: "Số điện thoại liên lạc",
  emergencyPhone: "Số điện thoại khẩn cấp",

  // Lý do tham gia
  reason: "Lý do tham gia",
  lydo: "Lý do tham gia",
  motivation: "Động lực tham gia",

  // Tên (để hiển thị khi không có user_id)
  ten: "Tên",
  name: "Tên",
  fullName: "Họ và tên",
  hovaten: "Họ và tên",

  // Giới tính
  gender: "Giới tính",
  gioitinh: "Giới tính",

  // Câu lạc bộ
  club: "Câu lạc bộ",
  clb: "Câu lạc bộ",

  // MSSV
  studentId: "MSSV",
  mssv: "MSSV",
  msv: "MSSV",

  // Email
  email: "Email",
  mail: "Email",

  // Field "Mày" từ form
  may: "Mày",

  // Các trường khác sẽ tự động xuất hiện khi người dùng thay đổi form
  // Không cần định nghĩa trước để tránh hiển thị các cột không cần thiết
};

// Hàm để extract tên từ form data một cách chính xác
function extractNameFromFormData(formData: any): string {
  if (!formData) return "";
  try {
    const obj = typeof formData === "string" ? JSON.parse(formData) : formData;

    // Danh sách các trường có thể chứa tên (ưu tiên cao đến thấp)
    const nameFields = [
      "fullName",
      "name",
      "hovaten",
      "ten",
      "hoTen",
      "full_name",
    ];

    // Tìm exact match trước
    for (const field of nameFields) {
      if (obj[field] && typeof obj[field] === "string" && obj[field].trim()) {
        return obj[field].trim();
      }
    }

    // Tìm case-insensitive match
    for (const field of nameFields) {
      const foundKey = Object.keys(obj).find(
        (key) => key.toLowerCase() === field.toLowerCase()
      );
      if (
        foundKey &&
        obj[foundKey] &&
        typeof obj[foundKey] === "string" &&
        obj[foundKey].trim()
      ) {
        return obj[foundKey].trim();
      }
    }

    // Loại bỏ các trường không phải tên
    const excludeFields = [
      "club",
      "clb",
      "team",
      "competition",
      "reason",
      "lydo",
      "phone",
      "sdt",
      "mobile",
      "email",
      "mail",
      "studentCode",
      "mssv",
      "msv",
    ];

    // Tìm trường có vẻ giống tên (có khoảng trắng, độ dài hợp lý, không phải email/phone)
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" && value.trim()) {
        const lowerKey = key.toLowerCase();
        const lowerValue = value.trim().toLowerCase();

        // Loại bỏ các trường không phải tên
        if (
          excludeFields.some(
            (exclude) =>
              lowerKey.includes(exclude) || lowerValue.includes(exclude)
          )
        ) {
          continue;
        }

        // Kiểm tra nếu có vẻ giống tên (có khoảng trắng, độ dài 5-50 ký tự, không phải email/phone)
        if (
          /\s/.test(value.trim()) &&
          value.trim().length >= 5 &&
          value.trim().length <= 50 &&
          !/\b[\w.+-]+@\w+\.[\w.-]+\b/.test(value.trim()) &&
          !/\b(0|\+84)?[\d\s.-]{8,14}\b/.test(value.trim())
        ) {
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
function getFieldDisplayName(fieldKey: string, formDefinition?: any): string {
  const lowerKey = fieldKey.toLowerCase();

  // Nếu có form definition, tìm field title từ form definition
  if (formDefinition && formDefinition.fields) {
    try {
      const formFields = formDefinition.fields;

      console.log(
        "Looking for field:",
        fieldKey,
        "in form definition:",
        formFields
      );

      // Tìm field trong form definition
      const findFieldInDefinition = (fields: any[]): string | null => {
        for (const field of fields) {
          console.log(
            "Checking field:",
            field.id,
            field.name,
            field.label,
            "against:",
            fieldKey
          );

          // Kiểm tra nhiều cách match
          const isMatch =
            field.id === fieldKey ||
            field.name === fieldKey ||
            field.id === fieldKey.toString() ||
            field.name === fieldKey.toString() ||
            (field.id && field.id.toString() === fieldKey) ||
            (field.name && field.name.toString() === fieldKey);

          if (isMatch) {
            console.log("Found field match:", field);
            return (
              field.label || field.title || field.name || field.id || field.name
            );
          }

          // Nếu field có children (như trong nested structure)
          if (field.children && Array.isArray(field.children)) {
            const found = findFieldInDefinition(field.children);
            if (found) return found;
          }
        }
        return null;
      };

      const fieldTitle = findFieldInDefinition(formFields);
      console.log("Field title found:", fieldTitle);
      if (fieldTitle) {
        return fieldTitle;
      }
    } catch (error) {
      console.error("Error parsing form definition:", error);
    }
  }

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
  // Xử lý các trường hợp đặc biệt
  if (
    lowerKey.includes("phone") ||
    lowerKey.includes("sdt") ||
    lowerKey.includes("mobile")
  ) {
    return "Số điện thoại";
  }
  if (lowerKey.includes("email") || lowerKey.includes("mail")) {
    return "Email";
  }
  if (
    lowerKey.includes("name") ||
    lowerKey.includes("ten") ||
    lowerKey.includes("ho")
  ) {
    return "Họ và tên";
  }
  if (
    lowerKey.includes("student") ||
    lowerKey.includes("mssv") ||
    lowerKey.includes("msv")
  ) {
    return "MSSV";
  }
  if (
    lowerKey.includes("gender") ||
    lowerKey.includes("gioi") ||
    lowerKey.includes("sex")
  ) {
    return "Giới tính";
  }
  if (lowerKey.includes("club") || lowerKey.includes("clb")) {
    return "Câu lạc bộ";
  }
  if (lowerKey.includes("may") || lowerKey === "may") {
    return "Mày";
  }

  // Xử lý trường hợp field có key là timestamp - fallback
  if (/^\d{13,}$/.test(fieldKey)) {
    // Nếu có form definition nhưng không tìm thấy field, có thể là field custom
    if (formDefinition) {
      // Thử tìm field theo timestamp trong form definition
      if (formDefinition.fields) {
        for (const field of formDefinition.fields) {
          // Kiểm tra nếu field có id hoặc name là timestamp
          if (field.id && field.id.toString() === fieldKey) {
            return field.label || field.title || field.name || "Custom Field";
          }
          if (field.name && field.name.toString() === fieldKey) {
            return field.label || field.title || field.name || "Custom Field";
          }
        }
      }
      return "Custom Field";
    }
    return "Mày"; // Fallback cũ
  }

  // Format key thành tên hiển thị
  return fieldKey
    .split(/[._-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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
  formType?: string;
  formName?: string;
  applicationFormConfigId?: string;
  stt?: number;
  formData?: any;
  competitionType?: string;
  category?: string;
  club?: string;
  coach?: string;
  gender?: string;
  status?: string;
  [key: string]: any; // Cho phép các trường động từ form data
};

export default function SubmittedFormsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SubmittedRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState<number>(1); // CommonTable is 1-based
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [viewingRow, setViewingRow] = useState<SubmittedRow | null>(null);

  // Filters
  const [status, setStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  // Search
  const [query, setQuery] = useState<string>("");

  // New form type filters
  const [formTypeFilter, setFormTypeFilter] = useState<
    "COMPETITION" | "CLUB" | ""
  >("");
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [availableForms, setAvailableForms] = useState<
    Array<{ id: string; name: string; formType: string }>
  >([]);
  const [selectedFormDefinition, setSelectedFormDefinition] =
    useState<any>(null);

  // Get toast context with safe handling
  let toast: any = null;
  try {
    const toastContext = useToast();
    toast = toastContext;
  } catch (error) {
    console.log("Toast context not available, using fallback");
    toast = {
      success: (message: string) => console.log("✅ Success:", message),
      error: (message: string) => console.log("❌ Error:", message),
    };
  }

  // Handle status change
  const handleStatusChange = async (
    submissionId: string,
    newStatus: string
  ) => {
    try {
      // Call API to update status
      await api.patch(
        `/v1/tournament-forms/submissions/${submissionId}/status`,
        {
          status: newStatus,
        }
      );

      // Update local state
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === submissionId ? { ...row, status: newStatus } : row
        )
      );

      // Show success toast
      const statusText =
        newStatus === "APPROVED"
          ? "Đã duyệt"
          : newStatus === "REJECTED"
          ? "Từ chối"
          : "Chờ duyệt";

      toast.success(`Đã cập nhật trạng thái thành "${statusText}" thành công!`);

      console.log(
        `Status updated to ${newStatus} for submission ${submissionId}`
      );
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại!");
    }
  };

  // Load available forms based on form type filter
  useEffect(() => {
    const loadForms = async () => {
      if (!formTypeFilter) {
        setAvailableForms([]);
        setSelectedFormDefinition(null);
        return;
      }

      try {
        const response = await api.get<{
          content: any[];
          totalElements: number;
        }>(API_ENDPOINTS.TOURNAMENT_FORMS.BASE, {
          page: 0,
          size: 100, // Use same size as TournamentFormList.tsx
        });

        const forms = response.data?.content || [];
        console.log("All forms from API:", forms.length, forms);

        const filteredForms = forms.filter((form: any) => {
          console.log("Form:", form.name, "formType:", form.formType);
          if (formTypeFilter === "COMPETITION") {
            return form.formType === "COMPETITION_REGISTRATION";
          } else if (formTypeFilter === "CLUB") {
            return form.formType === "CLUB_REGISTRATION";
          }
          return false;
        });

        console.log("Filtered forms:", filteredForms.length, filteredForms);
        console.log("Forms breakdown:");
        console.log(
          "- COMPETITION_REGISTRATION:",
          forms.filter((f) => f.formType === "COMPETITION_REGISTRATION").length
        );
        console.log(
          "- CLUB_REGISTRATION:",
          forms.filter((f) => f.formType === "CLUB_REGISTRATION").length
        );
        console.log(
          "- Other types:",
          forms.filter(
            (f) =>
              f.formType !== "COMPETITION_REGISTRATION" &&
              f.formType !== "CLUB_REGISTRATION"
          ).length
        );

        setAvailableForms(
          filteredForms.map((form: any) => ({
            id: form.id,
            name: form.formTitle || form.name || "Không có tên",
            formType: form.formType,
          }))
        );
      } catch (error) {
        console.error("Error loading forms:", error);
      }
    };

    loadForms();
  }, [formTypeFilter]);

  // Load form definition when form is selected
  useEffect(() => {
    const loadFormDefinition = async () => {
      if (!selectedFormId) {
        setSelectedFormDefinition(null);
        return;
      }

      try {
        const response = await api.get(
          `/v1/tournament-forms/${selectedFormId}`
        );
        setSelectedFormDefinition(response.data);
        console.log("Form definition loaded:", response.data);
      } catch (error) {
        console.error("Error loading form definition:", error);
        setSelectedFormDefinition(null);
      }
    };

    loadFormDefinition();
  }, [selectedFormId]);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError("");
        // Only fetch data if a specific form is selected
        if (!selectedFormId) {
          setRows([]);
          setTotalElements(0);
          return;
        }

        // Use FormResults API endpoint for specific form submissions
        const res = await api.get<{
          content: any[];
          page: number;
          size: number;
          totalElements: number;
        }>("/v1/submitted-forms", {
          // Only show club registration forms
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
          const root = res.data as Record<string, unknown>;
          const pageData = (root["data"] as Record<string, unknown>) ?? root;
          const responseTimestamp = (root["timestamp"] as string) || "";
          const totalElements =
            (pageData["totalElements"] as number) ||
            (pageData["total"] as number) ||
            0;
          const content = (pageData["content"] as Array<unknown>) ?? [];

          const mapped: SubmittedRow[] = content.map((raw) => {
            const item = raw as {
              id: number;
              formData?: string;
              status?: string;
            };
            let parsed: Record<string, unknown> = {};
            try {
              parsed = item.formData ? JSON.parse(item.formData) : {};
            } catch {
              parsed = {};
            }

            // Extract competition type and category like FormResults
            const compRaw = (
              (parsed.competitionType as string) || ""
            ).toLowerCase();
            const compVi =
              compRaw === "quyen"
                ? "Quyền"
                : compRaw === "fighting"
                ? "Đối kháng"
                : compRaw === "music"
                ? "Võ nhạc"
                : "";

            // Extract category like FormResults
            let categoryVi = "";
            if (compRaw === "fighting") {
              const weightClass = parsed.weightClass as string;
              const weightClassId = parsed.weightClassId as string;
              if (weightClass && weightClass.trim()) {
                categoryVi = weightClass;
              } else if (weightClassId) {
                categoryVi = weightClassId;
              } else {
                categoryVi = "Đối kháng";
              }
            } else if (compRaw === "quyen") {
              const quyenCategory = parsed.quyenCategory as string;
              const quyenContent = parsed.quyenContent as string;
              if (quyenCategory && quyenCategory.trim()) {
                categoryVi = quyenCategory;
              } else if (quyenContent && quyenContent.trim()) {
                categoryVi = quyenContent;
              } else {
                categoryVi = "Quyền";
              }
            } else if (compRaw === "music") {
              const musicCategory = parsed.musicCategory as string;
              if (musicCategory && musicCategory.trim()) {
                categoryVi = musicCategory;
              } else {
                categoryVi = "Võ nhạc";
              }
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
              formType: s.formType || "",
              formName: s.applicationFormConfigName || "", // Form name from backend
              applicationFormConfigId: s.applicationFormConfigId || "", // Form config ID
              ...formFields, // Spread tất cả các trường form data vào row
            } as SubmittedRow;
          });

          setRows(mapped);
          setTotalElements(totalElements);
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
  }, [page, pageSize, status, dateFrom, dateTo, query, selectedFormId]);

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

    return [
      {
        key: "stt",
        title: "STT",
        render: (row: SubmittedRow) => (
          <span className="text-sm font-medium text-gray-900">{row.stt}</span>
        ),
        sortable: false,
        className: "w-10 text-center",
      },
      {
        key: "submittedAt",
        title: "Thời gian",
        sortable: true,
        render: (r) => (
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {formatDate(r.submittedAt)}
          </span>
        ),
        className: "w-36",
      },
      {
        key: "fullName",
        title: "Họ và tên",
        sortable: true,
        render: (r: SubmittedRow) => (
          <div className="font-medium text-gray-900 truncate max-w-[200px]" title={r.fullName}>
            {r.fullName || "-"}
          </div>
        ),
        className: "min-w-[150px] max-w-[200px]",
      },
      {
        key: "email",
        title: "Email",
        sortable: true,
        render: (r: SubmittedRow) => (
          <div className="text-sm text-gray-600 truncate max-w-[200px]" title={r.email}>
            {r.email || "-"}
          </div>
        ),
        className: "min-w-[150px] max-w-[200px]",
      },
      {
        key: "studentCode",
        title: "MSSV",
        sortable: true,
        render: (r: SubmittedRow) => (
          <span className="text-sm font-medium text-gray-700">{r.studentCode || "-"}</span>
        ),
        className: "w-24",
      },
      {
        key: "formName",
        title: "Form",
        sortable: true,
        render: (r: SubmittedRow) => (
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
            {r.formName || "N/A"}
          </span>
        ),
        className: "w-32",
      },
      {
        key: "actions",
        title: "",
        sortable: false,
        className: "w-28",
        render: (row: SubmittedRow) => (
          <button
            type="button"
            aria-label={`Xem chi tiết form #${row.id}`}
            onClick={() => setViewingRow(row)}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Chi tiết
          </button>
        ),
      },
      {
        key: "status",
        title: "Trạng thái",
        sortable: true,
        className: "w-20",
        render: (row: SubmittedRow) => {
          // Get status from row data
          const status = row.status || "PENDING";

          const getStatusDisplay = (status: string) => {
            switch (status.toUpperCase()) {
              case "APPROVED":
                return {
                  text: "Đã duyệt",
                  color: "bg-green-100 text-green-800",
                };
              case "REJECTED":
                return { text: "Từ chối", color: "bg-red-100 text-red-800" };
              case "PENDING":
              default:
                return {
                  text: "Chờ duyệt",
                  color: "bg-yellow-100 text-yellow-800",
                };
            }
          };

          const statusInfo = getStatusDisplay(status);

          return (
            <select
              value={status}
              onChange={(e) => handleStatusChange(row.id, e.target.value)}
              className={`rounded-md border px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 ${
                status === "APPROVED"
                  ? "border-green-300 bg-green-100 text-green-800 focus:ring-green-500/40"
                  : status === "REJECTED"
                  ? "border-red-300 bg-red-100 text-red-800 focus:ring-red-500/40"
                  : "border-yellow-300 bg-yellow-100 text-yellow-800 focus:ring-yellow-500/40"
              }`}
            >
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          );
        },
      },
    ];
  }, []);

  const filtered = useReactMemo(() => {
    let data = rows;

    const toTimestamp = (input?: string): number | null => {
      if (!input) return null;
      const direct = Date.parse(input);
      if (!Number.isNaN(direct)) return direct;
      // Try parse formats like "HH:mm:ss dd/MM/yyyy" or "dd/MM/yyyy"
      try {
        const match = input.match(
          /(?:(\d{1,2}):(\d{2})(?::(\d{2}))?\s+)?(\d{2})\/(\d{2})\/(\d{4})/
        );
        if (match) {
          const hh = Number(match[1] ?? 0);
          const mm = Number(match[2] ?? 0);
          const ss = Number(match[3] ?? 0);
          const dd = Number(match[4]);
          const mo = Number(match[5]) - 1;
          const yy = Number(match[6]);
          return new Date(yy, mo, dd, hh, mm, ss).getTime();
        }
      } catch {}
      return null;
    };

    // Status filter
    if (status && status.trim()) {
      const s = status.trim().toUpperCase();
      data = data.filter((r) => (r.status || "PENDING").toUpperCase() === s);
    }

    // Date range filter (inclusive)
    if ((dateFrom && dateFrom.trim()) || (dateTo && dateTo.trim())) {
      const fromTs = dateFrom
        ? new Date(dateFrom + "T00:00:00").getTime()
        : Number.NEGATIVE_INFINITY;
      const toTs = dateTo
        ? new Date(dateTo + "T23:59:59.999").getTime()
        : Number.POSITIVE_INFINITY;
      data = data.filter((r) => {
        const ts = toTimestamp(r.submittedAt);
        if (ts == null) return true; // if cannot parse, do not exclude
        return ts >= fromTs && ts <= toTs;
      });
    }

    // Email search
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      data = data.filter((r) => (r.email || "").toLowerCase().includes(q));
    }

    return data;
  }, [rows, status, dateFrom, dateTo, query]);

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
        <h2 className="text-2xl font-bold text-gray-900">
          {selectedFormId && availableForms.length > 0
            ? availableForms.find((f) => f.id === selectedFormId)?.name ||
              "Kết quả đăng ký"
            : "Kết quả đăng ký"}
        </h2>
        <p className="text-gray-600">
          {formTypeFilter === "COMPETITION"
            ? "Đăng ký giải đấu"
            : formTypeFilter === "CLUB"
            ? "Đăng ký CLB"
            : "Đăng kí tham gia FPTU Vovinam Club FALL 2025"}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {totalElements}
          </div>
          <div className="text-sm text-gray-600">Tổng số đăng ký</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {filtered.length}
          </div>
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
            onClick={() => {
              setStatus("");
              setDateFrom("");
              setDateTo("");
              setQuery("");
              setFormTypeFilter("");
              setSelectedFormId("");
              setPage(1);
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Kết quả đăng ký câu lạc bộ</h2>
          <p className="text-gray-600">Tổng hợp các form đăng ký tham gia câu lạc bộ</p>
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
              <option value="">Chọn loại form</option>
              <option value="COMPETITION">Form đăng ký giải</option>
              <option value="CLUB">Form đăng ký CLB</option>
            </select>
          </div>

          {/* Specific Form Filter */}
          {formTypeFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form cụ thể
              </label>
              <select
                value={selectedFormId}
                onChange={(e) => {
                  setSelectedFormId(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
              >
                <option value="">Chọn form cụ thể</option>
                {availableForms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Đang chờ</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setPage(1);
                setDateFrom(e.target.value);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setPage(1);
                setDateTo(e.target.value);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm theo email
            </label>
            <input
              placeholder="Nhập email..."
              value={query}
              onChange={(e) => {
                setPage(1);
                setQuery(e.target.value);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none"
            />
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
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1); // Reset to first page when changing page size
            }}
            showPageSizeSelector={true}
            pageSizeOptions={[5, 10, 15]}
          />
        )}

      {/* View Form Modal */}
      {viewingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedFormId && availableForms.length > 0
                  ? availableForms.find((f) => f.id === selectedFormId)?.name ||
                    "Chi tiết form đăng ký"
                  : "Chi tiết form đăng ký"}{" "}
                #{viewingRow.id}
              </h3>
              <button
                onClick={() => setViewingRow(null)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-6">
              {/* Form Fields Information */}
              <div className="mb-6">
                <h4 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Thông tin đăng ký
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Parse form data to show all fields from the specific form */}
                  {(() => {
                    let formData = {};
                    try {
                      formData = viewingRow.formData
                        ? JSON.parse(viewingRow.formData)
                        : {};
                    } catch (e) {
                      formData = {};
                    }

              {/* Form Data - Thông tin người đăng ký */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Thông tin người đăng ký
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(() => {
                    // Parse formData
                    let formDataObj: any = {};
                    try {
                      formDataObj = typeof viewingRow.formData === 'string' 
                        ? JSON.parse(viewingRow.formData) 
                        : viewingRow.formData;
                    } catch {
                      formDataObj = {};
                    }

                    // Map các trường thông tin người đăng ký
                    const infoFields: Array<{ key: string; label: string; value: string }> = [];
                    
                    // Họ và tên
                    const fullName = formDataObj.fullName || formDataObj.name || formDataObj.hovaten || formDataObj.hoTen || '';
                    if (fullName) {
                      infoFields.push({ key: 'fullName', label: 'Họ và tên', value: fullName });
                    }

                    // Email
                    const email = formDataObj.email || formDataObj.mail || '';
                    if (email) {
                      infoFields.push({ key: 'email', label: 'Email', value: email });
                    }

                    // MSSV
                    const studentCode = formDataObj.studentCode || formDataObj.mssv || formDataObj.msv || '';
                    if (studentCode) {
                      infoFields.push({ key: 'studentCode', label: 'MSSV', value: studentCode });
                    }

                    // Số điện thoại
                    const phone = formDataObj.phone || formDataObj.sdt || formDataObj.so_dien_thoai || formDataObj.mobile || '';
                    if (phone) {
                      infoFields.push({ key: 'phone', label: 'Số điện thoại', value: phone });
                    }

                    // Mô tả / Lý do
                    const reason = formDataObj.reason || formDataObj.mo_ta || formDataObj.mota || formDataObj.description || formDataObj.bio || '';
                    if (reason) {
                      infoFields.push({ key: 'reason', label: 'Mô tả ngắn về bản thân', value: reason });
                    }

                    // Các trường khác (loại bỏ null, empty, và các trường đã hiển thị)
                    const excludedKeys = ['fullName', 'name', 'hovaten', 'hoTen', 'email', 'mail', 
                                         'studentCode', 'mssv', 'msv', 'phone', 'sdt', 'so_dien_thoai', 'mobile',
                                         'reason', 'mo_ta', 'mota', 'description', 'bio', 'club'];
                    
                    Object.entries(formDataObj).forEach(([key, value]) => {
                      const lowerKey = key.toLowerCase();
                      if (!excludedKeys.includes(lowerKey) && 
                          value !== null && 
                          value !== undefined && 
                          value !== '' &&
                          typeof value === 'string') {
                        infoFields.push({ 
                          key, 
                          label: getFieldDisplayName(key), 
                          value: String(value) 
                        });
                      }
                    });

                    // Hiển thị các trường
                    if (infoFields.length === 0) {
                      return (
                        <div className="col-span-2 rounded-md bg-gray-50 p-3 text-center text-sm text-gray-500">
                          Không có thông tin bổ sung
                        </div>
                      );
                    }

                    return infoFields.map((field) => (
                      <div key={field.key} className="rounded-md bg-gray-50 p-3">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {field.label}
                        </div>
                        <div className="mt-1 text-sm text-gray-900">{field.value}</div>
                      </div>
                    ));
                  })()}
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
    // Replace alert with toast once toast context is available here
    // For now, keep minimal UX change if toast not wired in this file
    console.warn("Không có dữ liệu để xuất");
    return;
  }

  // Lấy các trường form data được phép từ dữ liệu
  const allowedFormFields = new Set<string>();
  rows.forEach((row) => {
    const formFields = extractFormDataFields(row.formData);
    Object.keys(formFields).forEach((key) => {
      const lowerKey = key.toLowerCase();
      // Loại bỏ các trường tên vì đã có trong cột "Họ và tên"
      const isNameField = ["fullName", "name", "hovaten", "ten"].includes(
        lowerKey
      );
      if (!isNameField) {
        // Chỉ export các trường được định nghĩa trong fieldDisplayNames
        if (
          Object.keys(fieldDisplayNames).some(
            (definedKey) =>
              definedKey.toLowerCase() === lowerKey ||
              lowerKey.includes(definedKey.toLowerCase()) ||
              definedKey.toLowerCase().includes(lowerKey)
          )
        ) {
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
    ...Array.from(allowedFormFields).map((fieldKey) =>
      getFieldDisplayName(fieldKey)
    ),
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
    ...Array.from(allowedFormFields).map((fieldKey) =>
      escapeCsv(r[fieldKey] || "")
    ),
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

