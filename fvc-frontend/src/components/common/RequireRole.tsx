import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { SystemRole } from '@/types/user';

interface RequireRoleProps {
  roles: SystemRole[];
  children: React.ReactElement;
  redirectTo?: string;
}

export default function RequireRole({ 
  roles, 
  children, 
  redirectTo = '/manage/tournaments' 
}: RequireRoleProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.systemRole;

  if (!userRole || !roles.includes(userRole as SystemRole)) {
    // User does not have the required role, redirect
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

