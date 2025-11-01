import React, { useState, useRef, useCallback } from 'react';
import { useFileUploadValidation, FileUploadOptions } from './FileUploadValidator';

interface SecureFileUploadProps {
  onFileSelect: (file: File | null) => void;
  onValidationError: (error: string) => void;
  options?: FileUploadOptions;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  onFileSelect,
  onValidationError,
  options = {},
  className = '',
  placeholder = 'Chọn file...',
  disabled = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { validateFile } = useFileUploadValidation(options);

  const handleFileChange = useCallback((file: File) => {
    const result = validateFile(file);
    
    if (result.isValid && result.file) {
      setSelectedFile(result.file);
      onFileSelect(result.file);
      onValidationError(''); // Clear any previous errors
    } else {
      setSelectedFile(null);
      onFileSelect(null);
      onValidationError(result.errorMessage || 'File không hợp lệ');
    }
  }, [validateFile, onFileSelect, onValidationError]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    onFileSelect(null);
    onValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          className="hidden"
          accept={options.allowedTypes?.join(',')}
          disabled={disabled}
        />
        
        {selectedFile ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-gray-700 truncate">
                  {selectedFile.name}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="text-red-500 hover:text-red-700 text-sm"
                disabled={disabled}
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-sm text-gray-600">
              {placeholder}
            </div>
            <div className="text-xs text-gray-500">
              Kéo thả file vào đây hoặc click để chọn
            </div>
            {options.allowedTypes && (
              <div className="text-xs text-gray-400">
                Định dạng: {options.allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}
              </div>
            )}
            {options.maxSizeMB && (
              <div className="text-xs text-gray-400">
                Kích thước tối đa: {options.maxSizeMB}MB
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecureFileUpload;
