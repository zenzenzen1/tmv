export type MenuItem = {
  key: string;
  label: string;
  section?: string;
};

export const defaultMenuItems: MenuItem[] = [
  { key: "tournaments", label: "Danh sách giải đấu" },
  { key: "arrange", label: "Tạo trận Quyền & Võ nhạc" },
  { key: "cycles", label: "Chu kỳ tuyển thành viên" },
  { key: "locations", label: "Quản lý địa điểm" },
  { key: "trainingSessions", label: "Buổi tập luyện" },
  { key: "trainingCalendar", label: "Lịch tập" },
  {
    section: "Quản lí form",
    key: "tournamentForm",
    label: "Form đăng ký giải đấu",
  },
  { key: "weightClassPage", label: "Quản lí hạng cân" },
  { key: "fieldManagement", label: "Quản lí sân đấu" },
  { key: "athletes", label: "Quản lí VĐV" },
  { key: "brackets", label: "Chia nhánh đấu" },
  { section: "Thi đấu", key: "scoring", label: "Chấm điểm đối kháng" },
  {
    section: "Thi đấu",
    key: "performanceMatches",
    label: "Chấm điểm Quyền & Võ nhạc",
  },
 
  { section: "Thi đấu", key: "matchList", label: "Danh sách trận đấu" },
  { section: "Quản lí nội dung", key: "forms", label: "Quyền" },
  { section: "Quản lí nội dung", key: "music", label: "Võ nhạc" },
  { section: "Quản lí form", key: "formList", label: "Form đăng ký CLB" },
  {
    section: "Quản lí form",
    key: "submittedForms",
    label: "Kết quả đăng ký CLB",
  },
  {
    section: "Quản lí form",
    key: "results",
    label: "Kết quả đăng ký giải đấu",
  },
  {
    section: "Quản trị hệ thống",
    key: "memberManagement",
    label: "Quản lý thành viên",
  },
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
          "cycles",
          "locations",
          "trainingSessions",
          "trainingCalendar",
          "tournamentForm",
          "formList",
          "submittedForms",
          "results",
          "brackets",
          "athletes",
          "fieldManagement",
          "memberManagement",
          "matchList",
        ].includes(i.key)
      );
    case "ORGANIZATION_COMMITTEE":
      return defaultMenuItems.filter((i) =>
<<<<<<< HEAD
        [
          "forms",
          "music",
          "weightClassPage",
          "scoring",
          "performanceMatches",
        ].includes(i.key)
=======
        ["forms", "music", "weightClassPage", "scoring", "matchList"].includes(i.key)
>>>>>>> master
      );
    case "MEMBER":
    case "TEACHER":
    default:
      // Minimal or read-only by default
      return defaultMenuItems.filter((i) => ["tournaments"].includes(i.key));
  }
};
