import React from 'react';
import type { TournamentStatus } from '../../types';
import { Chip } from '@mui/material';

interface StatusBadgeProps {
  status: TournamentStatus;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getLabelAndColor = (
    s: TournamentStatus
  ): { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' } => {
    switch (s) {
      case 'DRAFT':
        return { label: 'Draft', color: 'default' };
      case 'OPEN_REGISTRATION':
        return { label: 'Open Registration', color: 'info' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', color: 'warning' };
      case 'FINISHED':
        return { label: 'Finished', color: 'success' };
      case 'CANCELLED':
        return { label: 'Cancelled', color: 'error' };
      default:
        return { label: s, color: 'default' };
    }
  };

  const { label, color } = getLabelAndColor(status);
  const sizeProp = size === 'sm' ? 'small' : size === 'lg' ? 'medium' : 'medium';

  return <Chip label={label} color={color} size={sizeProp as any} variant={color === 'default' ? 'outlined' : 'filled'} />;
};

export default StatusBadge;
