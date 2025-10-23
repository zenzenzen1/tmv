// Validation utility functions for frontend forms
// File: fvc-frontend/src/utils/validation.ts

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface LengthValidationOptions {
  min?: number;
  max?: number;
  fieldName?: string;
}

export interface EmailValidationOptions {
  required?: boolean;
  customMessage?: string;
}

export interface PhoneValidationOptions {
  required?: boolean;
  customMessage?: string;
  country?: 'VN' | 'US' | 'INTL';
}

export interface StudentIdValidationOptions {
  required?: boolean;
  customMessage?: string;
  format?: 'VN' | 'US' | 'CUSTOM';
}

/**
 * Validates email format using regex
 */
export const validateEmail = (
  email: string,
  options: EmailValidationOptions = {}
): ValidationResult => {
  const { required = true, customMessage } = options;
  
  // Check if required and empty
  if (required && (!email || email.trim().length === 0)) {
    return {
      isValid: false,
      errorMessage: customMessage || 'Email là bắt buộc'
    };
  }
  
  // If not required and empty, it's valid
  if (!required && (!email || email.trim().length === 0)) {
    return { isValid: true };
  }
  
  // Email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      errorMessage: customMessage || 'Email không hợp lệ'
    };
  }
  
  return { isValid: true };
};

/**
 * Validates Vietnamese phone number format
 */
export const validatePhoneNumber = (
  phone: string,
  options: PhoneValidationOptions = {}
): ValidationResult => {
  const { required = true, customMessage, country = 'VN' } = options;
  
  // Check if required and empty
  if (required && (!phone || phone.trim().length === 0)) {
    return {
      isValid: false,
      errorMessage: customMessage || 'Số điện thoại là bắt buộc'
    };
  }
  
  // If not required and empty, it's valid
  if (!required && (!phone || phone.trim().length === 0)) {
    return { isValid: true };
  }
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (country === 'VN') {
    // Vietnamese phone number patterns
    // Mobile: 09x, 08x, 07x, 03x, 05x (10-11 digits)
    // Landline: 02x (10-11 digits)
    const vnMobileRegex = /^(09|08|07|03|05)[0-9]{8,9}$/;
    const vnLandlineRegex = /^02[0-9]{8,9}$/;
    
    if (!vnMobileRegex.test(cleanPhone) && !vnLandlineRegex.test(cleanPhone)) {
      return {
        isValid: false,
        errorMessage: customMessage || 'Số điện thoại không hợp lệ (định dạng Việt Nam)'
      };
    }
  }
  
  return { isValid: true };
};

/**
 * Validates Vietnamese student ID format (MSSV)
 */
export const validateStudentId = (
  studentId: string,
  options: StudentIdValidationOptions = {}
): ValidationResult => {
  const { required = true, customMessage, format = 'VN' } = options;
  
  // Check if required and empty
  if (required && (!studentId || studentId.trim().length === 0)) {
    return {
      isValid: false,
      errorMessage: customMessage || 'MSSV là bắt buộc'
    };
  }
  
  // If not required and empty, it's valid
  if (!required && (!studentId || studentId.trim().length === 0)) {
    return { isValid: true };
  }
  
  const trimmedId = studentId.trim();
  
  if (format === 'VN') {
    // Vietnamese student ID format: typically 8-10 digits
    // Common patterns: 20xx xxxx (year + 4 digits) or similar
    const vnStudentIdRegex = /^[0-9]{8,10}$/;
    
    if (!vnStudentIdRegex.test(trimmedId)) {
      return {
        isValid: false,
        errorMessage: customMessage || 'MSSV không hợp lệ (8-10 chữ số)'
      };
    }
  }
  
  return { isValid: true };
};

/**
 * Validates text length
 */
export const validateLength = (
  text: string,
  options: LengthValidationOptions = {}
): ValidationResult => {
  const { min = 0, max, fieldName = 'Trường này' } = options;
  
  const trimmedText = text.trim();
  
  // Check minimum length
  if (trimmedText.length < min) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải có ít nhất ${min} ký tự`
    };
  }
  
  // Check maximum length
  if (max && trimmedText.length > max) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được vượt quá ${max} ký tự`
    };
  }
  
  return { isValid: true };
};

/**
 * Validates that a numeric value is not negative
 */
export const validateNonNegative = (
  value: string | number,
  fieldName: string = 'Giá trị'
): ValidationResult => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải là số hợp lệ`
    };
  }
  
  if (numValue < 0) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được âm`
    };
  }
  
  return { isValid: true };
};

/**
 * Validates numeric range
 */
export const validateNumericRange = (
  value: string | number,
  min: number,
  max: number,
  fieldName: string = 'Giá trị'
): ValidationResult => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải là số hợp lệ`
    };
  }
  
  if (numValue < min) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải lớn hơn hoặc bằng ${min}`
    };
  }
  
  if (numValue > max) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải nhỏ hơn hoặc bằng ${max}`
    };
  }
  
  return { isValid: true };
};

/**
 * Validates required field
 */
export const validateRequired = (
  value: string,
  fieldName: string = 'Trường này'
): ValidationResult => {
  if (!value || value.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: `${fieldName} là bắt buộc`
    };
  }
  
  return { isValid: true };
};

/**
 * Sanitizes input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validates date is in the future
 */
export const validateFutureDate = (
  dateString: string,
  fieldName: string = 'Ngày'
): ValidationResult => {
  if (!dateString || dateString.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: `${fieldName} là bắt buộc`
    };
  }
  
  const date = new Date(dateString);
  const now = new Date();
  
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không hợp lệ`
    };
  }
  
  if (date <= now) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải là ngày trong tương lai`
    };
  }
  
  return { isValid: true };
};

/**
 * Validates that start date is before end date
 */
export const validateDateRange = (
  startDate: string,
  endDate: string,
  startFieldName: string = 'Ngày bắt đầu',
  endFieldName: string = 'Ngày kết thúc'
): ValidationResult => {
  if (!startDate || !endDate) {
    return {
      isValid: false,
      errorMessage: 'Cả hai ngày đều phải được chọn'
    };
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      isValid: false,
      errorMessage: 'Ngày không hợp lệ'
    };
  }
  
  if (start >= end) {
    return {
      isValid: false,
      errorMessage: `${endFieldName} phải sau ${startFieldName}`
    };
  }
  
  return { isValid: true };
};
