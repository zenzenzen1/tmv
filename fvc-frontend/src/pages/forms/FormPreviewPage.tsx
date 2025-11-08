import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../config/endpoints';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

type FormField = {
  id: string;
  label: string;
  name: string;
  fieldType: string;
  required: boolean;
  sortOrder: number;
  options?: string;
};

type FormConfig = {
  id: string;
  name: string;
  description: string;
  formType: string;
  status: string;
  endDate?: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
};

export default function FormPreviewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadFormConfig();
    }
  }, [id]);

  const loadFormConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading form config for preview, ID:', id);
      
      const response = await apiService.get<any>(API_ENDPOINTS.APPLICATION_FORMS.BY_ID(id!));
      
      console.log('API response:', response);
      
      if (response.success && response.data) {
        setFormConfig(response.data);
        console.log('Form config loaded for preview:', response.data);
      } else {
        setError('Không tìm thấy form');
      }
    } catch (err: any) {
      console.error('Error loading form config:', err);
      setError('Không thể tải cấu hình form: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
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

  const getStatusBadge = (status: string) => {
    const statusMap = {
      DRAFT: { label: "Nháp", className: "bg-gray-100 text-gray-800" },
      PUBLISH: { label: "Đã công khai", className: "bg-green-100 text-green-800" },
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderFieldPreview = (field: FormField) => {
    const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none";
    
    switch (field.fieldType) {
      case 'TEXT':
        return (
          <input
            type="text"
            className={baseClasses}
            placeholder={`Nhập ${field.label.toLowerCase()}`}
            disabled
            style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
          />
        );
      case 'EMAIL':
        return (
          <input
            type="email"
            className={baseClasses}
            placeholder="example@email.com"
            disabled
            style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
          />
        );
      case 'TEXTAREA':
        return (
          <textarea
            className={`${baseClasses} h-20 resize-none`}
            placeholder={`Nhập ${field.label.toLowerCase()}`}
            disabled
            style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
          />
        );
      case 'SELECT':
        const options = field.options ? field.options.split(',').map(opt => opt.trim()) : [];
        return (
          <select 
            className={`${baseClasses} bg-gray-50 text-gray-500`} 
            disabled
            style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
          >
            <option value="">Chọn {field.label.toLowerCase()}</option>
            {options.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'RADIO':
        const radioOptions = field.options ? field.options.split(',').map(opt => opt.trim()) : [];
        return (
          <div className="space-y-2">
            {radioOptions.map((option, index) => (
              <label key={index} className="flex items-center text-gray-500">
                <input
                  type="radio"
                  name={field.name}
                  className="mr-2"
                  disabled
                />
                {option}
              </label>
            ))}
          </div>
        );
      case 'CHECKBOX':
        const checkboxOptions = field.options ? field.options.split(',').map(opt => opt.trim()) : [];
        return (
          <div className="space-y-2">
            {checkboxOptions.map((option, index) => (
              <label key={index} className="flex items-center text-gray-500">
                <input
                  type="checkbox"
                  className="mr-2"
                  disabled
                />
                {option}
              </label>
            ))}
          </div>
        );
      default:
        return (
          <input
            type="text"
            className={baseClasses}
            placeholder={`Nhập ${field.label.toLowerCase()}`}
            disabled
            style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ErrorMessage error={error} />
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Không tìm thấy form</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{formConfig.name}</h1>
              <p className="mt-2 text-lg text-gray-600">{formConfig.description}</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Quay lại
            </button>
          </div>
          
          {/* Form Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-500">Loại form</div>
              <div className="font-medium">{getFormTypeLabel(formConfig.formType)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-500">Trạng thái</div>
              <div className="mt-1">{getStatusBadge(formConfig.status)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-500">Ngày kết thúc</div>
              <div className="font-medium">
                {formConfig.endDate ? formatDate(formConfig.endDate) : 'Không giới hạn'}
              </div>
            </div>
          </div>
        </div>

        {/* Form Preview */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{formConfig.name}</h2>
              {formConfig.description && (
                <p className="text-gray-600 mb-4">{formConfig.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {getFormTypeLabel(formConfig.formType)}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {getStatusBadge(formConfig.status)}
                </span>
                {formConfig.endDate && (
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    Hết hạn: {formatDate(formConfig.endDate)}
                  </span>
                )}
              </div>
            </div>

            <form className="space-y-6">
              {formConfig.fields
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {index + 1}. {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderFieldPreview(field)}
                    {field.required && (
                      <p className="text-xs text-red-500">Trường bắt buộc</p>
                    )}
                    {field.fieldType === 'SELECT' && field.options && (
                      <p className="text-xs text-gray-500">
                        Có {field.options.split(',').length} lựa chọn
                      </p>
                    )}
                  </div>
                ))}

              {/* Form Statistics */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Thống kê form</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tổng số câu hỏi:</span>
                    <span className="ml-2 font-medium">{formConfig.fields.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Câu hỏi bắt buộc:</span>
                    <span className="ml-2 font-medium">
                      {formConfig.fields.filter(f => f.required).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Loại câu hỏi:</span>
                    <span className="ml-2 font-medium">
                      {[...new Set(formConfig.fields.map(f => f.fieldType))].join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Trạng thái:</span>
                    <span className="ml-2 font-medium">
                      {formConfig.status === 'PUBLISH' ? 'Đang hoạt động' : 'Bản nháp'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button Preview */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  Gửi đăng ký
                </button>
                <p className="mt-2 text-sm text-gray-500">
                  Nút này sẽ hoạt động khi form được publish
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Form Details */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chi tiết</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">ID Form:</span>
              <span className="ml-2 font-mono text-gray-900">{formConfig.id}</span>
            </div>
            <div>
              <span className="text-gray-500">Số trường:</span>
              <span className="ml-2 font-medium">{formConfig.fields.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Tạo lúc:</span>
              <span className="ml-2">{formatDate(formConfig.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-500">Cập nhật lúc:</span>
              <span className="ml-2">{formatDate(formConfig.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
