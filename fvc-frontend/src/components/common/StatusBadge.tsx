import React from 'react';
import type { TournamentStatus } from '../../types';

interface StatusBadgeProps {
  status: TournamentStatus;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = (status: TournamentStatus) => {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'Draft',
          className: 'bg-gray-100 text-gray-800',
        };
      case 'OPEN_REGISTRATION':
        return {
          label: 'Open Registration',
          className: 'bg-blue-100 text-blue-800',
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          className: 'bg-yellow-100 text-yellow-800',
        };
      case 'FINISHED':
        return {
          label: 'Finished',
          className: 'bg-green-100 text-green-800',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          className: 'bg-red-100 text-red-800',
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'md':
        return 'px-2.5 py-0.5 text-sm';
      case 'lg':
        return 'px-3 py-1 text-base';
      default:
        return 'px-2.5 py-0.5 text-sm';
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${config.className}
        ${sizeClasses}
      `}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
