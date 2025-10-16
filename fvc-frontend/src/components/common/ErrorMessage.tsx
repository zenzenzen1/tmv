import React from 'react';
import { Alert, AlertTitle, Button, Stack } from '@mui/material';

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onRetry, className = '' }) => {
  return (
    <Stack className={className}>
      <Alert severity="error" action={onRetry ? <Button color="error" size="small" onClick={onRetry}>Try Again</Button> : undefined}>
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    </Stack>
  );
};

export default ErrorMessage;
