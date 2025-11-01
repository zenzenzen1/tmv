import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import Pagination from "../../components/common/Pagination";
import { useToast } from "../../components/common/ToastContext";

interface FormConfig {
  id: string;
  name: string;
  description: string;
  formType: string;
  endDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  publicLink?: string;
}

export default function FormManagementPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadForms();
  }, [page, pageSize, searchQuery, dateFrom, dateTo, statusFilter]);

  const loadForms = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get<any>(
        `${API_ENDPOINTS.APPLICATION_FORMS.BASE}/paginated`,
        {
          page: page - 1,
          size: pageSize,
          search: searchQuery || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          status: statusFilter || undefined,
        }
      );

      if (response.success && response.data) {
        console.log("ManagementPage API response:", response);
        console.log("All forms before filtering:", response.data.content || []);

        // Debug each form's formType
        (response.data.content || []).forEach((form: any, index: number) => {
          console.log(`Form ${index}:`, {
            id: form.id,
            name: form.name,
            formType: form.formType,
            allProperties: Object.keys(form),
            fullForm: form,
          });
        });

        // Only show CLUB_REGISTRATION forms
        const clubForms = (response.data.content || []).filter((form: any) => {
          console.log(
            `Form "${form.name}": formType="${form.formType}", isClubForm=${
              form.formType === "CLUB_REGISTRATION"
            }`
          );
          return form.formType === "CLUB_REGISTRATION";
        });

        console.log("Filtered club forms:", clubForms);
        setForms(clubForms);
        setTotalElements(clubForms.length);
      } else {
        setError("Không thể tải danh sách form");
      }
    } catch (err) {
      console.error("Error loading forms:", err);
      setError("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (formId: string) => {
    navigate(`/manage/forms/${formId}/edit`);
  };

  const handleView = (formId: string) => {
    navigate(`/manage/forms/${formId}/view`);
  };

  const handleCreate = () => {
    navigate("/manage/forms/new");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      DRAFT: { label: "Nháp", className: "bg-gray-100 text-gray-800" },
<<<<<<< HEAD
      PUBLISH: {
        label: "Đã xuất bản",
        className: "bg-green-100 text-green-800",
      },
      ARCHIVED: {
        label: "Đã lưu trữ",
        className: "bg-yellow-100 text-yellow-800",
      },
      POSTPONE: {
        label: "Tạm hoãn",
        className: "bg-orange-100 text-orange-800",
      },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  const getFormTypeLabel = (formType: string) => {
    const formTypeMap = {
      CLUB_REGISTRATION: "Đăng ký câu lạc bộ",
      COMPETITION_REGISTRATION: "Đăng ký giải đấu",
      TOURNAMENT_REGISTRATION: "Đăng ký giải đấu",
      MEMBER_REGISTRATION: "Đăng ký thành viên",
    };

    return formTypeMap[formType as keyof typeof formTypeMap] || formType;
  };

  const copyPublicLink = async (form: FormConfig) => {
    try {
      if (form.status !== "PUBLISH" || !form.publicLink) return;
      const absoluteUrl = `${window.location.origin}${form.publicLink}`;
      await navigator.clipboard.writeText(absoluteUrl);
      toast.success("Đã copy link công khai");
    } catch (e) {
      console.error("Copy link failed", e);
      toast.error("Không thể copy link");
    }
  };

  const totalPages = Math.ceil(totalElements / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Form</h1>
          <p className="text-gray-600">Quản lý các form đăng ký và cấu hình</p>
        </div>
        <button
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Tạo Form Mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Bộ lọc</h3>
          <button
            onClick={() => {
              setSearchQuery("");
              setDateFrom("");
              setDateTo("");
              setStatusFilter("");
              setPage(1);
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tên form..."
              value={searchQuery}
              onChange={(e) => {
                setPage(1);
                setSearchQuery(e.target.value);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
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
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
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
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Nháp</option>
              <option value="PUBLISH">Đã công khai</option>
              <option value="ARCHIVED">Đã lưu trữ</option>
              <option value="POSTPONE">Tạm hoãn</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Hiển thị {forms.length} trong {totalElements} kết quả
        </div>
      </div>

      {/* Content */}
      {error && <ErrorMessage error={error} />}

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
          {forms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">Không có form nào</div>
              <div className="text-gray-400 text-sm mt-2">
                Tạo form đầu tiên để bắt đầu
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên Form
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày kết thúc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cập nhật
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forms.map((form) => (
                    <tr key={form.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {form.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {form.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getFormTypeLabel(form.formType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(form.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {form.endDate
                          ? formatDate(form.endDate)
                          : "Không giới hạn"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(form.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEdit(form.id)}
                            aria-label="Chỉnh sửa"
                            title="Chỉnh sửa"
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path d="M21.731 2.269a2.625 2.625 0 00-3.714 0l-1.157 1.157 3.714 3.714 1.157-1.157a2.625 2.625 0 000-3.714z" />
                              <path d="M19.513 8.199l-3.714-3.714-9.193 9.193a5.25 5.25 0 00-1.32 2.214l-.8 2.684a.75.75 0 00.933.933l2.684-.8a5.25 5.25 0 002.214-1.32l9.193-9.193z" />
                              <path d="M5.25 5.25a3 3 0 00-3 3v10.5A3 3 0 005.25 21.75H15.75a3 3 0 003-3V12a.75.75 0 00-1.5 0v6.75a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5H12a.75.75 0 000-1.5H5.25z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleView(form.id)}
                            aria-label="Xem"
                            title="Xem"
                            className="text-green-600 hover:text-green-800 transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path d="M1.5 12s3.75-7.5 10.5-7.5S22.5 12 22.5 12 18.75 19.5 12 19.5 1.5 12 1.5 12z" />
                              <path d="M12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => copyPublicLink(form)}
                            aria-label="Copy link công khai"
                            title={form.status === 'PUBLISH' && form.publicLink ? 'Copy link công khai' : 'Chỉ khả dụng khi đã công khai'}
                            disabled={form.status !== 'PUBLISH' || !form.publicLink}
                            className={`transition-colors ${form.status === 'PUBLISH' && form.publicLink ? 'text-gray-700 hover:text-gray-900' : 'text-gray-300 cursor-not-allowed'}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path d="M15.75 6a3.75 3.75 0 013.75 3.75v6.75A3.75 3.75 0 0115.75 20.25H9a3.75 3.75 0 01-3.75-3.75V9.75A3.75 3.75 0 019 6h6.75z" />
                              <path d="M7.5 3.75A3.75 3.75 0 003.75 7.5V15a.75.75 0 001.5 0V7.5a2.25 2.25 0 012.25-2.25H15a.75.75 0 000-1.5H7.5z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          // Reset to first page when changing page size
          setPage(1);
          setPageSize(size);
        }}
        showPageSizeSelector={true}
        pageSizeOptions={[5, 10, 15, 20]}
      />
    </div>
  );
}
