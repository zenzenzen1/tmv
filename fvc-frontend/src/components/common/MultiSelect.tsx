import React from 'react';
import { Autocomplete, TextField, Chip } from '@mui/material';

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
  searchable: _searchable = true,
  maxHeight = '200px',
  className = '',
}) => {
  return (
    <Autocomplete
      className={className}
      multiple
      disabled={disabled}
      options={options}
      disableCloseOnSelect
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(o, v) => o.value === v.value}
      value={options.filter(o => selectedValues.includes(o.value))}
      onChange={(_, values) => onChange(values.map(v => v.value))}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={!!error}
          helperText={error}
        />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip {...getTagProps({ index })} key={option.value} label={option.label} />
        ))
      }
      ListboxProps={{ style: { maxHeight } }}
      filterSelectedOptions
    />
  );
};

export default MultiSelect;
