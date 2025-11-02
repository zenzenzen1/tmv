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
  country?: "VN" | "US" | "INTL";
}

export interface StudentIdValidationOptions {
  required?: boolean;
  customMessage?: string;
  format?: "VN" | "US" | "CUSTOM";
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
      errorMessage: customMessage || "Email là bắt buộc",
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
      errorMessage: customMessage || "Email không hợp lệ",
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
  const { required = true, customMessage, country = "VN" } = options;

  // Check if required and empty
  if (required && (!phone || phone.trim().length === 0)) {
    return {
      isValid: false,
      errorMessage: customMessage || "Số điện thoại là bắt buộc",
    };
  }

  // If not required and empty, it's valid
  if (!required && (!phone || phone.trim().length === 0)) {
    return { isValid: true };
  }

  // Normalize phone: remove spaces, dashes, parentheses but keep + and digits
  const normalizedPhone = phone.replace(/[\s\-()]/g, "");

  if (country === "VN") {
    // Vietnamese phone number patterns matching backend: ^(0|\\+84)[3-9]\\d{8}$
    // Format: 0x... (10 digits) or +84x... (12 digits)
    // Where x is 3-9
    let testPhone = normalizedPhone;

    // If starts with 84 without +, add +
    if (testPhone.startsWith("84") && testPhone.length === 11) {
      testPhone = "+" + testPhone;
    }

    // Backend pattern: ^(0|\\+84)[3-9]\\d{8}$
    const vnPhoneRegex = /^(0|\+84)[3-9]\d{8}$/;

    if (!vnPhoneRegex.test(testPhone)) {
      return {
        isValid: false,
        errorMessage:
          customMessage ||
          "Số điện thoại không hợp lệ. Định dạng: 0x... hoặc +84x... (x là số 3-9, tổng 10 hoặc 12 số)",
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
  const { required = true, customMessage, format = "VN" } = options;

  // Check if required and empty
  if (required && (!studentId || studentId.trim().length === 0)) {
    return {
      isValid: false,
      errorMessage: customMessage || "MSSV là bắt buộc",
    };
  }

  // If not required and empty, it's valid
  if (!required && (!studentId || studentId.trim().length === 0)) {
    return { isValid: true };
  }

  const trimmedId = studentId.trim();

  if (format === "VN") {
    // Vietnamese student ID format matching backend: ^(HE|SE|SS|SP)?\\d{6,8}$
    // Optional prefix (HE, SE, SS, SP) + 6-8 digits
    const vnStudentIdRegex = /^(HE|SE|SS|SP)?\d{6,8}$/i;

    if (!vnStudentIdRegex.test(trimmedId)) {
      return {
        isValid: false,
        errorMessage:
          customMessage ||
          "MSSV không hợp lệ. Định dạng: (HE|SE|SS|SP)? + 6-8 chữ số",
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
  const { min = 0, max, fieldName = "Trường này" } = options;

  const trimmedText = text.trim();

  // Check minimum length
  if (trimmedText.length < min) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải có ít nhất ${min} ký tự`,
    };
  }

  // Check maximum length
  if (max && trimmedText.length > max) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được vượt quá ${max} ký tự`,
    };
  }

  return { isValid: true };
};

/**
 * Validates that a numeric value is not negative
 */
export const validateNonNegative = (
  value: string | number,
  fieldName: string = "Giá trị"
): ValidationResult => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải là số hợp lệ`,
    };
  }

  if (numValue < 0) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được âm`,
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
  fieldName: string = "Giá trị"
): ValidationResult => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải là số hợp lệ`,
    };
  }

  if (numValue < min) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải lớn hơn hoặc bằng ${min}`,
    };
  }

  if (numValue > max) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải nhỏ hơn hoặc bằng ${max}`,
    };
  }

  return { isValid: true };
};

/**
 * Validates required field
 */
export const validateRequired = (
  value: string,
  fieldName: string = "Trường này"
): ValidationResult => {
  if (!value || value.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: `${fieldName} là bắt buộc`,
    };
  }

  return { isValid: true };
};

/**
 * Sanitizes input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
};

/**
 * Validates date is in the future
 */
export const validateFutureDate = (
  dateString: string,
  fieldName: string = "Ngày"
): ValidationResult => {
  if (!dateString || dateString.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: `${fieldName} là bắt buộc`,
    };
  }

  const date = new Date(dateString);
  const now = new Date();

  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không hợp lệ`,
    };
  }

  if (date <= now) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải là ngày trong tương lai`,
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
  startFieldName: string = "Ngày bắt đầu",
  endFieldName: string = "Ngày kết thúc"
): ValidationResult => {
  if (!startDate || !endDate) {
    return {
      isValid: false,
      errorMessage: "Cả hai ngày đều phải được chọn",
    };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      isValid: false,
      errorMessage: "Ngày không hợp lệ",
    };
  }

  if (start >= end) {
    return {
      isValid: false,
      errorMessage: `${endFieldName} phải sau ${startFieldName}`,
    };
  }

  return { isValid: true };
};

export const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== "string") return "";

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "") // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "") // Remove object tags
    .replace(/<embed\b[^<]*>/gi, "") // Remove embed tags
    .replace(/<link\b[^<]*>/gi, "") // Remove link tags
    .replace(/<meta\b[^<]*>/gi, "") // Remove meta tags
    .replace(/on\w+="[^"]*"/gi, "") // Remove event handlers
    .replace(/javascript:/gi, ""); // Remove javascript protocol
};

export const validateNoSpecialChars = (
  input: string,
  fieldName: string = "Trường này"
): ValidationResult => {
  if (!input || input.trim() === "") {
    return { isValid: true };
  }

  // Allow letters, numbers, spaces, and common punctuation
  const allowedPattern =
    /^[a-zA-Z0-9\s.,!?\-_()àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s]*$/;

  if (!allowedPattern.test(input)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được chứa ký tự đặc biệt`,
    };
  }

  return { isValid: true };
};

