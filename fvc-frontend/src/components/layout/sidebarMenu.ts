export type MenuItem = {
  key: string;
  label: string;
  section?: string;
};

export const defaultMenuItems: MenuItem[] = [
  { key: "tournaments", label: "Danh sách giải đấu" },
  { key: "arrange", label: "Quản lý trận đấu" },
  {
    section: "Quản lí form",
    key: "tournamentForm",
    label: "Form đăng ký giải đấu",
  },
  { key: "weightClassPage", label: "Quản lí hạng cân" },
  { key: "fieldManagement", label: "Quản lí sân đấu" },
  { key: "athletes", label: "Quản lí VĐV" },
  { key: "brackets", label: "Chia nhánh đấu" },
  { section: "Thi đấu", key: "scoring", label: "Chấm điểm" },
  { section: "Quản lí nội dung", key: "forms", label: "Quyền" },
  { section: "Quản lí nội dung", key: "music", label: "Võ nhạc" },
  { section: "Quản lí form", key: "formList", label: "Form đăng ký CLB" },
  { section: "Quản lí form", key: "submittedForms", label: "Kết quả đăng ký" },
  { section: "Quản trị hệ thống", key: "users", label: "Quản lý người dùng" },
];

// Role-based menu selection
import type { SystemRole } from "@/types/user";

export const getMenuItemsByRole = (role?: SystemRole | null): MenuItem[] => {
  if (!role) return defaultMenuItems; // fallback; could also return minimal

  switch (role) {
    case "ADMIN":
      return defaultMenuItems.filter((i) => i.key === "users");
    case "EXECUTIVE_BOARD":
      return defaultMenuItems.filter((i) =>
        [
          "tournaments",
          "arrange",
          "tournamentForm",
          "formList",
          "submittedForms",
          "brackets",
          "athletes",
          "fieldManagement",
        ].includes(i.key)
      );
    case "ORGANIZATION_COMMITTEE":
      return defaultMenuItems.filter((i) =>
        ["forms", "music", "weightClassPage", "scoring"].includes(i.key)
      );
    case "MEMBER":
    case "TEACHER":
    default:
      // Minimal or read-only by default
      return defaultMenuItems.filter((i) => ["tournaments"].includes(i.key));
  }
};
