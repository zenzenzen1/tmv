<<<<<<< HEAD
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
=======
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/stores/authStore";
import type { SystemRole } from "@/types/user";

type RequireRoleProps = {
  roles: SystemRole[];
  children: React.ReactElement;
  redirectTo?: string;
};

export default function RequireRole({ roles, children, redirectTo = "/manage/tournaments" }: RequireRoleProps) {
  const { user } = useAuth();
  const location = useLocation();

  const currentRole = user?.systemRole;
  const allowed = currentRole ? roles.includes(currentRole) : false;

  if (!allowed) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
>>>>>>> 3aae1cca5b68af3e9a194978cfee167588b90e05
  }

  return children;
}

<<<<<<< HEAD
=======

>>>>>>> 3aae1cca5b68af3e9a194978cfee167588b90e05