export const validateNameFormat = (
  name: string,
  fieldName: string = "Tên"
): ValidationResult => {
  if (!name || name.trim() === "") {
    return { isValid: false, errorMessage: `${fieldName} là bắt buộc` };
  }

  const trimmedName = name.trim();

  // Check for minimum length
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải có ít nhất 2 ký tự`,
    };
  }

  // Check for maximum length
  if (trimmedName.length > 100) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được vượt quá 100 ký tự`,
    };
  }

  // Check for special characters (allow Vietnamese characters)
  const namePattern =
    /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠăâêôơ\s]+$/;
  if (!namePattern.test(trimmedName)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} chỉ được chứa chữ cái và khoảng trắng`,
    };
  }

  return { isValid: true };
};

// Phase 3: Advanced Validation Functions

export interface PasswordStrengthResult {
  isValid: boolean;
  strength: "weak" | "medium" | "strong";
  score: number; // 0-100
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
  errorMessage?: string;
}

/**
 * Validates password strength and complexity
 */
export const validatePasswordStrength = (
  password: string,
  minLength: number = 8,
  requireUppercase: boolean = true,
  requireLowercase: boolean = true,
  requireNumber: boolean = true,
  requireSpecial: boolean = true
): PasswordStrengthResult => {
  if (!password || password.length === 0) {
    return {
      isValid: false,
      strength: "weak",
      score: 0,
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      },
      errorMessage: "Mật khẩu là bắt buộc",
    };
  }

  const requirements = {
    length: password.length >= minLength,
    uppercase: requireUppercase ? /[A-Z]/.test(password) : true,
    lowercase: requireLowercase ? /[a-z]/.test(password) : true,
    number: requireNumber ? /\d/.test(password) : true,
    special: requireSpecial
      ? /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
      : true,
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;
  const totalRequirements = Object.values(requirements).length;

  const score = (metRequirements / totalRequirements) * 100;
  let strength: "weak" | "medium" | "strong" = "weak";

  if (score >= 80) {
    strength = "strong";
  } else if (score >= 60) {
    strength = "medium";
  }

  const isValid =
    requirements.length &&
    requirements.uppercase &&
    requirements.lowercase &&
    requirements.number &&
    requirements.special;

  let errorMessage = "";
  if (!requirements.length) {
    errorMessage = `Mật khẩu phải có ít nhất ${minLength} ký tự`;
  } else if (!requirements.uppercase) {
    errorMessage = "Mật khẩu phải chứa ít nhất một chữ hoa";
  } else if (!requirements.lowercase) {
    errorMessage = "Mật khẩu phải chứa ít nhất một chữ thường";
  } else if (!requirements.number) {
    errorMessage = "Mật khẩu phải chứa ít nhất một số";
  } else if (!requirements.special) {
    errorMessage = "Mật khẩu phải chứa ít nhất một ký tự đặc biệt";
  }

  return {
    isValid,
    strength,
    score,
    requirements,
    errorMessage: isValid ? undefined : errorMessage,
  };
};

/**
 * Validates password confirmation
 */
export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (!confirmPassword || confirmPassword.trim().length === 0) {
    return {
      isValid: false,
      errorMessage: "Xác nhận mật khẩu là bắt buộc",
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      errorMessage: "Mật khẩu xác nhận không khớp",
    };
  }

  return { isValid: true };
};

/**
 * Validates special character restrictions in name fields
 */
export const validateNameSpecialChars = (
  name: string,
  fieldName: string = "Tên"
): ValidationResult => {
  if (!name || name.trim() === "") {
    return { isValid: true }; // Allow empty for optional fields
  }

  // Allow letters, numbers, spaces, and basic punctuation
  const allowedPattern =
    /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠăâêôơ0-9\s.,!?\-_()]+$/;

  if (!allowedPattern.test(name.trim())) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được chứa ký tự đặc biệt`,
    };
  }

  return { isValid: true };
};

