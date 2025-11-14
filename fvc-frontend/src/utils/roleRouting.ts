import type { SystemRole } from "@/types/user";

export const getRoleLandingRoute = (role?: SystemRole | null): string => {
  switch (role) {
    case "ADMIN":
      return "/manage/users";
    case "EXECUTIVE_BOARD":
      return "/manage/tournaments";
    case "ORGANIZATION_COMMITTEE":
      return "/manage/forms";
    case "TEACHER":
      return "/assessor/dashboard";
    case "MEMBER":
    default:
      return "/dashboard";
  }
};

export const getManageIndexRoute = (role?: SystemRole | null): string => {
  switch (role) {
    case "ADMIN":
      return "users";
    case "ORGANIZATION_COMMITTEE":
      return "forms";
    case "TEACHER":
      return "performance";
    case "MEMBER":
      return "/dashboard";
    case "EXECUTIVE_BOARD":
    default:
      return "tournaments";
  }
};
