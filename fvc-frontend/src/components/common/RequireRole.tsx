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

  const currentRole = user?.systemRole as SystemRole | undefined;
  const allowed = currentRole ? roles.includes(currentRole) : false;

  if (!allowed) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
}

