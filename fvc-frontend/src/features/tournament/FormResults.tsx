import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Footer from "../../components/layout/Footer";
import {
  CommonTable,
  type TableColumn,
} from "../../components/common/CommonTable";
import api from "../../services/api";
// import type { PaginationResponse } from "../../types/api";

type ResultRow = {
  id: string;
  submittedAt: string;
  fullName: string;
  email: string;
  gender: "Nam" | "Nữ";
  competitionType: string;
  category: string;
  studentId: string;
  club: string;
  coach: string;
  phone: string;
  status: "ĐÃ DUYỆT" | "CHỜ DUYỆT" | "TỪ CHỐI";
};

const STATUS_MAP: Record<string, ResultRow["status"]> = {
  APPROVED: "ĐÃ DUYỆT",
  PENDING: "CHỜ DUYỆT",
  REJECTED: "TỪ CHỐI",
};

export default function FormResults() {
  const navigate = useNavigate();
  const [page, setPage] = useState<number>(1);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [, setLoading] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const { id } = useParams<{ id: string }>();
  const location = useLocation() as { state?: { tournamentName?: string } };

  const tournamentName = location?.state?.tournamentName ?? "";

  const columns: Array<TableColumn<ResultRow>> = useMemo(
    () => [
      {
        key: "index",
        title: "STT",
        className: "w-16 text-[15px]",
        sortable: false,
      },
      {
        key: "submittedAt",
        title: "Thời gian nộp",
        className: "whitespace-nowrap text-[15px]",
        render: (r: ResultRow) => r.submittedAt || "",
      },
      {
        key: "fullName",
        title: "Họ và tên",
        className: "whitespace-nowrap text-[15px]",
      },
      {
        key: "email",
        title: "Email",
        className: "whitespace-nowrap text-[15px]",
      },
      {
        key: "gender",
        title: "Giới tính",
        className: "whitespace-nowrap text-[15px]",
      },
      {
        key: "competitionType",
        title: "Thể thức thi đấu",
        className: "whitespace-nowrap text-[15px]",
      },
      {
        key: "category",
        title: "Nội dung thi đấu",
        className: "whitespace-nowrap text-[15px]",
      },
      {
        key: "studentId",
        title: "MSSV",
        className: "whitespace-nowrap text-[15px]",
      },
      { key: "club", title: "CLB", className: "whitespace-nowrap text-[15px]" },
      // Removed coach column per request
      {
        key: "phone",
        title: "SDT liên lạc",
        className: "whitespace-nowrap text-[15px]",
      },
      {
        key: "status",
        title: "Trạng thái",
        render: (r: ResultRow) => (
          <div className="flex items-center gap-2">
            <select
              className={`rounded-md px-2 py-1 text-xs border ${
                r.status === "ĐÃ DUYỆT"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : r.status === "TỪ CHỐI"
                  ? "bg-rose-50 text-rose-600 border-rose-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
              value={r.status}
              onChange={async (e) => {
                const next = e.target.value as ResultRow["status"];
                const map: Record<ResultRow["status"], string> = {
                  "ĐÃ DUYỆT": "APPROVED",
                  "CHỜ DUYỆT": "PENDING",
                  "TỪ CHỐI": "REJECTED",
                };
                try {
                  // optimistic
                  setRows((prev) =>
                    prev.map((row) =>
                      row.id === r.id ? { ...row, status: next } : row
                    )
                  );
                  await api.patch(
                    `/v1/tournament-forms/submissions/${r.id}/status`,
                    { status: map[next] }
                  );
                  // Notify athlete list to refetch after approval
                  if (next === "ĐÃ DUYỆT") {
                    window.dispatchEvent(new Event("athletes:refetch"));
                  }
                } catch (err) {
                  console.error("Update submission status failed", err);
                }
              }}
            >
              <option>ĐÃ DUYỆT</option>
              <option>CHỜ DUYỆT</option>
              <option>TỪ CHỐI</option>
            </select>
          </div>
        ),
        sortable: false,
      },
    ],
    []
  );

  const pageSize = 5;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Force backend to paginate 5 per page
        const resp = await api.get(
          `/v1/tournament-forms/${id}/submissions?page=${
            page - 1
          }&size=${pageSize}`
        );
        const root = resp.data as Record<string, unknown>;
        const pageData = (root["data"] as Record<string, unknown>) ?? root;
        const responseTimestamp = (root["timestamp"] as string) || "";
        const totalElements =
          (pageData["totalElements"] as number) ||
          (pageData["total"] as number) ||
          0;
        const content = (pageData["content"] as Array<unknown>) ?? [];
        const mapped: ResultRow[] = content.map((raw) => {
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
          const status = STATUS_MAP[item.status as string] || "CHỜ DUYỆT";
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
          const getFirstString = (v: unknown): string => {
            if (Array.isArray(v)) {
              if (v.length === 0) return "";
              return getFirstString(v[0]);
            }
            if (v && typeof v === "object") {
              const obj = v as Record<string, unknown>;
              if (typeof obj.name === "string" && obj.name) return obj.name;
              if (typeof obj.title === "string" && obj.title) return obj.title;
              if (typeof obj.label === "string" && obj.label) return obj.label;
              for (const key of Object.keys(obj)) {
                const val = obj[key];
                if (typeof val === "string" && val) return val;
              }
              return "";
            }
            if (typeof v === "string" || typeof v === "number")
              return String(v);
            return "";
          };

          const quyenCategory =
            getFirstString(parsed.quyenCategory) ||
            getFirstString(parsed.category) ||
            "";
          const quyenContent =
            getFirstString(parsed.quyenContent) ||
            getFirstString((parsed as Record<string, unknown>).fistContent) ||
            getFirstString((parsed as Record<string, unknown>).fistItem) ||
            getFirstString((parsed as Record<string, unknown>).fistItemName) ||
            getFirstString(
              (parsed as Record<string, unknown>).quyenContentName
            ) ||
            getFirstString((parsed as Record<string, unknown>).contentName) ||
            getFirstString(parsed.content) ||
            "";
          const categoryVi =
            compRaw === "quyen"
              ? `${quyenCategory}${quyenContent ? ` - ${quyenContent}` : ""}`
              : compRaw === "fighting"
              ? (parsed.weightClass as string) || ""
              : compRaw === "music"
              ? (parsed.musicCategory as string) || ""
              : (parsed.category as string) || "";
          if (compRaw === "quyen") {
            console.log("FormResults parsed quyen:", {
              raw: parsed,
              quyenCategory,
              quyenContent,
              categoryVi,
            });
          }
          // Extract submitted time if available, else fallback empty
          const it = item as unknown as Record<string, unknown>;
          const pickDate = (...keys: string[]): string | undefined => {
            for (const k of keys) {
              const v = it[k];
              if (v === undefined || v === null) continue;
              if (typeof v === "number") {
                // epoch seconds or ms
                const ms = v > 1e12 ? v : v * 1000;
                return new Date(ms).toLocaleString();
              }
              if (typeof v === "string" && v.trim()) {
                const d = new Date(v);
                if (!isNaN(d.getTime())) return d.toLocaleString();
              }
            }
            return undefined;
          };
          let submittedAt =
            pickDate(
              "submittedAt",
              "createdAt",
              "createdDate",
              "created_time",
              "created_at",
              "timestamp",
              "createdOn",
              "updatedAt",
              "submittedAtClient"
            ) || "";
          // Also check inside parsed formData (client timestamp saved there)
          if (!submittedAt) {
            const v = (parsed as Record<string, unknown>)["submittedAtClient"];
            if (typeof v === "string" && v) {
              const d = new Date(v);
              if (!isNaN(d.getTime())) submittedAt = d.toLocaleString();
            }
          }
          // Fallback to response timestamp if item lacks its own time
          if (!submittedAt && responseTimestamp) {
            const d = new Date(responseTimestamp);
            if (!isNaN(d.getTime())) submittedAt = d.toLocaleString();
          }
          return {
            id: String(item.id),
            submittedAt,
            fullName: parsed.fullName || "",
            email: parsed.email || "",
            gender: parsed.gender === "FEMALE" ? "Nữ" : "Nam",
            competitionType: compVi,
            category: categoryVi,
            studentId: parsed.studentId || "",
            club: parsed.club || "",
            coach: parsed.coach || "",
            phone: parsed.phone || "",
            status,
          } as ResultRow;
        });
        // Show at most 5 rows on a single page (no extra pages)
        // Use backend pagination: keep total from server
        setRows(mapped);
        setTotal(totalElements);
      } catch (e: unknown) {
        console.error("Load submissions failed", e);
        if (typeof e === "object" && e && "message" in e) {
          const msg = (e as { message?: string }).message;
          if (msg) console.error("API message:", msg);
        }
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, page, reloadKey]);

  // Listen for form submissions elsewhere to refresh results
  useEffect(() => {
    const handler = () => setReloadKey((k) => k + 1);
    window.addEventListener("forms:changed", handler);
    return () => window.removeEventListener("forms:changed", handler);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F6FF] to-[#E0EAFF] flex flex-col">
      <div className="flex-1">
        <div className="px-6 pb-10 w-full">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
              >
                Quay lại
              </button>
              <div className="text-lg font-semibold text-gray-800">
                Kết quả - Đăng kí tham gia Giải đấu
              </div>
              <span className="text-lg font-semibold text-[#2563eb]">
                {tournamentName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-md bg-emerald-500 px-3 py-2 text-white text-sm shadow hover:bg-emerald-600">
                Xuất Excel
              </button>
              <button className="rounded-md bg-[#377CFB] px-3 py-2 text-white text-sm shadow hover:bg-[#2f6ae0]">
                Lưu
              </button>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              placeholder="Tìm kiếm theo Họ và tên, Email, MSSV, CLB..."
              className="w-[28rem] max-w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white">
              <option>Giới tính</option>
              <option>Nam</option>
              <option>Nữ</option>
            </select>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white">
              <option>Thể thức thi đấu</option>
              <option>Đối kháng</option>
              <option>Quyền</option>
              <option>Võ nhạc</option>
            </select>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white">
              <option>CLB</option>
              <option>FPTU HN</option>
              <option>FPTU HCM</option>
              <option>FPTU ĐN</option>
            </select>
            <select className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white">
              <option>Trạng thái</option>
              <option>DUYỆT ĐẦU</option>
              <option>CHỜ DUYỆT</option>
              <option>TỪ CHỐI</option>
            </select>
          </div>

          <CommonTable<ResultRow>
            columns={columns}
            data={rows.map((r, idx) => ({
              ...r,
              index: (page - 1) * pageSize + idx + 1,
            }))}
            keyField="id"
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}
