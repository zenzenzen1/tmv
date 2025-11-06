import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import { useToast } from "../../components/common/ToastContext";

type FormConfig = {
  id: string;
  name: string;
  formTitle: string;
  description: string;
  formType: string;
  createdAt: string;
  updatedAt: string;
  fieldCount: number;
  status: string;
  numberOfParticipants?: number;
};

export default function TournamentFormList() {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // UI controls
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalForms, setTotalForms] = useState(0);
  const [allForms, setAllForms] = useState<FormConfig[]>([]);

  const loadForms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<{
        content: FormConfig[];
        totalElements: number;
      }>(API_ENDPOINTS.TOURNAMENT_FORMS.BASE, {
        page: 0,
        size: 100, // Request more records
      });

      console.log("TournamentFormList API response:", response);

      if (response.success && response.data) {
        // Handle different response structures
        let dataArray: FormConfig[] = [];

        if (Array.isArray(response.data)) {
          // Direct array response
          dataArray = response.data;
        } else if (
          response.data.content &&
          Array.isArray(response.data.content)
        ) {
          // Pagination response with content property
          dataArray = response.data.content;
        } else {
          console.error("Unexpected response structure:", response.data);
          dataArray = [];
        }

        console.log("Data array:", dataArray);

        // First, let's see all forms without filtering
        console.log("All forms before filtering:", dataArray);

        // Log each form's formType to understand the structure
        dataArray.forEach((form: FormConfig, index: number) => {
          console.log(`Form ${index}:`, {
            id: form.id,
            name: form.name,
            formType: form.formType,
            formTypeFromDB: form.formType,
            allProperties: Object.keys(form),
            fullForm: form, // Show full form structure
          });
        });

        const formsData: FormConfig[] = dataArray.map(
          (
            formLike: Partial<FormConfig> & {
              formTitle?: string;
              numberOfParticipants?: number;
            }
          ) => {
            const id = String(formLike.id || "");
            const name = formLike.formTitle || formLike.name || "Không có tên";
            const description = formLike.description || "Không có mô tả";
            const formType = String(formLike.formType || "");
            const createdAt = String(formLike.createdAt || "");
            const updatedAt = String(formLike.updatedAt || "");
            const status = (formLike.status || "DRAFT").toUpperCase();
            const numberOfParticipants =
              typeof formLike.numberOfParticipants === "number"
                ? formLike.numberOfParticipants
                : 0;
            return {
              id,
              name,
              formTitle: name,
              description,
              formType,
              createdAt,
              updatedAt,
              fieldCount: 0,
              status,
              numberOfParticipants,
            };
          }
        );

        console.log("All mapped forms:", formsData);

        // Show all formTypes to understand what we have
        const allFormTypes = formsData.map((f) => f.formType);
        console.log("All formTypes found:", allFormTypes);

        // Filter to show only COMPETITION_REGISTRATION forms
        let filteredForms = formsData.filter((form: FormConfig) => {
          console.log(`Form "${form.name}": formType="${form.formType}"`);

          // Only show COMPETITION_REGISTRATION forms
          if (form.formType === "COMPETITION_REGISTRATION") {
            console.log(
              `Form "${form.name}": INCLUDED - formType is COMPETITION_REGISTRATION`
            );
            return true;
          }

          // Exclude CLUB_REGISTRATION forms
          if (form.formType === "CLUB_REGISTRATION") {
            console.log(
              `Form "${form.name}": EXCLUDED - formType is CLUB_REGISTRATION`
            );
            return false;
          }

          // Exclude all other forms (including undefined/null)
          console.log(
            `Form "${form.name}": EXCLUDED - formType is not COMPETITION_REGISTRATION`
          );
          return false;
        });

        // Apply UI filters
        if (statusFilter) {
          filteredForms = filteredForms.filter(
            (f) => (f.status || "DRAFT").toUpperCase() === statusFilter
          );
        }
        if (search.trim().length > 0) {
          const q = search.trim().toLowerCase();
          filteredForms = filteredForms.filter(
            (f) =>
              (f.formTitle || f.name || "").toLowerCase().includes(q) ||
              (f.description || "").toLowerCase().includes(q)
          );
        }

        console.log("Filtered tournament forms:", filteredForms);

        setAllForms(filteredForms);
        setTotalForms(filteredForms.length);
        console.log("Set totalForms to:", filteredForms.length);

        // Also set initial forms for first page
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedForms = filteredForms.slice(startIndex, endIndex);
        setForms(paginatedForms);
      } else {
        setError(response.message || "Failed to fetch forms");
        toastError(response.message || "Tải danh sách form thất bại");
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || "Lỗi khi tải danh sách form");
      toastError((err as Error)?.message || "Tải danh sách form thất bại");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, toastError, statusFilter, search]);

  // Merge: Keep HEAD's loadForms function, add master's columns definition
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
              <option value="publish">Đã công khai</option>
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
    (async () => {
      await loadForms();
    })();
  }, [loadForms]);

  // Update pagination when currentPage changes
  useEffect(() => {
    console.log("Pagination useEffect triggered:", {
      allFormsLength: allForms.length,
      currentPage,
      pageSize,
      totalForms,
    });
    if (allForms.length > 0) {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedForms = allForms.slice(startIndex, endIndex);
      console.log("Pagination debug:", {
        currentPage,
        pageSize,
        totalForms: allForms.length,
        startIndex,
        endIndex,
        paginatedFormsLength: paginatedForms.length,
        allFormsLength: allForms.length,
      });
      setForms(paginatedForms);
    }
  }, [currentPage, allForms, pageSize, totalForms]);

  const handleEditForm = (form: FormConfig) => {
    if ((form.status || "DRAFT").toUpperCase() !== "DRAFT") {
      toastError("Chỉ form ở trạng thái Draft mới được chỉnh sửa");
      return;
    }
    navigate(`/manage/tournament-forms/${form.id}/edit`);
  };

  const handleCreateNew = () => {
    navigate("/manage/tournament-forms/new");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const handleStatusChange = async (formId: string, newStatus: string) => {
    try {
      // Optimistic update
      setForms((prevForms) =>
        prevForms.map((form) =>
          form.id === formId ? { ...form, status: newStatus } : form
        )
      );

      // API call to update status
      await api.patch(`/v1/tournament-forms/${formId}/status`, {
        status: newStatus,
      });

      toastSuccess(`Đã chuyển form sang trạng thái ${newStatus}`);
    } catch (error) {
      console.error("Error updating form status:", error);
      toastError("Không thể cập nhật trạng thái form");

      // Revert optimistic update
      setForms((prevForms) =>
        prevForms.map((form) =>
          form.id === formId
            ? { ...form, status: form.status } // Keep original status
            : form
        )
      );
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-6xl">
        {/* Header row */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-[16px] font-semibold text-gray-900">
            Quản lí Form đăng ký giải đấu
          </h1>
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Xuất Excel
            </button>
            <button
              onClick={handleCreateNew}
              className="rounded-md bg-[#377CFB] px-4 py-2 text-white text-sm hover:bg-[#2e6de0]"
            >
              + Tạo form mới
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-lg">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tiêu đề form/tên giải..."
              className="w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#377CFB]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>
          </div>
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Trạng thái</option>
            <option value="PUBLISH">Đã xuất bản</option>
            <option value="DRAFT">Nháp</option>
            <option value="ARCHIVED">Đã đóng</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {loading ? (
            <div className="text-center py-10 text-gray-600">
              Đang tải danh sách form...
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-600">{error}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-gray-700">
                  <thead className="bg-[#F6F9FF]">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">
                        Giải đấu
                      </th>
                      <th className="text-left font-medium px-4 py-3">
                        Tiêu đề Form
                      </th>
                      <th className="text-left font-medium px-4 py-3">
                        Số người tham gia
                      </th>
                      <th className="text-left font-medium px-4 py-3">
                        Ngày tạo
                      </th>
                      <th className="text-left font-medium px-4 py-3">
                        Trạng thái
                      </th>
                      <th className="text-left font-medium px-4 py-3">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {forms.map((form) => (
                      <tr key={form.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                          {form.name}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {form.formTitle || form.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {form.numberOfParticipants ?? 0}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatDate(form.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-md border text-xs font-semibold px-0 ${
                              (form.status || "DRAFT").toUpperCase() ===
                              "PUBLISH"
                                ? ""
                                : (form.status || "DRAFT").toUpperCase() ===
                                  "DRAFT"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-orange-50 text-orange-700 border-orange-200"
                            }`}
                            style={
                              (form.status || "DRAFT").toUpperCase() ===
                              "PUBLISH"
                                ? {
                                    backgroundColor: "#E6FFED",
                                    color: "#0FA958",
                                    borderColor: "#0FA958",
                                  }
                                : undefined
                            }
                          >
                            <select
                              value={(form.status || "DRAFT").toUpperCase()}
                              onChange={(e) =>
                                handleStatusChange(form.id, e.target.value)
                              }
                              className="appearance-none bg-transparent pl-2 pr-6 py-1 rounded-md text-current outline-none border-none cursor-pointer"
                            >
                              <option value="PUBLISH">ĐÃ XUẤT BẢN</option>
                              <option value="DRAFT">NHÁP</option>
                              <option value="ARCHIVED">ĐÃ ĐÓNG</option>
                            </select>
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditForm(form)}
                              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                            >
                              Chỉnh sửa
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/manage/results/${form.id}`)
                              }
                              className="rounded-md bg-[#377CFB] px-3 py-1.5 text-white text-xs hover:bg-[#2e6de0]"
                            >
                              Xem kết quả
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalForms > pageSize && (
                <div className="px-4 py-3 flex items-center justify-between border-t bg-white">
                  <div className="text-sm text-gray-600">
                    Hiển thị {(currentPage - 1) * pageSize + 1} -{" "}
                    {Math.min(currentPage * pageSize, totalForms)} trong{" "}
                    {totalForms}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      « Trước
                    </button>
                    {Array.from(
                      { length: Math.ceil(totalForms / pageSize) },
                      (_, i) => i + 1
                    ).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`rounded-md px-3 py-1.5 text-sm ${
                          currentPage === pageNum
                            ? "bg-[#377CFB] text-white"
                            : "border border-gray-300 bg-white hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(p + 1, Math.ceil(totalForms / pageSize))
                        )
                      }
                      disabled={
                        currentPage === Math.ceil(totalForms / pageSize)
                      }
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      Sau »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Merge: Keep HEAD's custom card-based UI with pagination - master's CommonTable approach can be added later if needed */}
    </div>
  );
}
