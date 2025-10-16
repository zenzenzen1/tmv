import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../config/endpoints';

type FormConfig = {
  id: string;
  name: string;
  description: string;
  formType: string;
  createdAt: string;
  updatedAt: string;
  fieldCount: number;
};

export default function FormListPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.get<any>(API_ENDPOINTS.APPLICATION_FORMS.BASE);
      
      if (response.success && response.data) {
        const formsData: FormConfig[] = response.data.map((form: any) => ({
          id: form.id,
          name: form.name,
          description: form.description,
          formType: form.formType,
          createdAt: form.createdAt,
          updatedAt: form.updatedAt,
          fieldCount: form.fields?.length || 0
        }));
        
        setForms(formsData);
      } else {
        setError(response.message || 'Failed to fetch forms');
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi tải danh sách form');
    } finally {
      setLoading(false);
    }
  };

  const handleEditForm = (formId: string) => {
    navigate(`/manage/forms/${formId}/edit`); 
  };

  const handleViewForm = (formId: string) => {
    navigate(`/manage/forms/${formId}/view`);
  };

  const handleCreateNew = () => {
    navigate('/manage/forms/new');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-5xl space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-[13px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              ⟵ Quay lại
            </button>
            <h1 className="text-[15px] font-semibold text-gray-900">Quản lý Form</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNew}
              className="rounded-md bg-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white shadow hover:bg-[#1f4ec3]"
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
            <div className="text-red-600 text-center py-8">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="mb-4">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">{forms.length}</span> form đã tạo
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
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-[14px] font-semibold text-gray-900">
                            {form.name}
                          </h3>
                          <span className="rounded-md border px-2 py-1 text-[11px] font-semibold text-gray-600">
                            {form.formType === 'CLUB_REGISTRATION' ? 'Đăng ký câu lạc bộ' : 'Đăng ký giải đấu'}
                          </span>
                        </div>
                        <p className="text-[13px] text-gray-600 mb-2">
                          {form.description}
                        </p>
                        <div className="flex items-center gap-4 text-[12px] text-gray-500">
                          <span>{form.fieldCount} câu hỏi</span>
                          <span>Tạo: {formatDate(form.createdAt)}</span>
                          <span>Cập nhật: {formatDate(form.updatedAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewForm(form.id);
                          }}
                          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                          Xem trước
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditForm(form.id);
                          }}
                          className="rounded-md bg-[#2563eb] px-3 py-2 text-[12px] font-medium text-white shadow-sm hover:bg-[#1f4ec3]"
                        >
                          Chỉnh sửa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {forms.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-[14px] mb-2">Chưa có form nào</div>
                    <div className="text-[12px]">Nhấn "Tạo Form Mới" để bắt đầu</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
