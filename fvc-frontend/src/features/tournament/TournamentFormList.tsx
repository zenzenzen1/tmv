import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import { useToast } from "../../components/common/ToastContext";

type FormConfig = {
  id: string;
  name: string;
  description: string;
  formType: string;
  createdAt: string;
  updatedAt: string;
  fieldCount: number;
  status: string;
};

export default function TournamentFormList() {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalForms, setTotalForms] = useState(0);
  const [allForms, setAllForms] = useState<FormConfig[]>([]);

  useEffect(() => {
    loadForms();
  }, []);

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
  }, [currentPage, allForms, pageSize]);

  const loadForms = async () => {
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

        const formsData: FormConfig[] = dataArray.map((form: FormConfig) => ({
          id: form.id,
          name: form.name,
          description: form.description,
          formType: form.formType,
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
          fieldCount: 0,
          status: form.status ? form.status.toUpperCase() : "DRAFT",
        }));

        console.log("All mapped forms:", formsData);

        // Show all formTypes to understand what we have
        const allFormTypes = formsData.map((f) => f.formType);
        console.log("All formTypes found:", allFormTypes);

        // Filter to show only COMPETITION_REGISTRATION forms
        const filteredForms = formsData.filter((form: FormConfig) => {
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
  };

  const handleEditForm = (formId: string) => {
    navigate(`/manage/tournament-forms/${formId}/edit`);
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
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/manage")}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              ⟵ Quay lại
            </button>
            <h1 className="text-[15px] font-semibold text-gray-900">
              Quản lý Form đăng ký giải đấu
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNew}
              className="rounded-md bg-[#377CFB] px-4 py-2 text-white text-sm hover:bg-[#2e6de0]"
            >
              + Tạo Form Mới
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {loading && (
            <div className="text-center py-8 text-gray-600">
              Đang tải danh sách form...
            </div>
          )}

          {error && (
            <div className="text-red-600 text-center py-8">{error}</div>
          )}

          {!loading && !error && (
            <>
              <div className="mb-4">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">{totalForms}</span> form đã
                  tạo
                </div>
              </div>

              <div className="space-y-3">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEditForm(form.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {form.name}
                          </h3>
                          <span className="rounded-md border px-2 py-1 text-[11px] font-semibold text-gray-600">
                            Đăng ký giải đấu
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          {form.description}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{form.fieldCount} câu hỏi</span>
                          <span>Tạo: {formatDate(form.createdAt)}</span>
                          <span>Cập nhật: {formatDate(form.updatedAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Status Dropdown */}
                        <select
                          value={form.status || "DRAFT"}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(form.id, e.target.value);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium border-2 transition-colors ${
                            form.status === "PUBLISH"
                              ? "bg-green-50 text-green-800 border-green-300 hover:bg-green-100"
                              : form.status === "DRAFT"
                              ? "bg-yellow-50 text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                              : form.status === "ARCHIVED"
                              ? "bg-orange-50 text-orange-800 border-orange-300 hover:bg-orange-100"
                              : "bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          <option
                            value="DRAFT"
                            className="bg-yellow-50 text-yellow-800"
                          >
                            Draft
                          </option>
                          <option
                            value="PUBLISH"
                            className="bg-green-50 text-green-800"
                          >
                            Publish
                          </option>
                          <option
                            value="ARCHIVED"
                            className="bg-orange-50 text-orange-800"
                          >
                            Archived
                          </option>
                        </select>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditForm(form.id);
                          }}
                          className="rounded-md bg-[#377CFB] px-3 py-1.5 text-white text-sm hover:bg-[#2e6de0]"
                        >
                          Chỉnh sửa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {forms.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-[14px] mb-2">Chưa có form nào</div>
                  <div className="text-[12px]">
                    Nhấn "Tạo Form Mới" để bắt đầu
                  </div>
                </div>
              )}

              {/* Pagination */}
              {(() => {
                console.log("Pagination condition check:", {
                  totalForms,
                  pageSize,
                  condition: totalForms > pageSize,
                });
                return totalForms > pageSize;
              })() && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Hiển thị {(currentPage - 1) * pageSize + 1} -{" "}
                    {Math.min(currentPage * pageSize, totalForms)} trong{" "}
                    {totalForms} form
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
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
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, Math.ceil(totalForms / pageSize))
                        )
                      }
                      disabled={
                        currentPage === Math.ceil(totalForms / pageSize)
                      }
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