/**
 * Validates search input sanitization
 */
export const validateSearchInput = (
  searchTerm: string,
  fieldName: string = "Tìm kiếm"
): ValidationResult => {
  if (!searchTerm || searchTerm.trim() === "") {
    return { isValid: true };
  }

  // Check for potentially dangerous characters
  const dangerousPattern = /[<>'"&]/;
  if (dangerousPattern.test(searchTerm)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} chứa ký tự không hợp lệ`,
    };
  }

  // Check length
  if (searchTerm.length > 100) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được vượt quá 100 ký tự`,
    };
  }

  return { isValid: true };
};

/**
 * Validates weight range (0-200kg)
 */
export const validateWeightRange = (
  weight: string | number,
  fieldName: string = "Trọng lượng"
): ValidationResult => {
  const numValue = typeof weight === "string" ? parseFloat(weight) : weight;

  if (isNaN(numValue)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải là số hợp lệ`,
    };
  }

  if (numValue < 0) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được âm`,
    };
  }

  if (numValue > 200) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được vượt quá 200kg`,
    };
  }

  return { isValid: true };
};

/**
 * Validates duration range (1-300 minutes)
 */
export const validateDurationRange = (
  duration: string | number,
  fieldName: string = "Thời gian"
): ValidationResult => {
  const numValue =
    typeof duration === "string" ? parseFloat(duration) : duration;

  if (isNaN(numValue)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải là số hợp lệ`,
    };
  }

  if (numValue < 1) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải lớn hơn 0`,
    };
  }

  if (numValue > 300) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được vượt quá 300 phút`,
    };
  }

  return { isValid: true };
};

/**
 * Validates round count range (1-20 rounds)
 */
export const validateRoundCountRange = (
  rounds: string | number,
  fieldName: string = "Số vòng"
): ValidationResult => {
  const numValue = typeof rounds === "string" ? parseInt(rounds) : rounds;

  if (isNaN(numValue)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải là số hợp lệ`,
    };
  }

  if (numValue < 1) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải lớn hơn 0`,
    };
  }

  if (numValue > 20) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được vượt quá 20 vòng`,
    };
  }

  return { isValid: true };
};

/**
 * Validates assessor count range (1-50 assessors)
 */
export const validateAssessorCountRange = (
  assessors: string | number,
  fieldName: string = "Số giám khảo"
): ValidationResult => {
  const numValue =
    typeof assessors === "string" ? parseInt(assessors) : assessors;

  if (isNaN(numValue)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải là số hợp lệ`,
    };
  }

  if (numValue < 1) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải lớn hơn 0`,
    };
  }

  if (numValue > 50) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được vượt quá 50 người`,
    };
  }

  return { isValid: true };
};

/**
 * Validates decimal precision (1 decimal place)
 */
export const validateDecimalPrecision = (
  value: string | number,
  maxDecimals: number = 1,
  fieldName: string = "Giá trị"
): ValidationResult => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải là số hợp lệ`,
    };
  }

  const decimalPlaces = (value.toString().split(".")[1] || "").length;
  if (decimalPlaces > maxDecimals) {
    return {
      isValid: false,
      errorMessage: `${fieldName} chỉ được có tối đa ${maxDecimals} chữ số thập phân`,
    };
  }

  return { isValid: true };
};

/**
 * Validates file type
 */
export const validateFileType = (
  file: File,
  allowedTypes: string[] = ["image/jpeg", "image/png", "image/gif"],
  fieldName: string = "File"
): ValidationResult => {
  if (!file) {
    return {
      isValid: false,
      errorMessage: `${fieldName} là bắt buộc`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải có định dạng: ${allowedTypes
        .map((type) => type.split("/")[1].toUpperCase())
        .join(", ")}`,
    };
  }

  return { isValid: true };
};

/**
 * Validates file size
 */
export const validateFileSize = (
  file: File,
  maxSizeMB: number = 5,
  fieldName: string = "File"
): ValidationResult => {
  if (!file) {
    return {
      isValid: false,
      errorMessage: `${fieldName} là bắt buộc`,
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      errorMessage: `${fieldName} không được vượt quá ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
};

/**
 * Validates file format restrictions
 */
export const validateFileFormat = (
  file: File,
  allowedExtensions: string[] = [".jpg", ".jpeg", ".png", ".gif"],
  fieldName: string = "File"
): ValidationResult => {
  if (!file) {
    return {
      isValid: false,
      errorMessage: `${fieldName} là bắt buộc`,
    };
  }

  const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      errorMessage: `${fieldName} phải có định dạng: ${allowedExtensions.join(
        ", "
      )}`,
    };
  }

  return { isValid: true };
};
