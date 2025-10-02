export type MenuItem = {
  key: string;
  label: string;
  section?: string;
};

export const defaultMenuItems: MenuItem[] = [
  { key: "tournaments", label: "Danh sách giải đấu" },
  { key: "tournamentForm", label: "Form đăng ký giải đấu" },
  { key: "athletes", label: "Quản lí VDV" },
  { section: "Quản lí nội dung", key: "fighting", label: "Đối kháng" },
  { section: "Quản lí nội dung", key: "forms", label: "Quyền" },
  { section: "Quản lí nội dung", key: "music", label: "Võ nhạc" },
  { section: "Quản lí form", key: "submittedForms", label: "Kết quả đăng ký" },
];
