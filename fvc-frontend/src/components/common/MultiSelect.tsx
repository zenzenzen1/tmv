import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  maxHeight?: string;
  className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options...',
  label,
  error,
  disabled = false,
  searchable = true,
  maxHeight = '200px',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle option selection
  const handleOptionClick = (value: string) => {
    if (disabled) return;

    const isSelected = selectedValues.includes(value);
    let newSelectedValues: string[];

    if (isSelected) {
      newSelectedValues = selectedValues.filter(v => v !== value);
    } else {
      newSelectedValues = [...selectedValues, value];
    }

    onChange(newSelectedValues);
  };

  // Handle remove selected item
  const handleRemoveSelected = (value: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (disabled) return;

    const newSelectedValues = selectedValues.filter(v => v !== value);
    onChange(newSelectedValues);
  };

  // Get selected options for display
  const selectedOptions = options.filter(option => selectedValues.includes(option.value));

  // Get display text
  const getDisplayText = () => {
    if (selectedOptions.length === 0) {
      return placeholder;
    }
    if (selectedOptions.length === 1) {
      return selectedOptions[0].label;
    }
    return `${selectedOptions.length} items selected`;
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div
        ref={dropdownRef}
        className="relative"
      >
        {/* Input/Display Area */}
        <div
          className={`
            relative w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-left shadow-sm
            focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400'}
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1 flex-1 min-w-0">
              {selectedOptions.length > 0 ? (
                selectedOptions.map((option) => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-100 text-primary-800 text-sm"
                  >
                    {option.label}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveSelected(option.value, e)}
                        className="hover:text-primary-600"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 truncate">
                  {getDisplayText()}
                </span>
              )}
            </div>
            
            <ChevronDownIcon
              className={`h-5 w-5 text-gray-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div
            className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
            style={{ maxHeight }}
          >
            {searchable && (
              <div className="p-2 border-b border-gray-200">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search options..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="max-h-60 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {searchTerm ? 'No options found' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  const isDisabled = option.disabled || disabled;

                  return (
                    <div
                      key={option.value}
                      className={`
                        relative cursor-pointer select-none px-3 py-2 text-sm
                        ${isSelected ? 'bg-primary-50 text-primary-900' : 'text-gray-900'}
                        ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100'}
                      `}
                      onClick={() => !isDisabled && handleOptionClick(option.value)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{option.label}</span>
                        {isSelected && (
                          <CheckIcon className="h-4 w-4 text-primary-600" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default MultiSelect;
