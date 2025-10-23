import React, { useCallback } from 'react';
import { validateFileType, validateFileSize, validateFileFormat } from '../../utils/validation';

export interface FileUploadOptions {
  allowedTypes?: string[];
  maxSizeMB?: number;
  allowedExtensions?: string[];
  fieldName?: string;
}

export interface FileUploadResult {
  isValid: boolean;
  errorMessage?: string;
  file?: File;
}

export const useFileUploadValidation = (options: FileUploadOptions = {}) => {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    maxSizeMB = 5,
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'],
    fieldName = 'File'
  } = options;

  const validateFile = useCallback((file: File): FileUploadResult => {
    // Validate file type
    const typeValidation = validateFileType(file, allowedTypes, fieldName);
    if (!typeValidation.isValid) {
      return {
        isValid: false,
        errorMessage: typeValidation.errorMessage
      };
    }

    // Validate file size
    const sizeValidation = validateFileSize(file, maxSizeMB, fieldName);
    if (!sizeValidation.isValid) {
      return {
        isValid: false,
        errorMessage: sizeValidation.errorMessage
      };
    }

    // Validate file format
    const formatValidation = validateFileFormat(file, allowedExtensions, fieldName);
    if (!formatValidation.isValid) {
      return {
        isValid: false,
        errorMessage: formatValidation.errorMessage
      };
    }

    return {
      isValid: true,
      file
    };
  }, [allowedTypes, maxSizeMB, allowedExtensions, fieldName]);

  return { validateFile };
};

export default useFileUploadValidation;
