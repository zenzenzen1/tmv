import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
import { API_ENDPOINTS } from "../../config/endpoints";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import Pagination from "../../components/common/Pagination";

interface FormConfig {
  id: string;
  name: string;
  description: string;
  formType: string;
  endDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function FormManagementPage() {
  const navigate = useNavigate();
  
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
      
      const response = await apiService.get<any>(`${API_ENDPOINTS.APPLICATION_FORMS.BASE}/paginated`, {
        page: page - 1,
        size: pageSize,
        search: searchQuery || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        status: statusFilter || undefined,
      });
      
      if (response.success && response.data) {
        setForms(response.data.content || []);
        setTotalElements(response.data.totalElements || 0);
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
    navigate(`/manage/forms/edit/${formId}`);
  };

  const handleView = (formId: string) => {
    navigate(`/manage/forms/view/${formId}`);
  };

  const handleCreate = () => {
    navigate("/manage/forms/edit/new");
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
      PUBLISH: { label: "Đã xuất bản", className: "bg-green-100 text-green-800" },
      ARCHIVED: { label: "Đã lưu trữ", className: "bg-yellow-100 text-yellow-800" },
      POSTPONE: { label: "Tạm hoãn", className: "bg-orange-100 text-orange-800" },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, className: "bg-gray-100 text-gray-800" };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tên form..."
              value={searchQuery}
              onChange={(e) => { setPage(1); setSearchQuery(e.target.value); }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setPage(1); setDateFrom(e.target.value); }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setPage(1); setDateTo(e.target.value); }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Nháp</option>
              <option value="PUBLISH">Đã xuất bản</option>
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
              <div className="text-gray-400 text-sm mt-2">Tạo form đầu tiên để bắt đầu</div>
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
                          <div className="text-sm font-medium text-gray-900">{form.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{form.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{getFormTypeLabel(form.formType)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(form.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {form.endDate ? formatDate(form.endDate) : "Không giới hạn"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(form.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(form.id)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Chỉnh sửa
                        </button>
                        <button 
                          onClick={() => handleView(form.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Xem
                        </button>
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
        onPageSizeChange={setPageSize}
        showPageSizeSelector={true}
        pageSizeOptions={[5, 10, 20, 50]}
      />
    </div>
  );
}
