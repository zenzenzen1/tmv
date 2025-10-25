export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface ValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export const validateRequired = (
  value: string,
  fieldName: string
): ValidationResult => {
  if (!value || value.trim() === "") {
    return {
      isValid: false,
      errorMessage: `${fieldName} là bắt buộc`,
    };
  }
  return { isValid: true };
};

export const validateLength = (
  value: string,
  options: { min?: number; max?: number; fieldName: string }
): ValidationResult => {
  if (options.min && value.length < options.min) {
    return {
      isValid: false,
      errorMessage: `${options.fieldName} phải có ít nhất ${options.min} ký tự`,
    };
  }
  if (options.max && value.length > options.max) {
    return {
      isValid: false,
      errorMessage: `${options.fieldName} không được vượt quá ${options.max} ký tự`,
    };
  }
  return { isValid: true };
};

export const validateEmail = (
  value: string,
  options: ValidationOptions = {}
): ValidationResult => {
  if (options.required && (!value || value.trim() === "")) {
    return {
      isValid: false,
      errorMessage: "Email là bắt buộc",
    };
  }

  if (value && value.trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return {
        isValid: false,
        errorMessage: "Email không hợp lệ",
      };
    }
  }

  return { isValid: true };
};

export const validatePhoneNumber = (
  value: string,
  options: ValidationOptions = {}
): ValidationResult => {
  if (options.required && (!value || value.trim() === "")) {
    return {
      isValid: false,
      errorMessage: "Số điện thoại là bắt buộc",
    };
  }

  if (value && value.trim() !== "") {
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ""))) {
      return {
        isValid: false,
        errorMessage: "Số điện thoại không hợp lệ",
      };
    }
  }

  return { isValid: true };
};

export const validateStudentId = (
  value: string,
  options: ValidationOptions = {}
): ValidationResult => {
  if (options.required && (!value || value.trim() === "")) {
    return {
      isValid: false,
      errorMessage: "MSSV là bắt buộc",
    };
  }

  if (value && value.trim() !== "") {
    const studentIdRegex = /^[0-9]{8,10}$/;
    if (!studentIdRegex.test(value)) {
      return {
        isValid: false,
        errorMessage: "MSSV phải có 8-10 chữ số",
      };
    }
  }

  return { isValid: true };
};
