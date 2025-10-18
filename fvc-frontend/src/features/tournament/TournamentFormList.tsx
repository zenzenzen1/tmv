import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommonTable,
  type TableColumn,
} from "../../components/common/CommonTable";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import type { PaginationResponse } from "../../types/api";
import { useToast } from "../../components/common/ToastContext";

type FormRow = {
  id: string;
  tournament: string;
  formTitle: string;
  participants: number;
  createdAt: string;
  status: "publish" | "archived" | "draft" | "postpone";
};

// removed badge in favor of colored dropdown

export default function TournamentFormList() {
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [rows, setRows] = useState<FormRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "DRAFT" | "PUBLISH" | "ARCHIVED" | "POSTPONE"
  >("ALL");
  const toast = useToast();

  const columns: Array<TableColumn<FormRow>> = useMemo(
    () => [
      {
        key: "tournament",
        title: "Giải đấu",
        className: "text-[15px] w-64",
      },
      {
        key: "formTitle",
        title: "Tiêu đề Form",
        className: "text-[15px] w-96",
      },
      {
        key: "participants",
        title: "Số người tham gia",
        className: "text-[15px] w-24 text-center",
      },
      {
        key: "createdAt",
        title: "Ngày tạo",
        className: "text-[15px] w-36",
      },
      {
        key: "status",
        title: "Trạng thái",
        className: "text-[15px] w-40",
        render: (r: FormRow) => (
          <div className="flex items-center gap-2">
            <select
              className={`rounded-md px-2 py-1 text-xs border ${
                r.status === "publish"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : r.status === "archived"
                  ? "bg-rose-50 text-rose-600 border-rose-200"
                  : r.status === "postpone"
                  ? "bg-gray-100 text-gray-700 border-gray-300"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
              value={r.status}
              onChange={async (e) => {
                const val = e.target.value as FormRow["status"];
                const map: Record<FormRow["status"], string> = {
                  draft: "DRAFT",
                  publish: "PUBLISH",
                  archived: "ARCHIVED",
                  postpone: "POSTPONE",
                };
                try {
                  // optimistic update
                  setRows((prev) =>
                    prev.map((row) =>
                      row.id === r.id ? { ...row, status: val } : row
                    )
                  );
                  await api.patch<void>(
                    `${API_ENDPOINTS.TOURNAMENT_FORMS.BASE}/${r.id}/status`,
                    { status: map[val] }
                  );
                  // Notify Home to refresh published list
                  window.dispatchEvent(new Event("forms:changed"));
                  // hard refresh to reflect backend truth
                  setPage((p) => p);
                  toast.success("Cập nhật trạng thái thành công");
                } catch (err) {
                  console.error("Failed to update status", err);
                  // rollback optimistic update on failure
                  setRows((prev) =>
                    prev.map((row) =>
                      row.id === r.id ? { ...row, status: r.status } : row
                    )
                  );
                  toast.error("Cập nhật trạng thái thất bại");
                }
              }}
            >
              <option value="draft">Draff</option>
              <option value="publish">Đã xuất bản</option>
              <option value="archived">Lưu trữ</option>
              <option value="postpone">Hoãn</option>
            </select>
          </div>
        ),
        sortable: false,
      },
      {
        key: "actions",
        title: "Thao tác",
        className: "text-[15px] whitespace-nowrap w-40",
        render: (r: FormRow) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                navigate(`/results/${r.id}`, {
                  state: { tournamentName: r.tournament },
                })
              }
              className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
            >
              Xem kết quả
            </button>
            <button
              onClick={() => navigate(`/form-builder/${r.id}`)}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
            >
              Sửa
            </button>
          </div>
        ),
        sortable: false,
      },
    ],
    [navigate]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const applyingFilter =
          (searchText && searchText.trim().length > 0) ||
          statusFilter !== "ALL";
        const resp = await api.get<
          PaginationResponse<{
            id: string;
            tournamentName: string;
            formTitle: string;
            numberOfParticipants: number;
            createdAt: string;
            status: string;
          }>
        >(API_ENDPOINTS.TOURNAMENT_FORMS.BASE, {
          page: applyingFilter ? 0 : page - 1,
          size: applyingFilter ? 100 : pageSize,
          // Backend expects 'search' not 'keyword'
          search: searchText || undefined,
          // status may be ignored by backend; keep for future compatibility
          status: statusFilter !== "ALL" ? statusFilter : undefined,
        });
        const data = resp.data;
        const mappedAll: FormRow[] = data.content.map((item) => ({
          id: item.id,
          tournament: item.tournamentName,
          formTitle: item.formTitle,
          participants: item.numberOfParticipants ?? 0,
          createdAt: new Date(item.createdAt).toLocaleDateString(),
          status: (item.status as FormRow["status"]) ?? "draft",
        }));
        // Client-side filtering when backend doesn't support
        const filtered = mappedAll.filter((row) => {
          const matchesText = searchText
            ? (row.tournament + " " + row.formTitle)
                .toLowerCase()
                .includes(searchText.toLowerCase())
            : true;
          const matchesStatus =
            statusFilter === "ALL"
              ? true
              : row.status.toUpperCase() === statusFilter;
          return matchesText && matchesStatus;
        });

        setTotal(filtered.length);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        setRows(applyingFilter ? filtered.slice(start, end) : filtered);
      } catch (e) {
        console.error(e);
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, searchText, statusFilter]);

  return (
    <div className="px-6 pb-10 w-full">
      <div className="flex items-center justify-between py-4">
        <h1 className="text-[15px] font-semibold text-gray-800">
          Quản lí Form đăng ký giải đấu
        </h1>
        <div className="flex items-center gap-2">
          <button className="rounded-md bg-emerald-500 px-3 py-2 text-white text-sm shadow hover:bg-emerald-600">
            Xuất Excel
          </button>
          <button
            onClick={() => navigate("/form-builder")}
            className="rounded-md bg-[#377CFB] px-3 py-2 text-white text-sm shadow hover:bg-[#2f6ae0]"
          >
            + Tạo form mới
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <input
          value={searchText}
          onChange={(e) => {
            setPage(1);
            setSearchText(e.target.value);
          }}
          placeholder="Tìm tiêu đề form / tên giải..."
          className="w-80 rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value as any);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PUBLISH">Đã xuất bản</option>
          <option value="ARCHIVED">Lưu trữ</option>
          <option value="POSTPONE">Hoãn</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      <CommonTable<FormRow>
        columns={columns}
        data={rows}
        keyField="id"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
