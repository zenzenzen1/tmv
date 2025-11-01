import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../components/common/ToastContext';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../config/endpoints';
import { validateEmail, validatePhoneNumber, validateStudentId, validateRequired } from '../../utils/validation';

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
  const toast = useToast();
  
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
        response = await apiService.get<any>(`${API_ENDPOINTS.APPLICATION_FORMS.BASE}/public/${slug}`);
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
    
    // Clear field error when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  // Validation function for individual fields
  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} là bắt buộc`;
    }

    // Skip validation if field is not required and empty
    if (!field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return null;
    }

    const stringValue = String(value).trim();

    // Email validation
    if (field.name.toLowerCase().includes('email') || field.label.toLowerCase().includes('email')) {
      const emailValidation = validateEmail(stringValue, { required: field.required });
      return emailValidation.isValid ? null : emailValidation.errorMessage || null;
    }

    // Phone validation
    if (field.name.toLowerCase().includes('phone') || 
        field.name.toLowerCase().includes('sdt') ||
        field.label.toLowerCase().includes('phone') ||
        field.label.toLowerCase().includes('số điện thoại')) {
      const phoneValidation = validatePhoneNumber(stringValue, { required: field.required });
      return phoneValidation.isValid ? null : phoneValidation.errorMessage || null;
    }

    // Student ID validation
    if (field.name.toLowerCase().includes('mssv') || 
        field.name.toLowerCase().includes('student') ||
        field.label.toLowerCase().includes('mssv') ||
        field.label.toLowerCase().includes('mã số sinh viên')) {
      const studentIdValidation = validateStudentId(stringValue, { required: field.required });
      return studentIdValidation.isValid ? null : studentIdValidation.errorMessage || null;
    }

    return null;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    if (!formConfig) return false;

    const errors: Record<string, string> = {};
    let isValid = true;

    formConfig.fields.forEach(field => {
      const fieldError = validateField(field, formData[field.name]);
      if (fieldError) {
        errors[field.name] = fieldError;
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formConfig) return;

    // Validate form before submission
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    try {
      setSubmitting(true);
      
      // Map dynamic form data to SubmittedFormData structure
      // Extract common fields based on field names
      const mappedFormData: any = {};
      
      // Map fields by common names
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        
        // Map common field names
        if (key.toLowerCase().includes('ho_ten') || key.toLowerCase().includes('hoten') || key.toLowerCase().includes('fullname') || key === 'fullName') {
          mappedFormData.fullName = String(value || '').trim();
        } else if (key.toLowerCase().includes('ten') || key === 'name') {
          mappedFormData.name = String(value || '').trim();
        } else if (key.toLowerCase().includes('email')) {
          mappedFormData.email = String(value || '').trim();
        } else if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('sdt') || key.toLowerCase().includes('so_dien_thoai')) {
          // Normalize phone number to backend format (0x... or +84x...)
          let phoneValue = String(value || '').trim();
          // Remove spaces and special chars except + and digits
          phoneValue = phoneValue.replace(/[\s\-\(\)]/g, '');
          // If starts with 84 but not +84, add +
          if (phoneValue.startsWith('84') && !phoneValue.startsWith('+84')) {
            phoneValue = '+' + phoneValue;
          }
          // If starts with country code without +, add it
          if (phoneValue.length > 0 && !phoneValue.startsWith('0') && !phoneValue.startsWith('+84')) {
            // Assume it's local format without 0
            if (/^[3-9]\d{8,9}$/.test(phoneValue)) {
              phoneValue = '0' + phoneValue;
            }
          }
          mappedFormData.phone = phoneValue;
        } else if (key.toLowerCase().includes('mssv') || key.toLowerCase().includes('student') || key.toLowerCase().includes('studentcode')) {
          mappedFormData.studentCode = String(value || '').trim().toUpperCase();
        } else if (key.toLowerCase().includes('mo_ta') || key.toLowerCase().includes('mota') || key.toLowerCase().includes('bio') || key.toLowerCase().includes('reason')) {
          mappedFormData.reason = String(value || '').trim();
        } else if (key.toLowerCase().includes('club')) {
          mappedFormData.club = String(value || '').trim();
        }
      });
      
      // Ensure at least fullName or name exists
      if (!mappedFormData.fullName && !mappedFormData.name) {
        // Try to find any name-like field
        const nameField = Object.keys(formData).find(k => 
          k.toLowerCase().includes('ho') || 
          k.toLowerCase().includes('ten') || 
          k.toLowerCase().includes('name')
        );
        if (nameField) {
          mappedFormData.fullName = String(formData[nameField] || '').trim();
        }
      }
      
      // Clean up empty values (optional fields)
      Object.keys(mappedFormData).forEach(key => {
        if (mappedFormData[key] === '' || mappedFormData[key] === null || mappedFormData[key] === undefined) {
          delete mappedFormData[key];
        }
      });
      
      const response = await apiService.post<any>(API_ENDPOINTS.SUBMITTED_FORMS.BASE, {
        formType: formConfig.formType,
        formData: mappedFormData, // Send as object, not string
        applicationFormConfigId: formConfig.id
      });

      if (response.success) {
        toast.success('Đăng ký thành công!');
        navigate('/');
      } else {
        toast.error('Lỗi khi đăng ký: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error('Lỗi khi đăng ký: ' + (error?.message || 'Network error'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const hasError = fieldErrors[field.name];
    const errorClass = hasError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500';

    switch (field.fieldType) {
      case 'TEXT':
        return (
          <div>
            <input
              type="text"
              className={`w-full rounded-md border px-3 py-2 focus:outline-none ${errorClass}`}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={`Nhập ${field.label.toLowerCase()}`}
              required={field.required}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );
      
      case 'EMAIL':
        return (
          <div>
            <input
              type="email"
              className={`w-full rounded-md border px-3 py-2 focus:outline-none ${errorClass}`}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={`Nhập ${field.label.toLowerCase()}`}
              required={field.required}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );
      
      case 'DATE':
        return (
          <div>
            <input
              type="date"
              className={`w-full rounded-md border px-3 py-2 focus:outline-none ${errorClass}`}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              required={field.required}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );
      
      case 'SELECT':
        return (
          <div>
            <select
              className={`w-full rounded-md border px-3 py-2 focus:outline-none ${errorClass}`}
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
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );
      
      case 'CHECKBOX':
        return (
          <div>
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
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );
      
      case 'FILE':
        return (
          <div>
            <input
              type="file"
              className={`w-full rounded-md border px-3 py-2 focus:outline-none ${errorClass}`}
              onChange={(e) => handleInputChange(field.name, e.target.files?.[0])}
              required={field.required}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );
      
      default:
        return (
          <div>
            <input
              type="text"
              className={`w-full rounded-md border px-3 py-2 focus:outline-none ${errorClass}`}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={`Nhập ${field.label.toLowerCase()}`}
              required={field.required}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
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
