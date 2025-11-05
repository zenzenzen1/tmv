import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

export default function ProfileLayout() {
  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        backgroundColor: 'background.default',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Outlet />
    </Box>
  );
}
