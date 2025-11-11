import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/stores/authStore";
import type { SystemRole } from "@/types/user";
import { getRoleLandingRoute } from "@/utils/roleRouting";

type RequireRoleProps = {
  roles: SystemRole[];
  children: React.ReactElement;
  redirectTo?: string;
};

export default function RequireRole({
  roles,
  children,
  redirectTo,
}: RequireRoleProps) {
  const { user } = useAuth();
  const location = useLocation();

  const currentRole = user?.systemRole as SystemRole | undefined;
  const allowed = currentRole ? roles.includes(currentRole) : false;

  if (!allowed) {
    const fallback = redirectTo ?? getRoleLandingRoute(currentRole);
    return <Navigate to={fallback} replace state={{ from: location }} />;
  }

  return children;
}
