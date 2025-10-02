import CommonTable from "@/components/common/CommonTable";
import type { TableColumn } from "@/components/common/CommonTable";
import { useEffect, useMemo, useMemo as useReactMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

type SubmittedRow = {
  id: string;
  submittedAt: string;
  fullName: string;
  email: string;
  studentCode: string;
  phone: string;
  note: string;
};

export default function SubmittedFormsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SubmittedRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

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
          page: 0,
          size: 50,
          sortBy: "id",
          ascending: false,
        });
        if (!ignore) {
          const mapped: SubmittedRow[] = (res.data?.content ?? []).map((s: any, idx: number) => {
            const emailFromUser = s.userPersonalMail || s.userEduMail || "";
            const codeFromUser = s.userStudentCode || "";
            const nameFromUser = s.userFullName || "";
            const phoneFromForm = s.formData ? safePick(s.formData, ["phone", "sdt", "mobile"]) : "";
            return {
              id: String(s.id ?? idx),
              submittedAt: s.createdAt ?? "",
              fullName: nameFromUser || (s.formData ? safePick(s.formData, ["fullName", "name", "hovaten"]) : ""),
              email: emailFromUser || (s.formData ? safePick(s.formData, ["email", "mail"]) : ""),
              studentCode: codeFromUser || (s.formData ? safePick(s.formData, ["studentCode", "mssv", "msv"]) : ""),
              phone: phoneFromForm,
              note: s.reviewerNote ?? "",
            } as SubmittedRow;
          });
          setRows(mapped);
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
  }, []);

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
    return [
      {
        key: "stt",
        title: "STT",
        render: (_row: SubmittedRow) => null, // will be filled by row render index
        sortable: false,
        className: "w-16",
      },
      { key: "submittedAt", title: "Thời gian nộp", sortable: true },
      { key: "fullName", title: "Họ và tên", sortable: true },
      { key: "email", title: "Email", sortable: true },
      { key: "studentCode", title: "MSSV", sortable: true },
      { key: "phone", title: "SDT liên lạc", sortable: true },
      { key: "note", title: "Mô tả ngắn về bản thân" },
    ];
  }, []);

  // Search
  const [query, setQuery] = useState<string>("");
  const filtered = useReactMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      [r.fullName, r.email, r.studentCode, r.phone, r.note]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
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
        <button className="rounded-md bg-emerald-500 px-3 py-2 text-[13px] font-medium text-white shadow hover:bg-emerald-600">
          Xuất Excel
        </button>
      </div>

      <div>
        <h2 className="mb-1 text-xl font-semibold">Kết quả</h2>
        <p className="mb-4 text-sm text-gray-600">
          Đăng kí tham gia FPTU Vovinam Club FALL 2025
        </p>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">Lượt điền: {filtered.length}</div>
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
        data={filtered.map((r, idx) => ({ ...r, stt: idx + 1 })) as any}
        columns={columns as any}
        pageSizeOptions={[5, 10, 20]}
        initialPageSize={5}
        className={loading ? "opacity-60" : undefined}
      />
    </div>
  );
}


