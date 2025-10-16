import React from 'react';
import { Box, CircularProgress } from '@mui/material';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const getPixelSize = (s: 'sm' | 'md' | 'lg') => {
    switch (s) {
      case 'sm':
        return 16;
      case 'md':
        return 32;
      case 'lg':
        return 48;
      default:
        return 32;
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" className={className}>
      <CircularProgress size={getPixelSize(size)} color="primary" />
    </Box>
  );
};

export default LoadingSpinner;
