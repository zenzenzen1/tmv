import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../config/endpoints';

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
  fields: FormField[];
};

export default function FormRegistrationPage() {
  const navigate = useNavigate();
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id || slug) {
      loadFormConfig();
    }
  }, [id, slug]);

  const loadFormConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (slug) {
        response = await apiService.get<any>(API_ENDPOINTS.APPLICATION_FORMS.PUBLIC_BY_SLUG(slug));
      } else {
        response = await apiService.get<any>(API_ENDPOINTS.APPLICATION_FORMS.BY_ID(id!));
      }
      
      console.log('API response:', response);
      
      if (response.success && response.data) {
        setFormConfig(response.data);
        console.log('Form config loaded:', response.data);
        
        // Initialize form data with empty values
        const initialData: Record<string, any> = {};
        response.data.fields?.forEach((field: FormField) => {
          initialData[field.name] = '';
        });
        setFormData(initialData);
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

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formConfig) return;

    try {
      setSubmitting(true);
      
      const response = await apiService.post<any>(API_ENDPOINTS.SUBMITTED_FORMS.BASE, {
        formType: formConfig.formType,
        formData: JSON.stringify(formData),
        applicationFormConfigId: formConfig.id
      });

      if (response.success) {
        alert('Đăng ký thành công!');
        navigate('/');
      } else {
        alert('Lỗi khi đăng ký: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      alert('Lỗi khi đăng ký: ' + (error?.message || 'Network error'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';

    switch (field.fieldType) {
      case 'TEXT':
        return (
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={`Nhập ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );
      
      case 'DATE':
        return (
          <input
            type="date"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
          />
        );
      
      case 'SELECT':
        return (
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
          >
            <option value="">Chọn một tùy chọn</option>
            {field.options?.split(',').map((option, index) => (
              <option key={index} value={option.trim()}>
                {option.trim()}
              </option>
            ))}
          </select>
        );
      
      case 'CHECKBOX':
        return (
          <div className="space-y-2">
            {field.options?.split(',').map((option, index) => (
              <label key={index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={value.includes(option.trim())}
                  onChange={(e) => {
                    const currentValues = value || [];
                    if (e.target.checked) {
                      handleInputChange(field.name, [...currentValues, option.trim()]);
                    } else {
                      handleInputChange(field.name, currentValues.filter((v: string) => v !== option.trim()));
                    }
                  }}
                />
                <span className="text-sm text-gray-700">{option.trim()}</span>
              </label>
            ))}
          </div>
        );
      
      case 'FILE':
        return (
          <input
            type="file"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            onChange={(e) => handleInputChange(field.name, e.target.files?.[0])}
            required={field.required}
          />
        );
      
      default:
        return (
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={`Nhập ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-600">Đang tải form...</div>
        </div>
      </div>
    );
  }

  if (error || !formConfig) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error || 'Không tìm thấy form'}</div>
          <button
            onClick={() => navigate('/')}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{formConfig.name}</h1>
          <p className="text-gray-600">{formConfig.description}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              {formConfig.fields
                ?.sort((a, b) => a.sortOrder - b.sortOrder)
                .map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
            </div>

            {/* Submit Button */}
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Đang gửi...' : 'Gửi đăng ký'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
