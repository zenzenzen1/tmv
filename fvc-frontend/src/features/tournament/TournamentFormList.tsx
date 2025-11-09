import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import { useToast } from "../../components/common/ToastContext";
import Pagination from "../../components/common/Pagination";

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
  const toast = useToast();
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
  const [pageSize, setPageSize] = useState(10);
  const [totalForms, setTotalForms] = useState(0);

  const loadForms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Request all data using all=true to bypass pagination limit, then filter client-side
      const response = await api.get<{
        content: FormConfig[];
        totalElements: number;
        totalPages: number;
      }>(API_ENDPOINTS.TOURNAMENT_FORMS.BASE, {
        all: true, // Request all data without pagination limit
        search: search.trim() || undefined,
      });

      if (response.success && response.data) {
        // Handle pagination response
        let dataArray: FormConfig[] = [];

        if (Array.isArray(response.data)) {
          // Direct array response (fallback)
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

        // Map to FormConfig
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

        // Filter to show only COMPETITION_REGISTRATION forms
        let filteredForms = formsData.filter(
          (form: FormConfig) => form.formType === "COMPETITION_REGISTRATION"
        );

        // Apply status filter client-side
        if (statusFilter) {
          filteredForms = filteredForms.filter(
            (f) => (f.status || "DRAFT").toUpperCase() === statusFilter
          );
        }

        // Apply search filter client-side (if not already done by API)
        if (search.trim().length > 0) {
          const q = search.trim().toLowerCase();
          filteredForms = filteredForms.filter(
            (f) =>
              (f.formTitle || f.name || "").toLowerCase().includes(q) ||
              (f.description || "").toLowerCase().includes(q)
          );
        }

        // Set total after all filters
        setTotalForms(filteredForms.length);

        // Client-side pagination
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedForms = filteredForms.slice(startIndex, endIndex);
        setForms(paginatedForms);
      } else {
        setError(response.message || "Failed to fetch forms");
        toast.error(response.message || "Tải danh sách form thất bại");
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || "Lỗi khi tải danh sách form");
      toast.error((err as Error)?.message || "Tải danh sách form thất bại");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, toast, statusFilter, search]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, search, pageSize]);

  const handleEditForm = (form: FormConfig) => {
    navigate(`/manage/tournament-forms/${form.id}/edit`);
  };

  const handleViewForm = (form: FormConfig) => {
    navigate(`/manage/tournament-forms/${form.id}/view`);
  };

  const handleCreateNew = () => {
    navigate("/manage/tournament-forms/new");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
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
                            className={`rounded-md px-2 py-1 text-xs border ${
                              (form.status || "DRAFT").toUpperCase() ===
                              "PUBLISH"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : (form.status || "DRAFT").toUpperCase() ===
                                  "ARCHIVED"
                                ? "bg-rose-50 text-rose-600 border-rose-200"
                                : (form.status || "DRAFT").toUpperCase() ===
                                  "POSTPONE"
                                ? "bg-gray-100 text-gray-700 border-gray-300"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {(form.status || "DRAFT").toUpperCase() ===
                            "PUBLISH"
                              ? "Đã công khai"
                              : (form.status || "DRAFT").toUpperCase() ===
                                "ARCHIVED"
                              ? "Lưu trữ"
                              : (form.status || "DRAFT").toUpperCase() ===
                                "POSTPONE"
                              ? "Hoãn"
                              : "Nháp"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {form.status === "PUBLISH" && (
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await api.get<{
                                      publicLink?: string;
                                      publicSlug?: string;
                                    }>(
                                      API_ENDPOINTS.TOURNAMENT_FORMS.BY_ID(
                                        form.id
                                      )
                                    );
                                    if (
                                      response.success &&
                                      response.data?.publicLink
                                    ) {
                                      const fullUrl = `${window.location.origin}${response.data.publicLink}`;
                                      await navigator.clipboard.writeText(
                                        fullUrl
                                      );
                                      toast.success("Đã copy link công khai!");
                                    } else {
                                      toast.error(
                                        "Form chưa có link công khai"
                                      );
                                    }
                                  } catch (e) {
                                    console.error(
                                      "Failed to get public link",
                                      e
                                    );
                                    toast.error("Không thể lấy link công khai");
                                  }
                                }}
                                className="rounded-md bg-emerald-500 px-3 py-1 text-xs text-white hover:bg-emerald-600"
                                title="Copy link công khai"
                              >
                                📋 Link
                              </button>
                            )}
                            <button
                              onClick={() => handleViewForm(form)}
                              className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                            >
                              Xem
                            </button>
                            <button
                              onClick={() => handleEditForm(form)}
                              className="rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                            >
                              Sửa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalForms > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalForms / pageSize)}
                  totalElements={totalForms}
                  pageSize={pageSize}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                  }}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  showPageSizeSelector={true}
                  pageSizeOptions={[5, 10, 15, 20]}
                />
              )}
            </>
          )}
        </div>
      </div>
      {/* Merge: Keep HEAD's custom card-based UI with pagination - master's CommonTable approach can be added later if needed */}
    </div>
  );
}
