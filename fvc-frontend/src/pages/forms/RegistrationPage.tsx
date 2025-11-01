import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../components/common/ToastContext';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../config/endpoints';
import { validateEmail, validatePhoneNumber, validateStudentId } from '../../utils/validation';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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
      
      if (response.success && response.data) {
        setFormConfig(response.data);
        
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
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
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
      const mappedFormData: any = {};
      
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        
        if (key.toLowerCase().includes('ho_ten') || key.toLowerCase().includes('hoten') || key.toLowerCase().includes('fullname') || key === 'fullName') {
          mappedFormData.fullName = String(value || '').trim();
        } else if (key.toLowerCase().includes('ten') || key === 'name') {
          mappedFormData.name = String(value || '').trim();
        } else if (key.toLowerCase().includes('email')) {
          mappedFormData.email = String(value || '').trim();
        } else if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('sdt') || key.toLowerCase().includes('so_dien_thoai')) {
          let phoneValue = String(value || '').trim();
          phoneValue = phoneValue.replace(/[\s\-\(\)]/g, '');
          if (phoneValue.startsWith('84') && !phoneValue.startsWith('+84')) {
            phoneValue = '+' + phoneValue;
          }
          if (phoneValue.length > 0 && !phoneValue.startsWith('0') && !phoneValue.startsWith('+84')) {
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
      
      if (!mappedFormData.fullName && !mappedFormData.name) {
        const nameField = Object.keys(formData).find(k => 
          k.toLowerCase().includes('ho') || 
          k.toLowerCase().includes('ten') || 
          k.toLowerCase().includes('name')
        );
        if (nameField) {
          mappedFormData.fullName = String(formData[nameField] || '').trim();
        }
      }
      
      Object.keys(mappedFormData).forEach(key => {
        if (mappedFormData[key] === '' || mappedFormData[key] === null || mappedFormData[key] === undefined) {
          delete mappedFormData[key];
        }
      });
      
      const response = await apiService.post<any>(API_ENDPOINTS.SUBMITTED_FORMS.BASE, {
        formType: formConfig.formType,
        formData: mappedFormData,
        applicationFormConfigId: formConfig.id
      });

      if (response.success) {
        toast.success('Đăng ký thành công!');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        toast.error('Lỗi khi đăng ký: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Network error';
      toast.error('Lỗi khi đăng ký: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate smart placeholder based on field type and name
  const getPlaceholder = (field: FormField): string => {
    const fieldName = field.name.toLowerCase();
    const fieldLabel = field.label.toLowerCase();
    
    // Email field
    if (field.fieldType === 'EMAIL' || fieldName.includes('email')) {
      return 'example@email.com';
    }
    
    // Phone field
    if (fieldName.includes('phone') || fieldName.includes('sdt') || fieldName.includes('so_dien_thoai') || 
        fieldLabel.includes('số điện thoại') || fieldLabel.includes('phone')) {
      return '0123456789';
    }
    
    // Student ID field
    if (fieldName.includes('mssv') || fieldName.includes('student') || 
        fieldLabel.includes('mssv') || fieldLabel.includes('mã số sinh viên')) {
      return 'HE123456';
    }
    
    // Date field - no placeholder needed
    if (field.fieldType === 'DATE') {
      return '';
    }
    
    // Name field
    if (fieldName.includes('ten') || fieldName.includes('name') || fieldLabel.includes('tên')) {
      return 'Nguyễn Văn A';
    }
    
    // Description/Bio field
    if (fieldName.includes('mo_ta') || fieldName.includes('mota') || fieldName.includes('bio') || 
        fieldLabel.includes('mô tả') || fieldLabel.includes('giới thiệu')) {
      return '';
    }
    
    // Default: empty placeholder (label is enough)
    return '';
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const hasError = fieldErrors[field.name];
    const placeholder = getPlaceholder(field);
    const errorClass = hasError 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';

    switch (field.fieldType) {
      case 'TEXT':
      case 'TEXTAREA':
        return (
          <div>
            {field.fieldType === 'TEXTAREA' ? (
              <textarea
                rows={4}
                className={`w-full rounded-lg border-2 px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${errorClass}`}
                value={value}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                placeholder={placeholder || undefined}
                required={field.required}
              />
            ) : (
              <input
                type="text"
                className={`w-full rounded-lg border-2 px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${errorClass}`}
                value={value}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                placeholder={placeholder || undefined}
                required={field.required}
              />
            )}
            {hasError && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {hasError}
              </p>
            )}
          </div>
        );
      
      case 'EMAIL':
        return (
          <div>
            <input
              type="email"
              className={`w-full rounded-lg border-2 px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${errorClass}`}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={placeholder || 'example@email.com'}
              required={field.required}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {hasError}
              </p>
            )}
          </div>
        );
      
      case 'DATE':
        return (
          <div>
            <input
              type="date"
              className={`w-full rounded-lg border-2 px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${errorClass}`}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              required={field.required}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {hasError}
              </p>
            )}
          </div>
        );
      
      case 'SELECT':
        return (
          <div>
            <select
              className={`w-full rounded-lg border-2 px-4 py-3 text-sm bg-white transition-all duration-200 focus:outline-none focus:ring-2 ${errorClass}`}
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
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {hasError}
              </p>
            )}
          </div>
        );
      
      case 'CHECKBOX':
        return (
          <div>
            <div className="space-y-2">
              {field.options?.split(',').map((option, index) => {
                const isChecked = Array.isArray(value) ? value.includes(option.trim()) : false;
                return (
                  <label key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={isChecked}
                      onChange={(e) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (e.target.checked) {
                          handleInputChange(field.name, [...currentValues, option.trim()]);
                        } else {
                          handleInputChange(field.name, currentValues.filter((v: string) => v !== option.trim()));
                        }
                      }}
                    />
                    <span className="text-sm text-gray-700">{option.trim()}</span>
                  </label>
                );
              })}
            </div>
            {hasError && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {hasError}
              </p>
            )}
          </div>
        );
      
      case 'FILE':
        return (
          <div>
            <input
              type="file"
              className={`w-full rounded-lg border-2 border-dashed px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${errorClass}`}
              onChange={(e) => handleInputChange(field.name, e.target.files?.[0])}
              required={field.required}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {hasError}
              </p>
            )}
          </div>
        );
      
      default:
        return (
          <div>
            <input
              type="text"
              className={`w-full rounded-lg border-2 px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${errorClass}`}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={placeholder || undefined}
              required={field.required}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {hasError}
              </p>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center">
          <LoadingSpinner />
          <div className="text-gray-600 mt-4 text-sm">Đang tải form...</div>
        </div>
      </div>
    );
  }

  if (error || !formConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy form</h2>
          <p className="text-gray-600 mb-6">{error || 'Form này không tồn tại hoặc đã bị xóa'}</p>
          <button
            onClick={() => navigate('/')}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors shadow-md"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{formConfig.name}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{formConfig.description}</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-white font-semibold text-lg">Thông tin đăng ký</h2>
            </div>
            
            <div className="p-8 space-y-6">
              {formConfig.fields
                ?.sort((a, b) => a.sortOrder - b.sortOrder)
                .map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1" title="Bắt buộc">*</span>
                      )}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
            </div>

            {/* Submit Button Section */}
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  <span className="text-red-500">*</span> Các trường đánh dấu là bắt buộc
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 text-white font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang gửi...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Gửi đăng ký
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Mọi thông tin bạn cung cấp sẽ được bảo mật và chỉ sử dụng cho mục đích đăng ký
          </p>
        </div>
      </div>
    </div>
  );
}
